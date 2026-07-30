import os
import json
import config
from agents.base_agent import call_llm

def evaluate_eligibility(profile: dict, scheme: dict) -> dict:
    """
    Evaluates business profile details against a scheme's rules deterministically.
    Returns a dictionary containing:
        - status: "Eligible" | "Possibly Eligible" | "Not Eligible"
        - matched_conditions: list of strings
        - missing_requirements: list of strings
    """
    rules = scheme.get("rules", {})
    matched_conditions = []
    missing_requirements = []
    
    # Core variables
    sector = profile.get("businessSector")
    category = profile.get("enterpriseCategory")
    turnover = float(profile.get("annualTurnover") or 0)
    loan_req = float(profile.get("loanRequirement") or 0)
    gst_status = profile.get("gstStatus")
    udyam_status = profile.get("udyamStatus")
    gender = profile.get("ownerGender")
    social_cat = profile.get("socialCategory")
    
    is_not_eligible = False
    
    # 1. Sector Check (Core)
    allowed_sectors = rules.get("sectors")
    if allowed_sectors:
        if sector in allowed_sectors:
            matched_conditions.append(f"Business sector '{sector}' matches scheme restrictions.")
        else:
            is_not_eligible = True
            missing_requirements.append(f"Scheme is only available for sectors: {', '.join(allowed_sectors)}. Found: '{sector}'.")
            
    # 2. Enterprise Category Check (Core)
    allowed_categories = rules.get("enterprise_categories")
    if allowed_categories:
        if category in allowed_categories:
            matched_conditions.append(f"Enterprise category '{category}' is eligible.")
        else:
            is_not_eligible = True
            missing_requirements.append(f"Scheme is restricted to categories: {', '.join(allowed_categories)}. Found: '{category}'.")
            
    # 3. Maximum Turnover Check (Core)
    max_turnover = rules.get("max_turnover")
    if max_turnover:
        if turnover <= max_turnover:
            matched_conditions.append(f"Annual turnover (₹{turnover:,.2f}) is within the maximum limit (₹{max_turnover:,.2f}).")
        else:
            is_not_eligible = True
            missing_requirements.append(f"Annual turnover (₹{turnover:,.2f}) exceeds the maximum threshold of ₹{max_turnover:,.2f}.")

    # 4. Maximum Loan Requirement Check (Core)
    max_loan = rules.get("max_loan_requirement")
    if max_loan:
        if loan_req <= max_loan:
            matched_conditions.append(f"Requested loan amount (₹{loan_req:,.2f}) is within the limits (Max: ₹{max_loan:,.2f}).")
        else:
            is_not_eligible = True
            missing_requirements.append(f"Requested loan amount (₹{loan_req:,.2f}) exceeds the maximum loan eligibility of ₹{max_loan:,.2f}.")

    # 5. Owner Demographics / Social Inclusivity Check (Core)
    gender_rules = rules.get("owner_gender")
    social_cat_rules = rules.get("owner_social_category")
    
    # Stand-Up India checks for Woman OR SC/ST
    if gender_rules and social_cat_rules:
        gender_match = gender in gender_rules
        social_match = social_cat in social_cat_rules
        if gender_match or social_match:
            matched_conditions.append(f"Demographics match: Owner is {gender} / Category is {social_cat}.")
        else:
            is_not_eligible = True
            missing_requirements.append(f"Scheme is reserved for women or SC/ST communities. Found: {gender} ({social_cat}).")
    elif gender_rules:
        if gender in gender_rules:
            matched_conditions.append(f"Owner gender '{gender}' matches scheme criteria.")
        else:
            is_not_eligible = True
            missing_requirements.append(f"Scheme is restricted to genders: {', '.join(gender_rules)}.")
    elif social_cat_rules:
        if social_cat in social_cat_rules:
            matched_conditions.append(f"Owner category '{social_cat}' matches scheme criteria.")
        else:
            is_not_eligible = True
            missing_requirements.append(f"Scheme is restricted to social categories: {', '.join(social_cat_rules)}.")

    if is_not_eligible:
        return {
            "status": "Not Eligible",
            "matched_conditions": matched_conditions,
            "missing_requirements": missing_requirements
        }

    # If core criteria matches, check registrations and minimum thresholds (Soft / Actionable Criteria)
    is_possibly_eligible = False
    
    # 6. Udyam Registration Check (Soft)
    if rules.get("requires_udyam", False) and udyam_status != "Registered":
        is_possibly_eligible = True
        missing_requirements.append("Udyam/MSME Registration is required. (You can register for free on the Udyam portal).")
    elif rules.get("requires_udyam", False):
        matched_conditions.append("Udyam/MSME Registration is active.")

    # 7. GST Registration Check (Soft)
    if rules.get("requires_gst", False) and gst_status != "Registered":
        is_possibly_eligible = True
        missing_requirements.append("GST Registration is required.")
    elif rules.get("requires_gst", False):
        matched_conditions.append("GST Registration status is active.")

    # 8. Minimum Loan Requirement Check (Soft)
    min_loan = rules.get("min_loan_requirement")
    if min_loan:
        if loan_req >= min_loan:
            matched_conditions.append(f"Requested loan amount (₹{loan_req:,.2f}) meets the minimum of ₹{min_loan:,.2f}.")
        else:
            is_possibly_eligible = True
            missing_requirements.append(f"Requested loan (₹{loan_req:,.2f}) is lower than the minimum requirement of ₹{min_loan:,.2f} for this scheme.")

    if is_possibly_eligible:
        return {
            "status": "Possibly Eligible",
            "matched_conditions": matched_conditions,
            "missing_requirements": missing_requirements
        }
        
    return {
        "status": "Eligible",
        "matched_conditions": matched_conditions,
        "missing_requirements": missing_requirements
    }

def generate_groq_explanation(profile: dict, evaluation: dict, scheme_name: str, language: str = "english") -> str:
    """
    Invokes Groq (Llama 3) to summarize and explain the eligibility result.
    Falls back to a detailed local template if Groq is unavailable.
    """
    language = language.lower()
    
    # System Instruction for Explainer
    system_instruction = (
        "You are the Government Scheme Eligibility Explainer for AegisAI, a business copilot for Indian SMEs.\n"
        "Your task is to take the structured evaluation results of a government scheme check and explain "
        "them to the business owner in a simple, friendly, encouraging, and clear manner.\n"
        "Explain the reasons why they are ELIGIBLE, POSSIBLY ELIGIBLE, or NOT ELIGIBLE.\n"
        "Provide clear step-by-step guidance on what they should do next.\n"
        "Do NOT use complex financial terminology. Use simple language that a local shop owner can easily understand.\n"
        f"You MUST write your response entirely in the requested language: {language.upper()}.\n"
        "Supported languages are English, Tamil, and Hindi. If the language is Tamil, reply in Tamil (தமிழ்). "
        "If it is Hindi, reply in Hindi (हिंदी). Otherwise, reply in English."
    )
    
    prompt = (
        f"Business Details:\n"
        f"- Name: {profile.get('businessName')}\n"
        f"- Sector: {profile.get('businessSector')}\n"
        f"- Category: {profile.get('enterpriseCategory')}\n"
        f"- Turnover: Rs. {profile.get('annualTurnover')}\n"
        f"- Loan Needed: Rs. {profile.get('loanRequirement')}\n"
        f"- GST Status: {profile.get('gstStatus')}\n"
        f"- Udyam Status: {profile.get('udyamStatus')}\n"
        f"- Caste Category: {profile.get('socialCategory')}\n"
        f"- Gender: {profile.get('ownerGender')}\n\n"
        f"Scheme: {scheme_name}\n"
        f"Evaluation Result:\n"
        f"- Status: {evaluation.get('status')}\n"
        f"- Matched Conditions:\n" + "\n".join([f"  * {c}" for c in evaluation.get('matched_conditions', [])]) + "\n"
        f"- Missing / Failed Requirements:\n" + "\n".join([f"  * {r}" for r in evaluation.get('missing_requirements', [])]) + "\n\n"
        f"Generate the simplified explanation and next steps in {language.upper()}."
    )
    
    # Attempt Groq API
    if config.is_groq_available():
        try:
            return call_llm(system_instruction, prompt, provider="groq")
        except Exception as e:
            print(f"[GROQ ERROR] Failed to fetch explanation from Groq: {e}. Falling back...")
            
    # Attempt Gemini API as secondary failover if Groq failed but Gemini is available
    if config.is_gemini_available():
        try:
            return call_llm(system_instruction, prompt, provider="gemini")
        except Exception as e:
            print(f"[GEMINI ERROR] Failed failover call: {e}")
            
    # Local Offline Template Generator
    status = evaluation.get("status")
    matched = evaluation.get("matched_conditions", [])
    missing = evaluation.get("missing_requirements", [])
    
    if language == "tamil":
        status_translation = {"Eligible": "தகுதி உள்ளது", "Possibly Eligible": "ஓரளவு தகுதி பெற வாய்ப்புள்ளது", "Not Eligible": "தகுதி இல்லை"}
        title = f"**{scheme_name}** - தகுதி நிலை: **{status_translation.get(status, status)}**\n\n"
        
        body = "வணக்கம்! உங்கள் வணிக விவரங்களை சரிபார்த்தோம்.\n\n"
        if status == "Eligible":
            body += "வாழ்த்துக்கள்! இந்த திட்டத்திற்கு விண்ணப்பிக்க உங்களுக்கு முழு தகுதி உள்ளது. உங்கள் விவரங்கள் அனைத்தும் திட்ட நிபந்தனைகளுடன் ஒத்துப்போகின்றன.\n\n"
        elif status == "Possibly Eligible":
            body += "இந்த திட்டத்திற்கு நீங்கள் தகுதி பெற நல்ல வாய்ப்பு உள்ளது, ஆனால் பின்வரும் சில எளிய விவரங்களை நீங்கள் பூர்த்தி செய்ய வேண்டும்:\n"
            for m in missing:
                body += f"- {m}\n"
            body += "\n"
        else:
            body += "துரதிர்ஷ்டவசமாக, தற்போதைய நிலையில் நீங்கள் இந்த திட்டத்திற்கு தகுதி பெறவில்லை. இதற்கான காரணங்கள்:\n"
            for m in missing:
                body += f"- {m}\n"
            body += "\n"
            
        body += "**அடுத்த கட்ட நடவடிக்கைகள்:**\n"
        if status == "Eligible":
            body += "1. தேவையான ஆவணங்களை தயாராக வைக்கவும்.\n2. கீழே உள்ள அதிகாரப்பூர்வ இணைப்பை கிளிக் செய்து விண்ணப்பிக்கவும்.\n"
        elif status == "Possibly Eligible":
            body += "1. விடுபட்ட பதிவுகளை (உத்யம் அல்லது ஜிஎஸ்டி) முதலில் பெறவும்.\n2. பதிவுகள் செய்த பின் விண்ணப்பத்தை தொடங்கவும்.\n"
        else:
            body += "1. உங்களின் வணிக விவரங்களை மாற்றியமைக்க முடிந்தால் சரிபார்க்கவும்.\n2. தகுதி பெறும் மாற்று அரசு திட்டங்களை பரிசீலிக்கவும்.\n"
            
        return title + body
        
    elif language == "hindi":
        status_translation = {"Eligible": "पात्र", "Possibly Eligible": "संभावित पात्र", "Not Eligible": "पात्र नहीं"}
        title = f"**{scheme_name}** - पात्रता स्थिति: **{status_translation.get(status, status)}**\n\n"
        
        body = "नमस्ते! हमने आपके व्यवसाय विवरण का विश्लेषण किया है।\n\n"
        if status == "Eligible":
            body += "बधाई हो! आप इस योजना के लिए पूरी तरह से पात्र हैं। आपके सभी विवरण योजना के नियमों के अनुकूल हैं।\n\n"
        elif status == "Possibly Eligible":
            body += "आप इस योजना के लिए पात्र हो सकते हैं, लेकिन आपको निम्नलिखित आवश्यकताओं को पूरा करना होगा:\n"
            for m in missing:
                body += f"- {m}\n"
            body += "\n"
        else:
            body += "दुर्भाग्य से, वर्तमान मानदंडों के अनुसार आप इस योजना के लिए पात्र नहीं हैं। कारण निम्नलिखित हैं:\n"
            for m in missing:
                body += f"- {m}\n"
            body += "\n"
            
        body += "**अगले कदम:**\n"
        if status == "Eligible":
            body += "1. सभी आवश्यक सहायक दस्तावेज़ तैयार रखें।\n2. नीचे दिए गए आधिकारिक लिंक पर जाकर आवेदन प्रक्रिया शुरू करें।\n"
        elif status == "Possibly Eligible":
            body += "1. आवश्यक पंजीकरण (जैसे उद्यम या जीएसटी) प्राप्त करें।\n2. पंजीकरण पूरा होने के बाद आवेदन करें।\n"
        else:
            body += "1. क्या आप अपने व्यावसायिक विवरणों को समायोजित कर सकते हैं, यह जांचें।\n2. अन्य योजनाओं पर विचार करें जो आपके व्यवसाय के अनुकूल हों।\n"
            
        return title + body
        
    else: # English default
        title = f"**{scheme_name}** - Eligibility Status: **{status}**\n\n"
        body = f"Hello! We have evaluated your business details for **{scheme_name}**.\n\n"
        if status == "Eligible":
            body += "Congratulations! You meet all core requirements for this government scheme.\n\n"
        elif status == "Possibly Eligible":
            body += "You are likely eligible for this scheme, but you need to address the following outstanding requirements first:\n"
            for m in missing:
                body += f"- {m}\n"
            body += "\n"
        else:
            body += "Currently, you do not meet the qualifications for this scheme due to the following core mismatches:\n"
            for m in missing:
                body += f"- {m}\n"
            body += "\n"
            
        body += "**Next Steps:**\n"
        if status == "Eligible":
            body += "1. Prepare your supporting documents.\n2. Click the official link below to submit your application.\n"
        elif status == "Possibly Eligible":
            body += "1. Register/obtain missing certificates (such as Udyam or GST).\n2. Apply once the documentation is complete.\n"
        else:
            body += "1. Verify if you can adjust your application details.\n2. Review other schemes that match your profile.\n"
            
        return title + body
