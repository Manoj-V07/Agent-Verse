import os
import json
import config
from agents.base_agent import call_llm

# Multilingual offline fallback strategies for SMEs
LOCAL_FALLBACK_STRATEGIES = {
    "english": {
        "attract": {
            "title": "🎯 Goal: Attract More Customers",
            "promo": "• Introduce a 'First-time Customer' discount of 10% to incentivize new buyers.\n• Run a weekend 'Happy Hour' or buy-one-get-one-free (BOGO) offer on high-margin products.",
            "marketing": "• Claim and optimize your 'Google Business Profile' so nearby customers find you on Google Maps.\n• Print simple flyers/cards with discount coupons and distribute them within a 2km radius of your shop.",
            "retention": "• Launch a 'Refer-a-Friend' program: both the referrer and the new customer get ₹50 off their next purchase.",
            "engagement": "• Greet customers warmly and display your bestselling inventory at eye level near the entrance.\n• Collect mobile numbers to send friendly holiday greetings."
        },
        "sales": {
            "title": "🎯 Goal: Improve Sales / Average Order Value",
            "promo": "• Create bundled offers (e.g., 'Weekly Grocery Combo' or 'Dinner Meal Deal') to increase checkout size.\n• Offer a free small gift or extra discount if they purchase above a certain value (e.g., Free delivery or gift above ₹999).",
            "marketing": "• Showcase premium or high-value items near the payment counter where customers wait.\n• Use clear, visible price tags and highlight discounts in red lettering.",
            "retention": "• Offer a discount coupon valid *only* for the next 15 days to encourage faster repeat visits.",
            "engagement": "• Train staff to cross-sell gently (e.g., 'Would you like some premium tea powder to go with this sugar?')."
        },
        "retention": {
            "title": "🎯 Goal: Increase Customer Retention & Loyalty",
            "promo": "• Create a simple loyalty stamp card: Buy 5 times, get the 6th purchase at 20% off.\n• Offer special birthday or anniversary discounts (e.g., 15% off) to regular buyers.",
            "marketing": "• Build a WhatsApp Broadcast list of regular customers and send them exclusive previews of new stock.\n• Ask happy customers to leave a review on Google or Facebook.",
            "retention": "• Address regular customers by their name to make them feel valued and build a personal relationship.\n• Offer a hassle-free, friendly return/exchange policy to gain long-term trust.",
            "engagement": "• Run a feedback check: Send a short text message asking if they liked their last purchase."
        },
        "branding": {
            "title": "🎯 Goal: Strengthen Branding & Identity",
            "promo": "• Introduce branded packaging or carry bags with your business logo, address, and phone number.\n• Host a small community event or support a local charity/sports team to build positive local goodwill.",
            "marketing": "• Choose a consistent color scheme and clean layout for your store signboard and social media profile.\n• Share 'Behind the scenes' stories of how you source products or serve your community.",
            "retention": "• Ensure your customer service is exceptional; word-of-mouth is the strongest branding tool for local shops.\n• Give small branded merchandise (like calendars or keychains) to top customers on New Year.",
            "engagement": "• Maintain absolute cleanliness and well-lit displays to establish a premium, trustworthy look."
        },
        "marketing": {
            "title": "🎯 Goal: Enhance Marketing & Social Media",
            "promo": "• Run a social media giveaway: Ask users to follow your page, share your post, and tag 3 friends to win a free gift hamper.\n• Launch seasonal digital posters for local WhatsApp groups during festivals (Diwali, Pongal, Eid).",
            "marketing": "• Set up a professional Instagram and Facebook page. Post 2-3 high-quality photos or short reels of new arrivals weekly.\n• Run highly-targeted local Facebook/Instagram ads targeting users within a 5-mile radius.",
            "retention": "• Share customer testimonials and video reviews on your status updates.\n• Keep your online business hours and contact numbers updated weekly.",
            "engagement": "• Respond to all online comments and direct messages within 1 hour."
        }
    },
    "tamil": {
        "attract": {
            "title": "🎯 இலக்கு: அதிக வாடிக்கையாளர்களை ஈர்ப்பது",
            "promo": "• புதிய வாடிக்கையாளர்களை ஊக்குவிக்க முதல் வருகைக்கு 10% சிறப்பு தள்ளுபடி வழங்குங்கள்.\n• வார இறுதி நாட்களில் குறிப்பிட்ட பொருட்களுக்கு ஒன்று வாங்கினால் ஒன்று இலவசம் (BOGO) சலுகை கொடுங்கள்.",
            "marketing": "• உங்களது கடையை 'கூகுள் பிசினஸ் ப்ரொபைலில்' (Google Business Profile) பதிவு செய்து, மேப் மூலம் எளிதில் கண்டறிய உதவுங்கள்.\n• கடையைச் சுற்றியுள்ள 2 கிமீ பகுதிக்குள் தள்ளுபடி கூப்பன்கள் கொண்ட துண்டு பிரசுரங்களை விநியோகியுங்கள்.",
            "retention": "• 'நண்பரை பரிந்துரைக்கும்' (Refer-a-Friend) திட்டத்தை அறிமுகப்படுத்துங்கள்: இருவருக்குமே அடுத்த கொள்முதலில் ₹50 தள்ளுபடி கிடைக்கும்.",
            "engagement": "• வாடிக்கையாளர்களை இன்முகத்துடன் வரவேற்று, அதிகம் விற்கும் பொருட்களை நுழைவாயிலில் காட்சிப்படுத்துங்கள்."
        },
        "sales": {
            "title": "🎯 இலக்கு: விற்பனையை அதிகரிப்பது",
            "promo": "• மொத்த தொகுப்பு சலுகைகளை (Combos) உருவாக்குங்கள் (எ.கா. வாராந்திர மளிகை காம்போ) இதன் மூலம் கூடுதல் பொருட்களை வாங்குவர்.\n• ஒரு குறிப்பிட்ட தொகைக்கு மேல் (எ.கா. ₹999 மேல்) வாங்கினால் இலவச டெலிவரி அல்லது சிறு பரிசு கொடுங்கள்.",
            "marketing": "• பணம் செலுத்தும் கவுண்டர் அருகே பிரீமியம் அல்லது கவர்ச்சிகரமான பொருட்களை காட்சிப்படுத்துங்கள்.\n• தள்ளுபடிகளை சிவப்பு நிறத்தில் தெளிவாக எழுதி பார்வைக்கு வையுங்கள்.",
            "retention": "• வாடிக்கையாளர் மீண்டும் சீக்கிரம் வர ஏதுவாக, அடுத்த 15 நாட்களுக்குள் பயன்படுத்தக்கூடிய தள்ளுபடி கூப்பன்களை வழங்குங்கள்.",
            "engagement": "• ஊழியர்களை வாடிக்கையாளர்களுக்கு கூடுதல் பொருட்களை பரிந்துரைக்க பழக்குங்கள் (எ.கா. 'இந்த சர்க்கரையுடன் பிரீமியம் டீ தூள் வேண்டுமா?')."
        },
        "retention": {
            "title": "🎯 இலக்கு: வாடிக்கையாளர் தக்கவைப்பு & விசுவாசம்",
            "promo": "• எளிய அட்டை முறை: 5 முறை வாங்கினால், 6-வது முறைக்கு 20% தள்ளுபடி அட்டை வழங்குங்கள்.\n• வழக்கமான வாடிக்கையாளர்களின் பிறந்தநாள்/திருமண நாட்களுக்கு 15% சிறப்பு சலுகைகள் கொடுங்கள்.",
            "marketing": "• வாடிக்கையாளர்களுக்கு பிரத்யேக வாட்ஸ்அப் குழு அமைத்து புதிய தயாரிப்புகளின் வரவை முன்கூட்டியே பகிருங்கள்.\n• திருப்தியடைந்த வாடிக்கையாளர்களை கூகுள் வரைபடத்தில் விமர்சனம் எழுதக் கேளுங்கள்.",
            "retention": "• வழக்கமான வாடிக்கையாளர்களை பெயர் சொல்லி அழைத்து தனிப்பட்ட நன்மதிப்பை உருவாக்குங்கள்.\n• எளிய மாற்று மற்றும் திருப்பி அனுப்பும் கொள்கை மூலம் வாடிக்கையாளர் நம்பிக்கையைப் பெறுங்கள்.",
            "engagement": "• முந்தைய கொள்முதல் திருப்திகரமாக இருந்ததா என்று வாட்ஸ்அப் மூலம் கருத்து கேளுங்கள்."
        },
        "branding": {
            "title": "🎯 இலக்கு: பிராண்ட் மற்றும் அடையாளத்தை வலுப்படுத்துதல்",
            "promo": "• உங்களது லோகோ, முகவரி மற்றும் தொலைபேசி எண் அச்சிடப்பட்ட பைகளை வாடிக்கையாளர்களுக்கு வழங்குங்கள்.\n• உள்ளூர் விளையாட்டு போட்டிகள் அல்லது தொண்டு நிறுவனங்களுக்கு ஆதரவு அளித்து நற்பெயர் ஈட்டுங்கள்.",
            "marketing": "• கடையில் உள்ள விளம்பர பலகைகள் மற்றும் சமூக ஊடக பக்கங்களில் ஒரே மாதிரியான வண்ணங்கள் மற்றும் நேர்த்தியைப் பின்பற்றுங்கள்.\n• உங்கள் கடை மற்றும் பொருட்களைப் பற்றிய எளிய கதைகளை சமூக ஊடகங்களில் பகிருங்கள்.",
            "retention": "• சிறந்த வாடிக்கையாளர் சேவை வழங்குங்கள்; வாய்மொழி விளம்பரமே சிறந்த பிராண்டிங் ஆகும்.\n• புத்தாண்டு போன்ற நாட்களில் நாட்காட்டிகள் அல்லது சாவிக் கொத்துக்களை முதன்மை வாடிக்கையாளர்களுக்குப் பரிசளியுங்கள்.",
            "engagement": "• கடையை எப்போதும் தூய்மையாகவும், போதுமான வெளிச்சத்தோடு வைத்திருக்கவும்."
        },
        "marketing": {
            "title": "🎯 இலக்கு: விளம்பரம் மற்றும் சமூக ஊடகம்",
            "promo": "• சமூக ஊடகப் போட்டி: பக்கத்தைப் பின்தொடரச் செய்து, 3 நண்பர்களை டேக் செய்பவர்களுக்கு பரிசுப் பெட்டி வழங்குங்கள்.\n• பண்டிகை காலங்களில் உள்ளூர் வாட்ஸ்அப் குழுக்களில் பகிர தகுந்த வண்ணமயமான போஸ்டர்களை உருவாக்குங்கள்.",
            "marketing": "• தொழில்முறை இன்ஸ்டாகிராம் மற்றும் பேஸ்புக் பக்கத்தை அமைத்து, வாரம் 2-3 முறை புதிய பொருட்களின் வீடியோக்களை (Reels) பதிவிடுங்கள்.\n• உங்கள் கடையைச் சுற்றி 5 கிமீ தூரத்திற்குள் இருக்கும் வாடிக்கையாளர்களை இலக்காகக் கொண்டு பேஸ்புக் விளம்பரம் செய்யுங்கள்.",
            "retention": "• வாடிக்கையாளர்களின் நல்ல கருத்துக்களை உங்களது வாட்ஸ்அப் ஸ்டேட்டஸ் பக்கத்தில் பகிருங்கள்.\n• கடை திறந்திருக்கும் நேரம் மற்றும் தொடர்பு எண்களை கூகுளில் சரியாகப் பராமரியுங்கள்.",
            "engagement": "• சமூக ஊடக கருத்துக்கள் மற்றும் செய்திகளுக்கு 1 மணி நேரத்திற்குள் பதிலளியுங்கள்."
        }
    },
    "hindi": {
        "attract": {
            "title": "🎯 लक्ष्य: अधिक ग्राहक आकर्षित करना",
            "promo": "• नए ग्राहकों को आकर्षित करने के लिए पहली खरीद पर 10% की छूट प्रदान करें।\n• वीकेंड पर 'बाय वन गेट वन फ्री' (BOGO) या विशेष छूट योजनाएं लागू करें।",
            "marketing": "• अपनी दुकान को 'Google Business Profile' पर पंजीकृत करें ताकि आसपास के लोग आपको Google Maps पर ढूंढ सकें।\n• अपनी दुकान के 2 किमी के दायरे में डिस्काउंट कूपन वाले आकर्षक पर्चे बांटें।",
            "retention": "• 'रेफर-ए-फ्रेंड' कार्यक्रम शुरू करें: नए ग्राहक और पुराने ग्राहक दोनों को अगली खरीद पर ₹50 की छूट दें।",
            "engagement": "• ग्राहकों का मुस्कुराकर स्वागत करें और लोकप्रिय सामान प्रवेश द्वार के पास रखें।"
        },
        "sales": {
            "title": "🎯 लक्ष्य: बिक्री और ऑर्डर मूल्य बढ़ाना",
            "promo": "• किराना कॉम्बो या मील डील्स जैसे बंडल ऑफर पेश करें ताकि ग्राहक अधिक सामान खरीदें।\n• एक निश्चित राशि (जैसे ₹999) से अधिक की खरीद पर मुफ्त डिलीवरी या छोटा उपहार दें।",
            "marketing": "• बिलिंग काउंटर के पास चॉकलेट या विशेष उत्पाद रखें जहां ग्राहक भुगतान के लिए प्रतीक्षा करते हैं।\n• छूट के बोर्ड लाल रंग में और स्पष्ट अक्षरों में लगाएं।",
            "retention": "• अगली खरीद के लिए 15 दिनों की वैधता वाला डिस्काउंट कूपन दें ताकि ग्राहक जल्द वापस आएं।\n• स्टाफ को ग्राहकों को संबंधित सामान खरीदने की सलाह देने के लिए प्रशिक्षित करें।"
        },
        "retention": {
            "title": "🎯 लक्ष्य: ग्राहकों को बनाए रखना और वफादारी बढ़ाना",
            "promo": "• एक साधारण स्टैम्प कार्ड बनाएं: 5 बार खरीदारी करने पर 6वीं खरीदारी पर 20% की छूट दें।\n• नियमित ग्राहकों को उनके जन्मदिन या वर्षगांठ पर 15% की विशेष छूट दें।",
            "marketing": "• अपने नियमित ग्राहकों का एक WhatsApp Broadcast ग्रुप बनाएं और उन्हें नए स्टॉक की जानकारी सबसे पहले भेजें।\n• खुश ग्राहकों से Google या Facebook पर अपनी रेटिंग और समीक्षा देने का अनुरोध करें।",
            "retention": "• नियमित ग्राहकों को नाम से बुलाएं, इससे एक व्यक्तिगत संबंध और विश्वास बनता है।\n• आसान रिटर्न और एक्सचेंज पॉलिसी रखें ताकि ग्राहक आप पर लंबे समय तक भरोसा कर सकें।"
        },
        "branding": {
            "title": "🎯 लक्ष्य: ब्रांड और पहचान को मजबूत करना",
            "promo": "• अपनी दुकान के लोगो, पते और फोन नंबर वाले कैरी बैग का उपयोग करें।\n• स्थानीय आयोजनों, त्योहारों या खेल टीमों को प्रायोजित करके सामाजिक प्रतिष्ठा बढ़ाएं।",
            "marketing": "• दुकान के बोर्ड और सोशल मीडिया पोस्ट पर एक ही रंग योजना (Theme Color) और फोंट का उपयोग करें।\n• अपने उत्पादों की गुणवत्ता और दुकान की कहानी को सोशल मीडिया पर पोस्ट के माध्यम से साझा करें।",
            "retention": "• नए साल या त्योहारों पर शीर्ष ग्राहकों को कैलेंडर या चाबी के छल्ले उपहार में दें।\n• उत्कृष्ट ग्राहक सेवा प्रदान करें, क्योंकि मौखिक प्रचार (Word of Mouth) सबसे मजबूत ब्रांडिंग है।"
        },
        "marketing": {
            "title": "🎯 लक्ष्य: मार्केटिंग और सोशल मीडिया बढ़ाना",
            "promo": "• सोशल मीडिया गिवअवे: फॉलोअर्स से पोस्ट शेयर करने और 3 दोस्तों को टैग करने पर मुफ्त उपहार जीतने का अवसर दें।\n• त्योहारों (दिवाली, ईद, होली) के दौरान स्थानीय व्हाट्सएप ग्रुपों के लिए सुंदर डिजिटल पोस्टर बनाएं।",
            "marketing": "• इंस्टाग्राम और फेसबुक पर व्यावसायिक पेज बनाएं। सप्ताह में 2-3 बार नए स्टॉक के वीडियो (Reels) पोस्ट करें।\n• 5 मील के दायरे में रहने वाले लोगों को लक्षित करने के लिए फेसबुक/सामूहिक विज्ञापन चलाएं।",
            "retention": "• ग्राहकों के फीडबैक और प्रशंसापत्र को अपने व्हाट्सएप स्टेटस अपडेट पर शेयर करें।\n• गूगल पर अपनी दुकान के खुलने का समय और संपर्क विवरण अपडेट रखें।"
        }
    }
}

def generate_strategy(profile: dict, strategy_inputs: dict, language: str = "english") -> str:
    """
    Generates tailored business strategy recommendations.
    Uses Groq llama-3.3-70b-versatile. If the key is missing or the request fails,
    returns a highly customized fallback offline compilation based on the goal.
    """
    lang_clean = (language or "english").lower()
    if lang_clean not in ["english", "tamil", "hindi"]:
        lang_clean = "english"

    business_type = strategy_inputs.get("businessType", profile.get("businessType", "Small Business"))
    target_audience = strategy_inputs.get("targetAudience", "General Public")
    goals = strategy_inputs.get("goals", "attract")
    competitors = strategy_inputs.get("competitors", "")

    # Business profile details for context
    business_name = profile.get("businessName", "Our Valued Client")
    sector = profile.get("businessSector", "Retail")
    category = profile.get("enterpriseCategory", "Micro")
    state = profile.get("state", "Local")
    district = profile.get("district", "Region")
    turnover = profile.get("annualTurnover", "Undisclosed")
    employees = profile.get("employeeCount", "N/A")

    # Define system instruction
    system_instruction = (
        "You are the AegisAI Business Strategy Assistant, a seasoned SME business consultant specializing in the Indian market.\n"
        "Your mission is to provide practical, simple, and highly actionable business growth strategies tailored to the user's business profile and query.\n\n"
        "Strict Constraints:\n"
        "1. Recommend strategies such as promotional offers, seasonal campaigns, referral programs, pricing ideas, loyalty programs, social media marketing, local advertising, and customer engagement techniques.\n"
        "2. All recommendations should be simple, actionable, and tailored to the business type.\n"
        "3. You must ONLY provide business strategy suggestions. You should NOT perform competitor scraping, post content automatically, or make business decisions on behalf of the owner.\n"
        "4. Structure your response into clear markdown headings: Main Goal Strategy, Promotional Offers & Seasonal Campaigns, Pricing & Loyalty, Social Media & Local Advertising, and Customer Engagement.\n"
        f"5. IMPORTANT: Write the entire response in the requested language: {lang_clean.upper()}. Write exclusively in {lang_clean.upper()}.\n"
    )

    # Prompt details
    user_prompt = (
        f"Here is the business profile:\n"
        f"- Business Name: {business_name}\n"
        f"- Business Type: {business_type}\n"
        f"- Business Sector: {sector}\n"
        f"- Enterprise Category: {category}\n"
        f"- Location: {district}, {state}\n"
        f"- Annual Turnover: Rs. {turnover}\n"
        f"- Employee Count: {employees}\n\n"
        f"Here are the strategy request inputs:\n"
        f"- Target Audience: {target_audience}\n"
        f"- Primary Business Goal: {goals}\n"
        f"- Competitors: {competitors if competitors else 'None specified'}\n\n"
        f"Please generate the strategy now in {lang_clean.upper()}:"
    )

    try:
        # Check if Groq key is available and active
        if config.is_groq_available():
            response = call_llm(system_instruction, user_prompt, temperature=0.3, provider="groq")
            if response and len(response.strip()) > 100:
                return response
    except Exception as e:
        print(f"Strategy Agent: Groq call failed, utilizing offline fallback engine. Error: {e}")

    # Fallback response generation
    fallback_dict = LOCAL_FALLBACK_STRATEGIES[lang_clean]
    goal_key = "attract"
    goals_lower = goals.lower()

    if "sales" in goals_lower or "revenue" in goals_lower or "order" in goals_lower:
        goal_key = "sales"
    elif "retention" in goals_lower or "loyalty" in goals_lower or "repeat" in goals_lower:
        goal_key = "retention"
    elif "brand" in goals_lower or "identity" in goals_lower:
        goal_key = "branding"
    elif "marketing" in goals_lower or "social" in goals_lower or "advertise" in goals_lower:
        goal_key = "marketing"

    strategy_data = fallback_dict[goal_key]

    if lang_clean == "tamil":
        fallback_markdown = (
            f"### 💡 வணிக உத்தி மற்றும் வளர்ச்சிப் பரிந்துரைகள் (ஆஃப்லைன் உத்தி முகவர்)\n\n"
            f"**வணிகம்:** {business_name} | **வகை:** {business_type} | **இலக்கு வாடிக்கையாளர்கள்:** {target_audience}\n\n"
            f"#### 🎯 {strategy_data['title']}\n"
            f"உங்களது முதன்மை இலக்கான '{goals}' என்பதை அடைய சில எளிய உத்திகள்:\n\n"
            f"#### 📢 சந்தைப்படுத்தல் மற்றும் உள்ளூர் விளம்பரம் (Local Advertising):\n"
            f"{strategy_data['marketing']}\n\n"
            f"#### 🎁 விளம்பர சலுகைகள் மற்றும் பண்டிகை கால பிரச்சாரங்கள் (Promos):\n"
            f"{strategy_data['promo']}\n\n"
            f"#### 🔄 வாடிக்கையாளர் தக்கவைப்பு மற்றும் விசுவாச திட்டங்கள் (Loyalty):\n"
            f"{strategy_data['retention']}\n\n"
            f"#### 💡 வாடிக்கையாளர் ஈடுபாடு மற்றும் எளிய நுட்பங்கள் (Engagement):\n"
            f"{strategy_data['engagement']}\n\n"
            f"*குறிப்பு: உங்கள் Groq API விசை கிடைக்கவில்லை அல்லது பிழை ஏற்பட்டது, எனவே ஆஃப்லைன் உள்ளூர் தரவுப் பரிந்துரைகள் காட்டப்படுகின்றன.*"
        )
    elif lang_clean == "hindi":
        fallback_markdown = (
            f"### 💡 व्यावसायिक रणनीति और विकास सुझाव (ऑफ़लाइन रणनीति एजेंट)\n\n"
            f"**व्यवसाय:** {business_name} | **प्रकार:** {business_type} | **लक्षित ग्राहक (Audience):** {target_audience}\n\n"
            f"#### 🎯 {strategy_data['title']}\n"
            f"आपके प्राथमिक व्यावसायिक लक्ष्य '{goals}' को पूरा करने के लिए व्यावहारिक रणनीतियाँ:\n\n"
            f"#### 📢 विपणन और स्थानीय विज्ञापन (Local Advertising):\n"
            f"{strategy_data['marketing']}\n\n"
            f"#### 🎁 प्रचार ऑफ़र और मौसमी अभियान (Promos):\n"
            f"{strategy_data['promo']}\n\n"
            f"#### 🔄 ग्राहक प्रतिधारण और रेफरल/वफादारी कार्यक्रम (Loyalty):\n"
            f"{strategy_data['retention']}\n\n"
            f"#### 💡 ग्राहक सहभागिता तकनीकें (Engagement):\n"
            f"{strategy_data['engagement']}\n\n"
            f"*नोट: आपकी Groq API कुंजी उपलब्ध नहीं है या त्रुटि हुई, इसलिए स्थानीय ऑफ़लाइन डेटा अनुशंसाएँ दिखाई जा रही हैं।*"
        )
    else:
        fallback_markdown = (
            f"### 💡 SME Growth & Strategy Recommendations (Offline Strategy Agent)\n\n"
            f"**Business:** {business_name} | **Type:** {business_type} | **Target Audience:** {target_audience}\n\n"
            f"#### 🎯 {strategy_data['title']}\n"
            f"Tailored, actionable growth points based on your primary goal of '{goals}':\n\n"
            f"#### 📢 Marketing & Local Advertising:\n"
            f"{strategy_data['marketing']}\n\n"
            f"#### 🎁 Promotional Offers & Seasonal Campaigns:\n"
            f"{strategy_data['promo']}\n\n"
            f"#### 🔄 Customer Retention & Referral/Loyalty Programs:\n"
            f"{strategy_data['retention']}\n\n"
            f"#### 💡 Customer Engagement Techniques:\n"
            f"{strategy_data['engagement']}\n\n"
            f"*Note: Groq API key is missing or requests timed out. Displaying high-fidelity offline local recommendations.*"
        )

    return fallback_markdown
