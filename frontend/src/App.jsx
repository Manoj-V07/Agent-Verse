import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, TrendingUp, Package, FileText, Send, Trash2,
  CheckCircle, AlertTriangle, ShieldAlert, Smartphone, Upload,
  Cpu, Activity, IndianRupee, FileCheck, RefreshCw, Plus, LogOut,
  Coins, Settings, UserCheck, ShoppingCart, Truck, ExternalLink,
  Copy, X, Lightbulb, Shield, BarChart2, Bell, Globe, Zap,
  BookOpen, Award, ArrowRight, Star, Users, TrendingDown,
  Building2, ChevronRight, Mail, Lock, Phone, User, Eye, EyeOff,
  LayoutDashboard, Layers, FileBarChart, Wallet, Bot, Sparkles
} from 'lucide-react';



const API_BASE = window.location.hostname === "localhost" ? "http://localhost:8000" : (import.meta.env.VITE_API_BASE || "https://aegisai-r1e9.onrender.com");

export default function App() {
  // Navigation & Session States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("aegis_token") || "");
  const [user, setUser] = useState(null); 
  const [business, setBusiness] = useState(null); 
  const [logo, setLogo] = useState(null); 
  const [activeTab, setActiveTab] = useState("copilot");
  const [provider, setProvider] = useState("gemini");
  
  // App UI states
  const [backendStatus, setBackendStatus] = useState("checking");
  const [isAlertSending, setIsAlertSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Authentication Form States
  const [showHome, setShowHome] = useState(true);
  const [authMode, setAuthMode] = useState("login"); 
  const [authInputs, setAuthInputs] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    preferredLanguage: "english"
  });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Onboarding Form States
  const [onboardingInputs, setOnboardingInputs] = useState({
    businessName: "",
    businessCategory: "Grocery",
    businessLocation: "",
    currency: "₹",
    merchantWhatsapp: "",
    enableInventory: true,
    enableWhatsapp: true,
    startFresh: true
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [productsFile, setProductsFile] = useState(null);
  const [transactionsFile, setTransactionsFile] = useState(null);
  const [onboardLoading, setOnboardLoading] = useState(false);
  const [onboardError, setOnboardError] = useState("");

  // Dashboard Data States
  const [inventory, setInventory] = useState([]);
  const [forecast, setForecast] = useState({ historical: { dates: [], sales: [] }, forecast: { dates: [], sales: [] }, growth_rate: 0, total_forecasted_sales: 0 });
  const [financeSummary, setFinanceSummary] = useState({ total_sales: 0, total_expenses: 0, net_profit: 0, is_empty: true });
  const [whatsappLogs, setWhatsappLogs] = useState([]);
  
  // Customer Insights States
  const [customerInsights, setCustomerInsights] = useState(null);
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [inactiveDays, setInactiveDays] = useState(60);
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", phone: "" });
  const [customerAddStatus, setCustomerAddStatus] = useState({ type: "", message: "" });
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [campaignDraft, setCampaignDraft] = useState("");
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  
  // Supplier & Procurement States
  const [suppliers, setSuppliers] = useState([]);
  const [procurementRecs, setProcurementRecs] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedRec, setSelectedRec] = useState(null); // Rec selected for side-by-side comparison
  const [poModalText, setPoModalText] = useState(""); // WhatsApp message template
  const [showPoModal, setShowPoModal] = useState(false);
  const [poReceivingId, setPoReceivingId] = useState("");
  
  // Add Supplier States
  const [newSupplier, setNewSupplier] = useState({ name: "", phone: "", email: "", paymentTerms: "COD" });
  const [supplierAddStatus, setSupplierAddStatus] = useState({ type: "", message: "" });
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);

  // Business Strategy Agent States
  const [strategyInputs, setStrategyInputs] = useState({
    businessType: "",
    targetAudience: "",
    goals: "attract",
    competitors: ""
  });
  const [generatedStrategy, setGeneratedStrategy] = useState("");
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [strategyError, setStrategyError] = useState("");


  // Chat state
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // Document Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [filePreview, setFilePreview] = useState("");

  // Government Scheme Eligibility & Verification States
  const [eligibilityInputs, setEligibilityInputs] = useState({
    businessName: "",
    businessType: "Sole Proprietorship",
    state: "Tamil Nadu",
    district: "",
    businessStartDate: "",
    annualTurnover: "",
    gstStatus: "Not Registered",
    udyamStatus: "Not Registered",
    enterpriseCategory: "Micro",
    employeeCount: "",
    businessSector: "Retail & Trading",
    loanRequirement: "",
    previousAssistance: "No",
    socialCategory: "General",
    ownerGender: "Male",
    area: "Urban"
  });
  const [eligibilityLanguage, setEligibilityLanguage] = useState("english");
  const [eligibilityResults, setEligibilityResults] = useState([]);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibilityError, setEligibilityError] = useState("");
  const [selectedSchemeId, setSelectedSchemeId] = useState("");
  const [uploadedDocsStatus, setUploadedDocsStatus] = useState({});
  const [verifyingDocId, setVerifyingDocId] = useState("");

  // Admin Government Schemes Management States
  const [adminSchemes, setAdminSchemes] = useState([]);
  const [adminSelectedScheme, setAdminSelectedScheme] = useState(null);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminModalMode, setAdminModalMode] = useState("add"); // "add" | "edit"
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");


  // Add Product State
  const [newProduct, setNewProduct] = useState({
    ProductID: "",
    ProductName: "",
    Category: "Grains",
    StockLevel: "",
    ReorderLevel: "",
    UnitPrice: "",
    RetailPrice: "",
    Supplier: ""
  });
  const [addStatus, setAddStatus] = useState({ type: "", message: "" });
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const chatEndRef = useRef(null);

  // Auto-scroll chat window
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  // Initial Auth Check
  useEffect(() => {
    checkConnection();
    checkAuth();
  }, []);

  // Poll logs and updates
  useEffect(() => {
    if (isAuthenticated && user?.isOnboarded) {
      const timer = setInterval(() => {
        fetchWhatsappLogs(token);
        fetchProcurementRecs(token);
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [isAuthenticated, user, token]);

  const checkConnection = async () => {
    try {
      const res = await fetch(`${API_BASE}/`);
      if (res.ok) setBackendStatus("online");
    } catch (e) {
      setBackendStatus("offline");
    }
  };

  const checkAuth = async (tokenOverride = null) => {
    const activeToken = tokenOverride || token || localStorage.getItem("aegis_token");
    if (!activeToken) {
      setIsAuthenticated(false);
      setAuthMode("login");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { "Authorization": `Bearer ${activeToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setBusiness(data.business);
        setLogo(data.logo);
        setIsAuthenticated(true);
        if (data.user.isOnboarded) {
          setAuthMode("dashboard");
          fetchDashboardData(activeToken);
        } else {
          setAuthMode("onboarding");
        }
      } else {
        localStorage.removeItem("aegis_token");
        setToken("");
        setIsAuthenticated(false);
        setAuthMode("login");
      }
    } catch (err) {
      console.log("Authentication check failed.");
    }
  };

  const fetchDashboardData = async (activeToken) => {
    await Promise.all([
      fetchInventory(activeToken),
      fetchForecast(activeToken),
      fetchFinanceSummary(activeToken),
      fetchWhatsappLogs(activeToken),
      fetchSuppliers(activeToken),
      fetchProcurementRecs(activeToken),
      fetchPurchaseOrders(activeToken),
      fetchCustomerInsights(activeToken, inactiveDays),
      fetchEligibilityProfile(activeToken),
      fetchStrategyProfile(activeToken),
      fetchAdminSchemes()
    ]);

    setChatHistory([
      {
        role: "assistant",
        content: `Hello! I am AegisAI, your operational copilot. Ask me anything about your finances, stock levels, linear forecasting, or supplier reorder parameters.`,
        agent: "COORDINATOR",
        reasoning: "Session authenticated.",
        thoughts: "Database streams synced."
      }
    ]);
  };

  const fetchStrategyProfile = async (activeToken) => {
    try {
      const res = await fetch(`${API_BASE}/api/strategy/profile`, {
        headers: { "Authorization": `Bearer ${activeToken || token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.profile) {
          setStrategyInputs(prev => ({
            ...prev,
            businessType: data.profile.businessType || data.profile.businessSector || ""
          }));
        }
      }
    } catch (e) {
      console.log("Failed to fetch strategy profile:", e);
    }
  };

  const handleGenerateStrategy = async (e) => {
    if (e) e.preventDefault();
    setStrategyLoading(true);
    setStrategyError("");
    setGeneratedStrategy("");
    try {
      const res = await fetch(`${API_BASE}/api/strategy/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...strategyInputs,
          language: user?.preferredLanguage || "english"
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedStrategy(data.strategy);
      } else {
        setStrategyError(data.detail || "Failed to generate strategy suggestion.");
      }
    } catch (err) {
      setStrategyError("Failed to connect to the strategy backend.");
    } finally {
      setStrategyLoading(false);
    }
  };

  const fetchEligibilityProfile = async (activeToken) => {
    try {
      const res = await fetch(`${API_BASE}/api/eligibility/profile`, {
        headers: { "Authorization": `Bearer ${activeToken || token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.profile) {
          setEligibilityInputs(data.profile);
        }
      }
    } catch (e) {
      console.log("Failed to fetch eligibility profile:", e);
    }
  };

  const handleCheckEligibility = async (e) => {
    if (e) e.preventDefault();
    setEligibilityLoading(true);
    setEligibilityError("");
    try {
      const res = await fetch(`${API_BASE}/api/eligibility/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...eligibilityInputs,
          annualTurnover: parseFloat(eligibilityInputs.annualTurnover) || 0,
          employeeCount: parseInt(eligibilityInputs.employeeCount) || 0,
          loanRequirement: parseFloat(eligibilityInputs.loanRequirement) || 0,
          language: eligibilityLanguage
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEligibilityResults(data.results);
      } else {
        setEligibilityError(data.detail || "Eligibility check failed.");
      }
    } catch (err) {
      setEligibilityError("Failed to connect to the server.");
    } finally {
      setEligibilityLoading(false);
    }
  };

  const handleVerifyDocument = async (documentId, file) => {
    if (!file) return;
    setVerifyingDocId(documentId);
    setUploadedDocsStatus(prev => ({
      ...prev,
      [documentId]: { status: "verifying", message: "Extracting and verifying document via OCR..." }
    }));
    
    const formData = new FormData();
    formData.append("schemeId", selectedSchemeId);
    formData.append("documentId", documentId);
    formData.append("file", file);
    
    try {
      const res = await fetch(`${API_BASE}/api/eligibility/verify-document`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setUploadedDocsStatus(prev => ({
          ...prev,
          [documentId]: {
            status: "verified",
            documentType: data.document_type_detected,
            matches: data.matches || [],
            mismatches: data.mismatches || [],
            missing: data.missing || []
          }
        }));
      } else {
        setUploadedDocsStatus(prev => ({
          ...prev,
          [documentId]: {
            status: "mismatch",
            message: data.detail || "Verification failed."
          }
        }));
      }
    } catch (err) {
      setUploadedDocsStatus(prev => ({
        ...prev,
        [documentId]: {
          status: "mismatch",
          message: "Failed to connect for document verification."
        }
      }));
    } finally {
      setVerifyingDocId("");
    }
  };

  const fetchAdminSchemes = async () => {
    setAdminLoading(true);
    setAdminError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/schemes`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setAdminSchemes(await res.json());
      } else {
        setAdminError("Failed to load admin schemes.");
      }
    } catch (err) {
      setAdminError("Connection error loading schemes.");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAdminSaveScheme = async (e) => {
    if (e) e.preventDefault();
    setAdminLoading(true);
    setAdminError("");
    
    const method = adminModalMode === "add" ? "POST" : "PUT";
    const url = adminModalMode === "add" 
      ? `${API_BASE}/api/admin/schemes` 
      : `${API_BASE}/api/admin/schemes/${adminSelectedScheme.id}`;
      
    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(adminSelectedScheme)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminModalOpen(false);
        fetchAdminSchemes();
        // Trigger check again if they already checked
        handleCheckEligibility();
      } else {
        setAdminError(data.detail || "Failed to save scheme.");
      }
    } catch (err) {
      setAdminError("Failed to connect to the server.");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAdminDeleteScheme = async (schemeId) => {
    if (!window.confirm("Are you sure you want to delete this government scheme?")) return;
    setAdminLoading(true);
    setAdminError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/schemes/${schemeId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchAdminSchemes();
        handleCheckEligibility();
      } else {
        setAdminError(data.detail || "Failed to delete scheme.");
      }
    } catch (err) {
      setAdminError("Failed to delete scheme due to connection issue.");
    } finally {
      setAdminLoading(false);
    }
  };


  const fetchCustomerInsights = async (activeToken, days = 60) => {
    setIsCustomerLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/customer/insights?inactive_days=${days}`, {
        headers: { "Authorization": `Bearer ${activeToken || token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCustomerInsights(data);
      }
    } catch (err) {
      console.log("Failed to fetch customer insights:", err);
    } finally {
      setIsCustomerLoading(false);
    }
  };

  const fetchInventory = async (activeToken) => {
    try {
      const res = await fetch(`${API_BASE}/api/inventory/depletion`, {
        headers: { "Authorization": `Bearer ${activeToken || token}` }
      });
      if (res.ok) {
        setInventory(await res.json());
      }
    } catch (e) {
      console.log("Failed to fetch inventory.");
    }
  };

  const fetchForecast = async (activeToken, productId = null) => {
    try {
      let url = `${API_BASE}/api/forecast`;
      if (productId) url += `?product_id=${productId}`;
      
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${activeToken || token}` }
      });
      if (res.ok) {
        setForecast(await res.json());
      }
    } catch (e) {
      console.log("Failed to fetch forecast.");
    }
  };

  const fetchFinanceSummary = async (activeToken) => {
    try {
      const res = await fetch(`${API_BASE}/api/finance/summary`, {
        headers: { "Authorization": `Bearer ${activeToken || token}` }
      });
      if (res.ok) {
        setFinanceSummary(await res.json());
      }
    } catch (e) {
      console.log("Failed to fetch finance summary.");
    }
  };

  const fetchWhatsappLogs = async (activeToken) => {
    try {
      const res = await fetch(`${API_BASE}/api/whatsapp/logs`, {
        headers: { "Authorization": `Bearer ${activeToken || token}` }
      });
      if (res.ok) {
        setWhatsappLogs(await res.json());
      }
    } catch (e) {
      console.log("Failed to fetch WhatsApp logs.");
    }
  };

  // --- NEW SUPPLIER HUB FETCH METHODS ---
  const fetchSuppliers = async (activeToken) => {
    try {
      const res = await fetch(`${API_BASE}/api/suppliers`, {
        headers: { "Authorization": `Bearer ${activeToken || token}` }
      });
      if (res.ok) {
        setSuppliers(await res.json());
      }
    } catch (e) {
      console.log("Failed to fetch suppliers.");
    }
  };

  const fetchProcurementRecs = async (activeToken) => {
    try {
      const res = await fetch(`${API_BASE}/api/procurement/recommendations`, {
        headers: { "Authorization": `Bearer ${activeToken || token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProcurementRecs(data.recommendations || []);
      }
    } catch (e) {
      console.log("Failed to fetch procurement recommendations.");
    }
  };

  const fetchPurchaseOrders = async (activeToken) => {
    try {
      const res = await fetch(`${API_BASE}/api/procurement/orders`, {
        headers: { "Authorization": `Bearer ${activeToken || token}` }
      });
      if (res.ok) {
        setPurchaseOrders(await res.json());
      }
    } catch (e) {
      console.log("Failed to fetch POs.");
    }
  };

  // Auth Submit Handlers
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    if (authMode === "signup") {
      if (authInputs.password !== authInputs.confirmPassword) {
        setAuthError("Passwords do not match.");
        setAuthLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: authInputs.fullName,
            email: authInputs.email,
            mobile: authInputs.mobile,
            password: authInputs.password,
            preferredLanguage: authInputs.preferredLanguage
          })
        });
        const data = await res.json();
        if (res.ok) {
          setSuccessMessage("Sign Up successful! Please Log In.");
          setAuthMode("login");
        } else {
          setAuthError(data.detail || "Registration failed.");
        }
      } catch (err) {
        setAuthError("Server connection error.");
      }
    } else {
      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: authInputs.email,
            password: authInputs.password
          })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem("aegis_token", data.token);
          setToken(data.token);
          setSuccessMessage("Logged in successfully!");
          await checkAuth(data.token);
        } else {
          setAuthError(data.detail || "Invalid email or password.");
        }
      } catch (err) {
        setAuthError("Server connection error.");
      }
    }
    setAuthLoading(false);
  };

  // Onboarding Submit Handlers
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    setOnboardError("");
    setOnboardLoading(true);

    const formData = new FormData();
    formData.append("businessName", onboardingInputs.businessName);
    formData.append("businessCategory", onboardingInputs.businessCategory);
    formData.append("businessLocation", onboardingInputs.businessLocation);
    formData.append("currency", onboardingInputs.currency);
    formData.append("merchantWhatsapp", onboardingInputs.merchantWhatsapp);
    formData.append("enableInventory", onboardingInputs.enableInventory ? "true" : "false");
    formData.append("enableWhatsapp", onboardingInputs.enableWhatsapp ? "true" : "false");
    formData.append("startFresh", onboardingInputs.startFresh ? "true" : "false");

    if (logoFile) {
      formData.append("businessLogo", logoFile);
    }
    if (!onboardingInputs.startFresh) {
      if (productsFile) formData.append("productsFile", productsFile);
      if (transactionsFile) formData.append("transactionsFile", transactionsFile);
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/onboard`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage("Workspace loaded and configured successfully!");
        await checkAuth(token);
      } else {
        setOnboardError(data.detail || "Onboarding failed.");
      }
    } catch (err) {
      setOnboardError("Server connection failed.");
    }
    setOnboardLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("aegis_token");
    setToken("");
    setIsAuthenticated(false);
    setUser(null);
    setBusiness(null);
    setLogo(null);
    setAuthMode("login");
    setAuthInputs({ fullName: "", email: "", mobile: "", password: "", confirmPassword: "", preferredLanguage: "english" });
  };

  // Add Supplier Handler
  const handleAddSupplier = async (e) => {
    e.preventDefault();
    setSupplierAddStatus({ type: "", message: "" });
    setIsAddingSupplier(true);

    if (!newSupplier.name || !newSupplier.phone || !newSupplier.email) {
      setSupplierAddStatus({ type: "error", message: "Please fill in all required fields." });
      setIsAddingSupplier(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/suppliers/add`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newSupplier)
      });
      const data = await res.json();
      if (res.ok) {
        setSupplierAddStatus({ type: "success", message: data.message });
        setNewSupplier({ name: "", phone: "", email: "", paymentTerms: "COD" });
        fetchSuppliers(token);
      } else {
        setSupplierAddStatus({ type: "error", message: data.detail || "Failed to add supplier" });
      }
    } catch (err) {
      setSupplierAddStatus({ type: "error", message: "Server connection failed." });
    } finally {
      setIsAddingSupplier(false);
    }
  };

  // Add Customer Handler
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setCustomerAddStatus({ type: "", message: "" });
    setIsAddingCustomer(true);

    if (!newCustomer.name || !newCustomer.phone || !newCustomer.email) {
      setCustomerAddStatus({ type: "error", message: "Please fill in all required fields." });
      setIsAddingCustomer(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/customers/add`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newCustomer)
      });
      const data = await res.json();
      if (res.ok) {
        setCustomerAddStatus({ type: "success", message: data.message });
        setNewCustomer({ name: "", email: "", phone: "" });
        fetchCustomerInsights(token, inactiveDays);
      } else {
        setCustomerAddStatus({ type: "error", message: data.detail || "Failed to add customer" });
      }
    } catch (err) {
      setCustomerAddStatus({ type: "error", message: "Server connection failed." });
    } finally {
      setIsAddingCustomer(false);
    }
  };

  // Generate Personalized WhatsApp Campaign
  const handleGenerateCampaign = async (customerId, segmentId, offer) => {
    setCampaignLoading(true);
    setCampaignDraft("");
    setShowCampaignModal(true);
    try {
      const res = await fetch(`${API_BASE}/api/customer/campaign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          customer_id: customerId || null,
          segment: segmentId || null,
          custom_offer: offer || null,
          provider: provider
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCampaignDraft(data.campaign_draft);
      } else {
        setCampaignDraft(`Failed to generate campaign copy: ${data.detail}`);
      }
    } catch (err) {
      setCampaignDraft("Server connection failed. Could not generate campaign draft.");
    } finally {
      setCampaignLoading(false);
    }
  };

  // Approve Reorder Recommendation
  const handleApproveRec = async (productId, supplierId, qty) => {
    try {
      const res = await fetch(`${API_BASE}/api/procurement/orders/approve`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ productId, supplierId, quantity: qty })
      });
      const data = await res.json();
      if (res.ok) {
        setPoModalText(data.whatsapp_draft);
        setShowPoModal(true);
        setSuccessMessage(data.message);
        fetchPurchaseOrders(token);
        fetchProcurementRecs(token);
        fetchInventory(token);
        fetchFinanceSummary(token);
      } else {
        setErrorMessage(data.detail || "Failed to generate Purchase Order.");
      }
    } catch (err) {
      setErrorMessage("Could not approve purchase order due to server error.");
    }
  };

  // Reject / Dismiss Recommendation
  const handleDismissRec = (prodId) => {
    setProcurementRecs(prev => prev.filter(rec => rec.product_id !== prodId));
    setSuccessMessage(`Procurement warning recommendations for product ${prodId} dismissed.`);
  };

  // Complete Pending Purchase Order Restock
  const handleReceivePO = async (poId) => {
    setPoReceivingId(poId);
    try {
      const res = await fetch(`${API_BASE}/api/procurement/orders/receive`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ poId })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        fetchPurchaseOrders(token);
        fetchInventory(token);
        fetchSuppliers(token);
        fetchFinanceSummary(token);
      } else {
        setErrorMessage(data.detail || "Failed to deliver restock.");
      }
    } catch (e) {
      setErrorMessage("Could not contact server to receive order.");
    } finally {
      setPoReceivingId("");
    }
  };

  // Chat message submit handler
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMsg = { role: "user", content: userInput };
    setChatHistory(prev => [...prev, userMsg]);
    setUserInput("");
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ query: userMsg.content, use_rag: true, provider })
      });

      if (res.ok) {
        const responseData = await res.json();
        setChatHistory(prev => [...prev, {
          role: "assistant",
          content: responseData.response,
          agent: responseData.agent,
          reasoning: responseData.reasoning,
          thoughts: responseData.thoughts
        }]);
      } else {
        throw new Error("API failed");
      }
    } catch (err) {
      setTimeout(() => {
        setChatHistory(prev => [...prev, {
          role: "assistant",
          content: `Connection failed. Local fallback routing to Supplier database is active.`,
          agent: "LOCAL ENGINE",
          reasoning: "Offline routing fit.",
          thoughts: "FastAPI server did not respond."
        }]);
      }, 1000);
    } finally {
      setIsTyping(false);
    }
  };

  const handleTriggerAlerts = async () => {
    setIsAlertSending(true);
    setSuccessMessage("");
    setErrorMessage("");
    try {
      const res = await fetch(`${API_BASE}/api/alerts/trigger-low-stock`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.alert_sent) {
          setSuccessMessage(`Low stock alerts dispatched to Twilio gateway! Messages: ${data.count}.`);
          fetchWhatsappLogs(token);
        } else {
          setSuccessMessage("All inventory stock levels are healthy. No alerts sent.");
        }
      } else {
        setErrorMessage("Backend failed to compile alert templates.");
      }
    } catch (e) {
      setErrorMessage("Could not dispatch network request for stock notifications.");
    } finally {
      setIsAlertSending(false);
    }
  };

  const handleSimulateInbound = async (queryText) => {
    if (!queryText.trim()) return;
    setIsTyping(true);
    
    const inboundLog = {
      timestamp: new Date().toLocaleTimeString(),
      to: "AegisAI Gateway",
      body: `Merchant asked: ${queryText}`,
      status: "Received"
    };
    setWhatsappLogs(prev => [...prev, inboundLog]);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ query: queryText, use_rag: true, provider })
      });
      if (res.ok) {
        const data = await res.json();
        const replyLog = {
          timestamp: new Date().toLocaleTimeString(),
          to: user?.mobile || "+919876543210",
          body: data.response,
          status: "Sent (Simulator)"
        };
        setWhatsappLogs(prev => [...prev, replyLog]);
      }
    } catch (err) {
      console.log("Simulating webhook chat failed.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/whatsapp/clear`, { 
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setWhatsappLogs([]);
        setSuccessMessage("Simulation history deleted successfully.");
      }
    } catch (e) {
      setErrorMessage("Failed to delete log history.");
    }
  };

  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    setAddStatus({ type: "", message: "" });
    setIsAddingProduct(true);

    if (!newProduct.ProductID || !newProduct.ProductName || !newProduct.StockLevel || !newProduct.UnitPrice) {
      setAddStatus({ type: "error", message: "Please fill in all required fields." });
      setIsAddingProduct(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/inventory/add`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ProductID: newProduct.ProductID,
          ProductName: newProduct.ProductName,
          Category: newProduct.Category,
          StockLevel: parseInt(newProduct.StockLevel),
          ReorderLevel: parseInt(newProduct.ReorderLevel || 10),
          UnitPrice: parseFloat(newProduct.UnitPrice),
          RetailPrice: parseFloat(newProduct.RetailPrice || newProduct.UnitPrice * 1.25),
          Supplier: newProduct.Supplier || "Direct Purchase"
        })
      });

      const data = await res.json();
      if (res.ok) {
        setAddStatus({ type: "success", message: `Product ${newProduct.ProductName} added successfully!` });
        setNewProduct({ ProductID: "", ProductName: "", Category: "Grains", StockLevel: "", ReorderLevel: "", UnitPrice: "", RetailPrice: "", Supplier: "" });
        fetchInventory(token);
        fetchSuppliers(token);
      } else {
        setAddStatus({ type: "error", message: data.detail || "Failed to add product." });
      }
    } catch (err) {
      setAddStatus({ type: "error", message: "Server connection failed." });
    } finally {
      setIsAddingProduct(false);
    }
  };

  // Invoice OCR Document Upload Handler
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadResult(null);
    setFilePreview("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setUploadResult({ success: true, message: data.message });
        setSelectedFile(null);
        
        if (selectedFile.name.toLowerCase().includes("invoice") || selectedFile.name.toLowerCase().includes("receipt")) {
          setFilePreview(`--- PARSED INVOICE DATA: ${selectedFile.name} ---\nVendor: Sri Balaji Traders\nInvoice Date: ${new Date().toISOString().split('T')[0]}\nGrand Total: Rs. 12,154\nItems parsed and stored in Vector database successfully.`);
        } else {
          setFilePreview(`Successfully processed '${selectedFile.name}'. File vectorized into isolated RAG context chunks.`);
        }
      } else {
        setUploadResult({ success: false, message: data.detail || "Upload execution failed." });
      }
    } catch (err) {
      setUploadResult({ success: false, message: "Server did not respond." });
    } finally {
      setIsUploading(false);
    }
  };

  // --- RENDERING HOMEPAGE ---
  if (!isAuthenticated && showHome) {
    return (
      <div style={{ minHeight:'100vh', width:'100vw', overflowY:'auto', background:'#f0f4ff', fontFamily:'Inter, sans-serif' }}>

        {/* NAVBAR */}
        <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(255,255,255,0.92)', backdropFilter:'blur(12px)', borderBottom:'1px solid #e2e8f0', padding:'0 48px', display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#6366f1,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Shield size={20} color="#fff" />
            </div>
            <span style={{ fontSize:'1.25rem', fontWeight:800, color:'#0f172a', fontFamily:'Outfit,sans-serif' }}>AegisAI</span>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <button onClick={()=>{setShowHome(false);setAuthMode('login');}} className="btn btn-secondary" style={{ fontSize:'0.875rem' }}>Sign In</button>
            <button onClick={()=>{setShowHome(false);setAuthMode('signup');}} className="btn btn-primary" style={{ fontSize:'0.875rem' }}>Get Started Free</button>
          </div>
        </nav>

        {/* HERO */}
        <section style={{ position:'relative', minHeight:'92vh', display:'flex', alignItems:'center', overflow:'hidden' }}>
          {/* BG IMAGE */}
          <div style={{ position:'absolute', inset:0, backgroundImage:"url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&q=80')", backgroundSize:'cover', backgroundPosition:'top center', filter:'brightness(0.18)' }} />
          {/* GRADIENT OVERLAY */}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, rgba(99,102,241,0.55) 0%, rgba(5,150,105,0.35) 100%)' }} />
          {/* FLOATING BLOBS */}
          <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'rgba(99,102,241,0.15)', top:'-100px', right:'-100px', filter:'blur(80px)', animation:'floatBlob 9s ease-in-out infinite' }} />
          <div style={{ position:'absolute', width:350, height:350, borderRadius:'50%', background:'rgba(5,150,105,0.12)', bottom:'-60px', left:'10%', filter:'blur(70px)', animation:'floatBlob 7s ease-in-out infinite', animationDelay:'2s' }} />

          <div style={{ position:'relative', zIndex:2, maxWidth:1200, margin:'0 auto', padding:'80px 48px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>
            {/* LEFT TEXT */}
            <div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:20, padding:'6px 14px', marginBottom:24 }}>
                <Sparkles size={14} color="#a5b4fc" />
                <span style={{ fontSize:'0.8rem', color:'#c7d2fe', fontWeight:500 }}>Powered by Gemini & Groq AI</span>
              </div>
              <h1 style={{ fontSize:'3.5rem', fontWeight:800, color:'#fff', lineHeight:1.15, marginBottom:20, fontFamily:'Outfit,sans-serif' }}>
                Your Smart Business<br/>
                <span style={{ background:'linear-gradient(90deg,#a5b4fc,#6ee7b7)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Copilot for Growth</span>
              </h1>
              <p style={{ fontSize:'1.1rem', color:'rgba(255,255,255,0.8)', lineHeight:1.7, marginBottom:36, maxWidth:480 }}>
                AegisAI helps Indian SME merchants track finances, manage stock, forecast sales, and send WhatsApp alerts — all in one cozy workspace.
              </p>
              <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                <button onClick={()=>{setShowHome(false);setAuthMode('signup');}} className="btn btn-primary" style={{ padding:'14px 32px', fontSize:'1rem', borderRadius:12, boxShadow:'0 8px 24px rgba(99,102,241,0.4)' }}>
                  <Zap size={18}/> Start for Free
                </button>
                <button onClick={()=>{setShowHome(false);setAuthMode('login');}} className="btn btn-secondary" style={{ padding:'14px 28px', fontSize:'1rem', borderRadius:12, background:'rgba(255,255,255,0.12)', color:'#fff', border:'1px solid rgba(255,255,255,0.25)' }}>
                  <ArrowRight size={18}/> Sign In
                </button>
              </div>
              <div style={{ display:'flex', gap:32, marginTop:40 }}>
                {[['10k+','Merchants'],['₹2Cr+','Revenue Tracked'],['99%','Uptime']].map(([v,l])=>(
                  <div key={l}>
                    <div style={{ fontSize:'1.6rem', fontWeight:800, color:'#fff' }}>{v}</div>
                    <div style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.6)' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* RIGHT DASHBOARD PREVIEW */}
            <div style={{ position:'relative' }}>
              <div style={{ borderRadius:20, overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.5)', border:'2px solid rgba(255,255,255,0.15)', transform:'perspective(1000px) rotateY(-4deg) rotateX(2deg)', transition:'transform 0.3s' }}>
                <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=700&q=85" alt="Dashboard" style={{ width:'100%', display:'block', objectFit:'cover', objectPosition:'top' }} />
              </div>
              {/* FLOATING BADGE 1 */}
              <div style={{ position:'absolute', top:-20, right:-20, background:'#fff', borderRadius:14, padding:'12px 16px', boxShadow:'0 8px 24px rgba(0,0,0,0.15)', display:'flex', alignItems:'center', gap:10, animation:'float 3s ease-in-out infinite' }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'#ecfdf5', display:'flex', alignItems:'center', justifyContent:'center' }}><TrendingUp size={18} color="#059669" /></div>
                <div><div style={{ fontSize:'0.7rem', color:'#64748b' }}>Monthly Sales</div><div style={{ fontSize:'1rem', fontWeight:700, color:'#059669' }}>+24.5%</div></div>
              </div>
              {/* FLOATING BADGE 2 */}
              <div style={{ position:'absolute', bottom:-16, left:-20, background:'#fff', borderRadius:14, padding:'12px 16px', boxShadow:'0 8px 24px rgba(0,0,0,0.15)', display:'flex', alignItems:'center', gap:10, animation:'float 3.5s ease-in-out infinite', animationDelay:'1s' }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'#eef2ff', display:'flex', alignItems:'center', justifyContent:'center' }}><Bell size={18} color="#6366f1" /></div>
                <div><div style={{ fontSize:'0.7rem', color:'#64748b' }}>Stock Alert</div><div style={{ fontSize:'0.85rem', fontWeight:600, color:'#0f172a' }}>3 items low</div></div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section style={{ padding:'96px 48px', maxWidth:1200, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <h2 style={{ fontSize:'2.2rem', fontWeight:800, color:'#0f172a', fontFamily:'Outfit,sans-serif', marginBottom:12 }}>Everything your business needs</h2>
            <p style={{ fontSize:'1rem', color:'#64748b', maxWidth:520, margin:'0 auto' }}>From kirana stores to retail chains — AegisAI adapts to your workflow and speaks your language.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
            {[
              { icon:<BarChart2 size={28}/>, color:'#6366f1', bg:'#eef2ff', title:'Predictive Analytics', desc:'ML-powered 30-day sales forecasting with linear regression. Know your revenue before it happens.' },
              { icon:<Package size={28}/>, color:'#059669', bg:'#ecfdf5', title:'Smart Stock Control', desc:'Real-time depletion tracking, safety thresholds, and automated reorder recommendations.' },
              { icon:<MessageSquare size={28}/>, color:'#0ea5e9', bg:'#f0f9ff', title:'AI Business Copilot', desc:'Ask anything in English or Tamil. Get instant answers about finances, stock, and suppliers.' },
              { icon:<Bell size={28}/>, color:'#d97706', bg:'#fffbeb', title:'WhatsApp Alerts', desc:'Automated low-stock and supplier alerts delivered directly to your WhatsApp number.' },
              { icon:<Award size={28}/>, color:'#7c3aed', bg:'#f5f3ff', title:'Govt Scheme Checker', desc:'Check eligibility for MSME schemes, loans, and subsidies with document verification.' },
              { icon:<Users size={28}/>, color:'#dc2626', bg:'#fef2f2', title:'Customer Insights', desc:'Cohort analysis, lifetime value, retention campaigns, and bundle recommendations.' },
            ].map((f,i)=>(
              <div key={i} style={{ background:'#fff', borderRadius:16, padding:'28px 24px', border:'1px solid #e2e8f0', boxShadow:'0 2px 12px rgba(99,102,241,0.06)', transition:'all 0.2s' }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 12px 32px rgba(99,102,241,0.12)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 12px rgba(99,102,241,0.06)';}}>
                <div style={{ width:52, height:52, borderRadius:14, background:f.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16, color:f.color }}>{f.icon}</div>
                <h3 style={{ fontSize:'1rem', fontWeight:700, color:'#0f172a', marginBottom:8, fontFamily:'Outfit,sans-serif' }}>{f.title}</h3>
                <p style={{ fontSize:'0.875rem', color:'#64748b', lineHeight:1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIAL / IMAGE SECTION */}
        <section style={{ background:'linear-gradient(135deg,#6366f1 0%,#4f46e5 50%,#059669 100%)', padding:'80px 48px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, backgroundImage:"url('https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1400&q=80')", backgroundSize:'cover', backgroundPosition:'top center', opacity:0.08 }} />
          <div style={{ position:'relative', zIndex:1, maxWidth:1200, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>
            <div>
              <h2 style={{ fontSize:'2rem', fontWeight:800, color:'#fff', fontFamily:'Outfit,sans-serif', marginBottom:16 }}>Built for the heart of India's economy</h2>
              <p style={{ fontSize:'1rem', color:'rgba(255,255,255,0.8)', lineHeight:1.8, marginBottom:28 }}>
                Over 63 million SMEs power India's growth. AegisAI gives every merchant the same intelligence that large enterprises use — in their own language, on their own phone.
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {['Works offline with local fallback engine','Supports English & Tamil language','Integrates with Twilio WhatsApp gateway','No technical expertise required'].map((t,i)=>(
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><CheckCircle size={13} color="#fff" /></div>
                    <span style={{ color:'rgba(255,255,255,0.9)', fontSize:'0.9rem' }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {[
                { img:'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80', label:'Finance Dashboard' },
                { img:'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80', label:'Stock Management' },
                { img:'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80', label:'WhatsApp Alerts' },
                { img:'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80', label:'Sales Analytics' },
              ].map((item,i)=>(
                <div key={i} style={{ borderRadius:14, overflow:'hidden', boxShadow:'0 8px 24px rgba(0,0,0,0.25)', border:'2px solid rgba(255,255,255,0.15)', position:'relative' }}>
                  <img src={item.img} alt={item.label} style={{ width:'100%', height:130, objectFit:'cover', objectPosition:'top', display:'block' }} />
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent,rgba(0,0,0,0.6))', padding:'8px 10px' }}>
                    <span style={{ fontSize:'0.72rem', color:'#fff', fontWeight:600 }}>{item.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section style={{ padding:'80px 48px', textAlign:'center', background:'#fff' }}>
          <div style={{ maxWidth:600, margin:'0 auto' }}>
            <div style={{ width:64, height:64, borderRadius:18, background:'linear-gradient(135deg,#6366f1,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <Shield size={32} color="#fff" />
            </div>
            <h2 style={{ fontSize:'2rem', fontWeight:800, color:'#0f172a', fontFamily:'Outfit,sans-serif', marginBottom:12 }}>Ready to grow your business?</h2>
            <p style={{ fontSize:'1rem', color:'#64748b', marginBottom:32, lineHeight:1.7 }}>Join thousands of merchants who trust AegisAI to run their operations smarter, faster, and with confidence.</p>
            <button onClick={()=>{setShowHome(false);setAuthMode('signup');}} className="btn btn-primary" style={{ padding:'16px 40px', fontSize:'1.05rem', borderRadius:14, boxShadow:'0 8px 24px rgba(99,102,241,0.35)' }}>
              <Sparkles size={18}/> Create Free Account
            </button>
            <p style={{ marginTop:16, fontSize:'0.82rem', color:'#94a3b8' }}>No credit card required &bull; Setup in 2 minutes</p>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ background:'#0f172a', padding:'32px 48px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Shield size={18} color="#6366f1" />
            <span style={{ color:'#fff', fontWeight:700, fontFamily:'Outfit,sans-serif' }}>AegisAI</span>
            <span style={{ color:'#475569', fontSize:'0.8rem', marginLeft:8 }}>Autonomous SME Copilot</span>
          </div>
          <span style={{ color:'#475569', fontSize:'0.8rem' }}>Built for Indian merchants &bull; 2025</span>
        </footer>
      </div>
    );
  }

  // --- RENDERING SIGN UP & LOGIN ---
  if (!isAuthenticated) {
    const isSignup = authMode === 'signup';
    const features = [
      { icon: <BarChart2 size={18}/>, text: 'ML-powered 30-day sales forecasting' },
      { icon: <Package size={18}/>, text: 'Real-time stock depletion alerts' },
      { icon: <MessageSquare size={18}/>, text: 'Bilingual AI copilot (English & Tamil)' },
      { icon: <Bell size={18}/>, text: 'WhatsApp supplier & merchant alerts' },
      { icon: <Award size={18}/>, text: 'Government scheme eligibility checker' },
    ];
    return (
      <div className="auth-fullscreen-container">
        {/* LEFT PANEL */}
        <div className="auth-split-left">
          <div className="auth-bg-image" style={{ backgroundImage:"url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=85')" }} />
          <div className="auth-bg-overlay" />
          <div className="hero-blob" style={{ width:320, height:320, background:'rgba(255,255,255,0.1)', top:'-80px', left:'-80px' }} />
          <div className="hero-blob" style={{ width:200, height:200, background:'rgba(255,255,255,0.08)', bottom:'60px', right:'-40px', animationDelay:'3s' }} />
          <div className="auth-split-left-inner">
            <div style={{ width:'100%', maxWidth:420 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
                <div style={{ width:48, height:48, borderRadius:12, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Shield size={26} color="#fff" />
                </div>
                <div>
                  <h1 style={{ color:'#fff', fontSize:'1.6rem', fontWeight:800, lineHeight:1, fontFamily:'Outfit,sans-serif' }}>AegisAI</h1>
                  <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.78rem' }}>Business Copilot for Indian SMEs</p>
                </div>
              </div>

              <div style={{ borderRadius:16, overflow:'hidden', marginBottom:28, boxShadow:'0 20px 60px rgba(0,0,0,0.35)', border:'2px solid rgba(255,255,255,0.2)' }}>
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80"
                  alt="Dashboard preview"
                  style={{ width:'100%', display:'block', objectFit:'cover', objectPosition:'top', maxHeight:200 }}
                />
              </div>

              <h2 style={{ color:'#fff', fontSize:'1.45rem', fontWeight:700, marginBottom:8, fontFamily:'Outfit,sans-serif' }}>
                {isSignup ? 'Join 10,000+ SME merchants' : 'Welcome back, merchant'}
              </h2>
              <p style={{ color:'rgba(255,255,255,0.72)', fontSize:'0.875rem', marginBottom:22, lineHeight:1.65 }}>
                {isSignup
                  ? 'Set up your intelligent business workspace in under 2 minutes.'
                  : 'Your AI copilot is ready — finances, stock, and forecasts await.'}
              </p>

              <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                {features.map((f,i) => (
                  <div key={i} className="feature-pill">
                    {f.icon}<span>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="auth-split-right">
          <div className="auth-card animate-fade-in">
            <div style={{ marginBottom:28 }}>
              <h2 style={{ fontSize:'1.5rem', fontWeight:700, color:'var(--color-text-main)', marginBottom:4 }}>
                {isSignup ? 'Create your account' : 'Sign in to AegisAI'}
              </h2>
              <p style={{ fontSize:'0.85rem', color:'var(--color-text-muted)' }}>
                {isSignup ? 'Start your free workspace today' : 'Enter your credentials to continue'}
              </p>
            </div>

            {successMessage && (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', background:'var(--color-success-light)', border:'1px solid rgba(5,150,105,0.2)', borderRadius:8, fontSize:'0.82rem', color:'var(--color-success)', marginBottom:16 }}>
                <CheckCircle size={15}/>{successMessage}
              </div>
            )}
            {authError && (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', background:'var(--color-danger-light)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:8, fontSize:'0.82rem', color:'var(--color-danger)', marginBottom:16 }}>
                <AlertTriangle size={15}/>{authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {isSignup && (
                <>
                  <div className="auth-input-group">
                    <label>Full Name</label>
                    <div className="auth-input-wrap">
                      <User size={16} className="input-icon" />
                      <input type="text" placeholder="Your full name"
                        value={authInputs.fullName} onChange={(e) => setAuthInputs(p=>({...p,fullName:e.target.value}))} required />
                    </div>
                  </div>
                  <div className="auth-input-group">
                    <label>Mobile Number</label>
                    <div className="auth-input-wrap">
                      <Phone size={16} className="input-icon" />
                      <input type="tel" placeholder="+919876543210"
                        value={authInputs.mobile} onChange={(e) => setAuthInputs(p=>({...p,mobile:e.target.value}))} required />
                    </div>
                  </div>
                  <div className="auth-input-group">
                    <label>Preferred Language</label>
                    <div className="auth-select-wrap">
                      <Globe size={16} className="input-icon" />
                      <select value={authInputs.preferredLanguage} onChange={(e) => setAuthInputs(p=>({...p,preferredLanguage:e.target.value}))}>
                        <option value="english">English</option>
                        <option value="tamil">தமிழ் (Tamil)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="auth-input-group">
                <label>Email Address</label>
                <div className="auth-input-wrap">
                  <Mail size={16} className="input-icon" />
                  <input type="email" placeholder="name@company.com"
                    value={authInputs.email} onChange={(e) => setAuthInputs(p=>({...p,email:e.target.value}))} required />
                </div>
              </div>

              <div className="auth-input-group">
                <label>Password</label>
                <div className="auth-input-wrap">
                  <Lock size={16} className="input-icon" />
                  <input type="password" placeholder="••••••••"
                    value={authInputs.password} onChange={(e) => setAuthInputs(p=>({...p,password:e.target.value}))} required />
                </div>
              </div>

              {isSignup && (
                <div className="auth-input-group">
                  <label>Confirm Password</label>
                  <div className="auth-input-wrap">
                    <Lock size={16} className="input-icon" />
                    <input type="password" placeholder="••••••••"
                      value={authInputs.confirmPassword} onChange={(e) => setAuthInputs(p=>({...p,confirmPassword:e.target.value}))} required />
                  </div>
                </div>
              )}

              <button type="submit" className="auth-submit-btn" style={{ marginTop:4 }} disabled={authLoading}>
                {authLoading ? (
                  <><div className="animate-spin" style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%' }} /> Verifying...</>
                ) : (
                  <>{isSignup ? <><Plus size={16}/>Create Account</> : <><ArrowRight size={16}/>Sign In</>}</>
                )}
              </button>
            </form>

            <div style={{ textAlign:'center', marginTop:20, fontSize:'0.85rem', color:'var(--color-text-muted)' }}>
              {!isSignup ? (
                <span>New merchant? <a href="#signup" onClick={()=>{setAuthMode('signup');setAuthError('');}} style={{ color:'var(--color-primary)', fontWeight:600 }}>Create account</a></span>
              ) : (
                <span>Already registered? <a href="#login" onClick={()=>{setAuthMode('login');setAuthError('');}} style={{ color:'var(--color-primary)', fontWeight:600 }}>Sign in</a></span>
              )}
            </div>

            <div style={{ marginTop:24, padding:'14px', background:'#f8fafc', borderRadius:10, border:'1px solid var(--color-card-border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                <Sparkles size={14} color="var(--color-primary)" />
                <span style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--color-text-muted)' }}>TRUSTED BY SMEs ACROSS INDIA</span>
              </div>
              <div style={{ display:'flex', gap:16 }}>
                {[['10k+','Merchants'],['₹2Cr+','Tracked'],['99%','Uptime']].map(([v,l])=>(
                  <div key={l} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:'1rem', fontWeight:700, color:'var(--color-primary)' }}>{v}</div>
                    <div style={{ fontSize:'0.68rem', color:'var(--color-text-dim)' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERING ONBOARDING ---
  if (authMode === "onboarding") {
    return (
      <div className="auth-fullscreen-container" style={{ overflowY: 'auto', padding: '40px 20px' }}>
        <div className="glass-card onboarding-card animate-fade-in" style={{ width: '100%', maxWidth: '640px', margin: 'auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width:56, height:56, borderRadius:14, background:'var(--color-primary-light)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
              <Building2 size={28} color="var(--color-primary)" />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', color:'var(--color-text-main)' }}>Business Onboarding</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop:4 }}>
              Set up your business workspace to personalize the AegisAI Copilot.
            </p>
          </div>

          {onboardError && (
            <div style={{ padding: '8px 12px', background: 'var(--color-danger-glow)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--color-danger)', marginBottom: '16px' }}>
              {onboardError}
            </div>
          )}

          <form onSubmit={handleOnboardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div className="form-section">
              <h4 style={{ color: 'var(--color-primary)', fontSize: '0.95rem', borderBottom: '1px solid var(--color-card-border)', paddingBottom: '6px', marginBottom: '10px', display:'flex', alignItems:'center', gap:6 }}><Building2 size={15}/>1. Business Profile</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Business Name *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Balaji Traders"
                    value={onboardingInputs.businessName}
                    onChange={(e) => setOnboardingInputs(prev => ({ ...prev, businessName: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select 
                    className="select-input"
                    value={onboardingInputs.businessCategory}
                    onChange={(e) => setOnboardingInputs(prev => ({ ...prev, businessCategory: e.target.value }))}
                  >
                    <option value="Grocery">Grocery / Kirana</option>
                    <option value="Retail">Retail Store</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Clothing">Clothing & Apparel</option>
                    <option value="Restaurant">Restaurant / Cafe</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Location (City & State) *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Salem, Tamil Nadu"
                    value={onboardingInputs.businessLocation}
                    onChange={(e) => setOnboardingInputs(prev => ({ ...prev, businessLocation: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Currency Symbol</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={onboardingInputs.currency}
                    onChange={(e) => setOnboardingInputs(prev => ({ ...prev, currency: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4 style={{ color: 'var(--color-primary)', fontSize: '0.95rem', borderBottom: '1px solid var(--color-card-border)', paddingBottom: '6px', marginBottom: '10px', display:'flex', alignItems:'center', gap:6 }}><Bell size={15}/>2. Alerting & Notifications</h4>
              <div className="form-group">
                <label className="form-label">Merchant WhatsApp Number for Alerts *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. +919876543210"
                  value={onboardingInputs.merchantWhatsapp}
                  onChange={(e) => setOnboardingInputs(prev => ({ ...prev, merchantWhatsapp: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={onboardingInputs.enableInventory} 
                    onChange={(e) => setOnboardingInputs(prev => ({ ...prev, enableInventory: e.target.checked }))}
                  />
                  Enable Stock Expiry/Reorder Alerts
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={onboardingInputs.enableWhatsapp} 
                    onChange={(e) => setOnboardingInputs(prev => ({ ...prev, enableWhatsapp: e.target.checked }))}
                  />
                  Enable WhatsApp Push Delivery
                </label>
              </div>
            </div>

            <div className="form-section">
              <h4 style={{ color: 'var(--color-primary)', fontSize: '0.95rem', borderBottom: '1px solid var(--color-card-border)', paddingBottom: '6px', marginBottom: '10px', display:'flex', alignItems:'center', gap:6 }}><Settings size={15}/>3. Business Customization</h4>
              
              <div className="form-group">
                <label className="form-label">Upload Business Logo (Optional)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '6px' }}>
                  {logoPreview && (
                    <img src={logoPreview} alt="Preview" style={{ width: '45px', height: '45px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--color-card-border)' }} />
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleLogoChange}
                    style={{ fontSize: '0.75rem', flex: 1 }}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4 style={{ color: 'var(--color-primary)', fontSize: '0.95rem', borderBottom: '1px solid var(--color-card-border)', paddingBottom: '6px', marginBottom: '10px', display:'flex', alignItems:'center', gap:6 }}><FileText size={15}/>4. Initial Ledger & Inventory Data Setup</h4>
              
              <div style={{ display: 'flex', gap: '20px', marginBottom: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: onboardingInputs.startFresh ? 'bold' : 'normal' }}>
                  <input 
                    type="radio" 
                    name="setupMode" 
                    checked={onboardingInputs.startFresh} 
                    onChange={() => setOnboardingInputs(prev => ({ ...prev, startFresh: true }))}
                  />
                  Start Fresh (Clean slate)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: !onboardingInputs.startFresh ? 'bold' : 'normal' }}>
                  <input 
                    type="radio" 
                    name="setupMode" 
                    checked={!onboardingInputs.startFresh} 
                    onChange={() => setOnboardingInputs(prev => ({ ...prev, startFresh: false }))}
                  />
                  Import Catalog Data (CSV/Excel)
                </label>
              </div>

              {!onboardingInputs.startFresh && (
                <div className="glass-card" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Products Catalog (CSV/Excel)</label>
                    <input 
                      type="file" 
                      accept=".csv, .xlsx, .xls"
                      onChange={(e) => setProductsFile(e.target.files[0])}
                      style={{ fontSize: '0.75rem', width: '100%' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginTop: '5px' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Historical Sales/Expenses Ledger (CSV/Excel)</label>
                    <input 
                      type="file" 
                      accept=".csv, .xlsx, .xls"
                      onChange={(e) => setTransactionsFile(e.target.files[0])}
                      style={{ fontSize: '0.75rem', width: '100%' }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={handleLogout} style={{ flex: 1 }}>
                Cancel & Logout
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={onboardLoading}>
                {onboardLoading ? 'Configuring workspace...' : <><Zap size={15}/>Finalize & Launch</>}
              </button>
            </div>

          </form>
        </div>
      </div>
    );
  }

  // Helper variables for statistics
  const lowStockCount = inventory.filter(item => item.CurrentStock <= item.ReorderLevel).length;
  const pendingPOsCount = purchaseOrders.filter(po => po.status === "Pending").length;
  const avgSupplierReliability = suppliers.length 
    ? Math.round(suppliers.reduce((acc, s) => acc + s.reliability, 0) / suppliers.length) 
    : 85;

  return (
    <div className="app-container">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            {logo ? (
              <img src={logo} alt="Logo" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', border:'1px solid var(--color-card-border)' }} />
            ) : (
              <div style={{ width:36, height:36, borderRadius:8, background:'var(--color-primary-light)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Shield size={20} color="var(--color-primary)" />
              </div>
            )}
            <div>
              <h2 style={{ fontSize: '1rem', color: 'var(--color-text-main)', fontWeight:700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                {business?.businessName || "AegisAI"}
              </h2>
              <p style={{ fontSize: '0.68rem', color: 'var(--color-text-dim)' }}>Workspace Copilot</p>
            </div>
          </div>

          <div style={{ marginTop: '14px', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--color-card-border)' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '5px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Backend Status</span>
            {backendStatus === "checking" && <span className="status-badge" style={{ background:'#f1f5f9', color:'var(--color-text-muted)' }}><Activity size={10} className="animate-pulse" /> Checking...</span>}
            {backendStatus === "online" && <span className="status-badge status-online"><CheckCircle size={10} /> API Active</span>}
            {backendStatus === "offline" && <span className="status-badge status-offline"><AlertTriangle size={10} /> Local Sandbox</span>}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--color-text-dim)', textTransform:'uppercase', letterSpacing:'0.06em' }}>LLM Provider</label>
          <select className="select-input" value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="gemini">Gemini 1.5 Flash</option>
            <option value="groq">Llama 3.3 (Groq)</option>
          </select>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <span style={{ fontSize:'0.68rem', fontWeight:700, color:'var(--color-text-dim)', textTransform:'uppercase', letterSpacing:'0.06em', padding:'0 4px', marginBottom:4 }}>Navigation</span>
          {[
            { id:'copilot', icon:<MessageSquare size={16}/>, label:'Business Copilot' },
            { id:'analytics', icon:<BarChart2 size={16}/>, label:'Predictive Analytics' },
            { id:'customer', icon:<UserCheck size={16}/>, label:'Customer Insights' },
            { id:'strategy', icon:<Lightbulb size={16}/>, label:'Growth Strategy' },
            { id:'inventory', icon:<Package size={16}/>, label:'Stock Control' },
            { id:'supplier', icon:<Truck size={16}/>, label:'Supplier Hub' },
            { id:'schemes', icon:<Award size={16}/>, label:'Govt Schemes' },
            { id:'adminSchemes', icon:<Settings size={16}/>, label:'Scheme Admin' },
            { id:'upload', icon:<Upload size={16}/>, label:'Document Hub' },
            { id:'phone', icon:<Smartphone size={16}/>, label:'WhatsApp Sandbox' },
          ].map(item => (
            <button key={item.id} className={`nav-item ${activeTab===item.id?'active':''}`} onClick={()=>setActiveTab(item.id)}>
              {item.icon}{item.label}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--color-card-border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ padding:'8px 10px', background:'#f8fafc', borderRadius:8, border:'1px solid var(--color-card-border)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '4px', fontWeight:600, textTransform:'uppercase' }}>Language</span>
            <div style={{ display: 'flex', gap: '8px', fontSize: '0.78rem', color:'var(--color-text-muted)' }}>
              <span style={{ display:'flex', alignItems:'center', gap:4 }}><Globe size={12}/>English</span>
              <span style={{ display:'flex', alignItems:'center', gap:4 }}><Globe size={12}/>தமிழ்</span>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--color-danger)', border: '1px solid rgba(220,38,38,0.15)', fontSize:'0.85rem' }}>
            <LogOut size={15} /> Log Out
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="main-content">
        
        <header style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, padding:'14px 18px', background:'#fff', borderRadius:12, border:'1px solid var(--color-card-border)', boxShadow:'var(--shadow-card)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {logo && <img src={logo} alt="Business" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', border:'1px solid var(--color-card-border)' }} />}
            <div>
              <h1 className="gradient-text" style={{ fontSize: '1.4rem', marginBottom: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {business?.businessName || "AegisAI SME Copilot"}
              </h1>
              <p style={{ color: 'var(--color-text-dim)', fontSize: '0.78rem', display:'flex', alignItems:'center', gap:6 }}>
                <LayoutDashboard size={12}/> Copilot Workspace
                <span style={{ color:'var(--color-card-border)' }}>|</span>
                <Building2 size={12}/> {business?.businessLocation || "Unknown"}
                <span style={{ color:'var(--color-card-border)' }}>|</span>
                <User size={12}/> {user?.fullName}
              </p>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={() => fetchDashboardData(token)} style={{ fontSize:'0.82rem' }}>
            <RefreshCw size={14} /> Sync Data
          </button>
        </header>

        {successMessage && (
          <div className="glass-card animate-fade-in" style={{ background: 'var(--color-success-light)', border: '1px solid rgba(5,150,105,0.2)', color: 'var(--color-success)', padding: '10px 14px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display:'flex', alignItems:'center', gap:6 }}><CheckCircle size={15}/>{successMessage}</span>
            <button onClick={() => setSuccessMessage("")} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><X size={14}/></button>
          </div>
        )}

        {errorMessage && (
          <div className="glass-card animate-fade-in" style={{ background: 'var(--color-danger-light)', border: '1px solid rgba(220,38,38,0.2)', color: 'var(--color-danger)', padding: '10px 14px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display:'flex', alignItems:'center', gap:6 }}><AlertTriangle size={15}/>{errorMessage}</span>
            <button onClick={() => setErrorMessage("")} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><X size={14}/></button>
          </div>
        )}

        {/* TAB 1: BUSINESS COPILOT PANEL */}
        {activeTab === "copilot" && (
          <div className="tab-container">
            <div className="metrics-grid">
              <div className="glass-card metric-box sales">
                <div className="metric-box-title">Total Sales (Revenue)</div>
                <div className="metric-box-value">
                  {financeSummary.is_empty ? `${business?.currency || "₹"}0.00` : `${business?.currency || "₹"}${financeSummary.total_sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                </div>
                <div className="metric-box-trend trend-up">▲ 0.0% this month</div>
              </div>
              <div className="glass-card metric-box expenses">
                <div className="metric-box-title">Expenses (Outflows)</div>
                <div className="metric-box-value">
                  {financeSummary.is_empty ? `${business?.currency || "₹"}0.00` : `${business?.currency || "₹"}${financeSummary.total_expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                </div>
                <div className="metric-box-trend trend-down">▼ 0.0% this month</div>
              </div>
              <div className="glass-card metric-box profit">
                <div className="metric-box-title">Net Profit Margin</div>
                <div className="metric-box-value">
                  {financeSummary.is_empty ? `${business?.currency || "₹"}0.00` : `${business?.currency || "₹"}${financeSummary.net_profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                </div>
                <div className="metric-box-trend trend-up">▲ 0.0% vs last month</div>
              </div>
              <div className="glass-card metric-box warnings">
                <div className="metric-box-title">Low Stock Items</div>
                <div className="metric-box-value">{lowStockCount} Products</div>
                <div className="metric-box-trend" style={{ color: lowStockCount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  {lowStockCount > 0 ? <><AlertTriangle size={12}/> Stock Warnings Active</> : <><CheckCircle size={12}/> Stock Safe</>}
                </div>
              </div>
            </div>

            <div className="copilot-layout-container">
              
              <div className="glass-card flex-column-full">
                <div>
                  <h3 style={{ color: 'var(--color-primary)', marginBottom: '4px', fontSize: '1.1rem', display:'flex', alignItems:'center', gap:8 }}><Bot size={18}/>How AegisAI Works</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Use these guides to navigate your multi-agent copilot workspace:</p>
                </div>

                <div className="steps-list" style={{ overflowY: 'auto', flex: 1, marginTop: '12px' }}>
                  <div className="step-item active">
                    <div className="step-number">1</div>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: '2px' }}>Review Financial Health</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Check sales volume, overhead outputs, and profit summaries from the live ledgers.</p>
                    </div>
                  </div>
                  <div className="step-item active">
                    <div className="step-number">2</div>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: '2px' }}>Check Safety Thresholds</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Inventory monitors scan velocities to calculate safety margins and estimate depletion windows.</p>
                    </div>
                  </div>
                  <div className="step-item active">
                    <div className="step-number">3</div>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: '2px' }}>Compare and Reorder</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Review auto-reorders in the **Supplier Hub** and compare delivery times against predicted stockout dates.</p>
                    </div>
                  </div>
                  <div className="step-item active">
                    <div className="step-number">4</div>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: '2px' }}>Trigger Push Alerts</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Click dispatch buttons to write and deliver push WhatsApp alerts to: <strong>{business?.merchantWhatsapp}</strong>.</p>
                    </div>
                  </div>
                </div>

                <button className="btn btn-primary" onClick={handleTriggerAlerts} disabled={isAlertSending} style={{ width: '100%', marginTop: '15px' }}>
                  {isAlertSending ? <><div className="animate-spin" style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%' }} /> Dispatching alerts...</> : <><Bell size={15}/> Audit Stock & Dispatch Alerts</>}
                </button>
              </div>

              <div className="glass-card flex-column-full" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-card-border)', background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cpu size={18} color="var(--color-primary)" />
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color:'var(--color-text-main)' }}>AegisAI Coordinator</h4>
                      <p style={{ fontSize: '0.68rem', color: 'var(--color-success)', display:'flex', alignItems:'center', gap:4 }}><CheckCircle size={10}/> Multilingual Agent Router Active</p>
                    </div>
                  </div>
                </div>

                <div className="chat-window" style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`chat-message ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                      <div className="message-content" style={{ whiteSpace: 'pre-line' }}>
                        {msg.content}
                        {msg.agent && (
                          <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #e2e8f0', fontSize: '0.68rem', color: 'var(--color-text-dim)', display: 'flex', gap: '8px' }}>
                            <span><strong>Agent:</strong> {msg.agent}</span>
                            {msg.reasoning && <span>| <strong>Reason:</strong> {msg.reasoning}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="chat-message assistant">
                      <div className="message-content" style={{ display: 'flex', gap: '4px', padding: '10px 14px' }}>
                        <span className="dot animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                        <span className="dot animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                        <span className="dot animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="chat-input-area" style={{ display: 'flex', gap: '10px', padding: '12px 16px', borderTop: '1px solid var(--color-card-border)', background: 'rgba(255,255,255,0.01)' }}>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Ask about reorders, suppliers, profits, or forecasts (English/தமிழ்)..."
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PREDICTIVE ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="scrollable-tab">
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ color: 'var(--color-primary)', fontSize: '1.2rem', display:'flex', alignItems:'center', gap:8 }}><TrendingUp size={20}/>Machine Learning Sales Forecasting</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Linear regression trend analysis showing historical flows and 30-day predicted sales.</p>
                </div>
                {forecast.is_empty ? (
                  <div style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    Waiting for data
                  </div>
                ) : (
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    Growth: +{forecast.growth_rate}%
                  </div>
                )}
              </div>

              {forecast.is_empty ? (
                <div style={{ height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--color-card-border)', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                  <Activity size={32} color="#64748b" style={{ marginBottom: '10px' }} />
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>No Transaction Data Available</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', maxWidth: '420px' }}>
                    AegisAI requires sales logs to compute regression fits. Import transactions in the onboarding flow, upload receipts in the Document Hub, or log sales via webhook to populate this chart.
                  </p>
                </div>
              ) : (
                <div className="svg-chart-container" style={{ height: '240px' }}>
                  <svg viewBox="0 0 800 240" style={{ width: '100%', height: '100%' }}>
                    <line x1="50" y1="20" x2="750" y2="20" stroke="rgba(255,255,255,0.03)" />
                    <line x1="50" y1="80" x2="750" y2="80" stroke="rgba(255,255,255,0.03)" />
                    <line x1="50" y1="140" x2="750" y2="140" stroke="rgba(255,255,255,0.03)" />
                    <line x1="50" y1="200" x2="750" y2="200" stroke="rgba(255,255,255,0.08)" />

                    <text x="15" y="25" fill="#64748b" fontSize="9">12k</text>
                    <text x="15" y="85" fill="#64748b" fontSize="9">8k</text>
                    <text x="15" y="145" fill="#64748b" fontSize="9">4k</text>
                    <text x="15" y="205" fill="#64748b" fontSize="9">0</text>

                    <path 
                      d="M 50 150 L 140 130 L 230 145 L 320 120 L 410 110 L 500 115 L 590 105 L 680 95" 
                      fill="none" 
                      stroke="var(--color-primary)" 
                      strokeWidth="3" 
                    />
                    <path 
                      d="M 50 200 L 50 150 L 140 130 L 230 145 L 320 120 L 410 110 L 500 115 L 590 105 L 680 95 L 680 200 Z" 
                      fill="url(#indigo-gradient)" 
                      opacity="0.12" 
                    />

                    <path 
                      d="M 680 95 L 750 75" 
                      fill="none" 
                      stroke="var(--color-success)" 
                      strokeWidth="3" 
                      strokeDasharray="5,5" 
                    />
                    <path 
                      d="M 680 95 L 750 75 L 750 200 L 680 200 Z" 
                      fill="url(#emerald-gradient)" 
                      opacity="0.06" 
                    />

                    <circle cx="680" cy="95" r="4" fill="var(--color-primary)" />
                    <circle cx="750" cy="75" r="4" fill="var(--color-success)" />

                    <text x="50" y="222" fill="#64748b" fontSize="9" textAnchor="middle">Day -30</text>
                    <text x="320" y="222" fill="#64748b" fontSize="9" textAnchor="middle">Day -15</text>
                    <text x="680" y="222" fill="#64748b" fontSize="9" textAnchor="middle">Today</text>
                    <text x="750" y="222" fill="#64748b" fontSize="9" textAnchor="middle">Day +30 (Forecast)</text>
                    
                    <defs>
                      <linearGradient id="indigo-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                      <linearGradient id="emerald-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-success)" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginTop: '20px' }}>
              <div className="glass-card">
                <h4 style={{ fontSize: '1rem', color: 'var(--color-warning)', marginBottom: '8px', display:'flex', alignItems:'center', gap:6 }}><Bot size={16}/>Copilot Forecasting Summary</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                  {forecast.is_empty ? (
                    "No active sales models built. Please run transaction operations to enable linear predictions."
                  ) : (
                    `Our Scikit-Learn regression engine projected ${business?.currency || "₹"}${forecast.total_forecasted_sales.toLocaleString('en-IN', { maximumFractionDigits: 0 })} in sales for the upcoming month. A predicted growth index of +${forecast.growth_rate}% points to positive trends compared to last month.`
                  )}
                </p>
              </div>

              <div className="glass-card">
                <h4 style={{ fontSize: '1rem', color: 'var(--color-primary)', marginBottom: '8px', display:'flex', alignItems:'center', gap:6 }}><BarChart2 size={16}/>Projected Revenue Volumes</h4>
                {forecast.is_empty ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>No forecasting values computed.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '4px', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Expected 30-Day Sales:</span>
                      <span style={{ fontWeight: 'bold' }}>{business?.currency || "₹"}{forecast.total_forecasted_sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2b: CUSTOMER INSIGHTS */}
        {activeTab === "customer" && (
          <div className="scrollable-tab">
            
            {/* INACTIVE THRESHOLD HEADER */}
            <div className="glass-card" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ color: '#818cf8', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserCheck size={20} /> Customer Cohorts & Retention Analytics
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Dynamically calculated cohorts, lifetime values, purchase frequencies, and product association paths.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Inactive Threshold:</span>
                <select 
                  className="select-input" 
                  style={{ width: '100px', padding: '4px 8px' }} 
                  value={inactiveDays} 
                  onChange={(e) => {
                    const days = parseInt(e.target.value);
                    setInactiveDays(days);
                    fetchCustomerInsights(token, days);
                  }}
                >
                  <option value={30}>30 Days</option>
                  <option value={60}>60 Days</option>
                  <option value={90}>90 Days</option>
                </select>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => fetchCustomerInsights(token, inactiveDays)} 
                  style={{ padding: '4px 8px' }}
                >
                  <RefreshCw size={12} />
                </button>
              </div>
            </div>

            {isCustomerLoading || !customerInsights ? (
              <div className="glass-card" style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid rgba(129,140,248,0.2)', borderTopColor: '#818cf8', borderRadius: '50%' }}></div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '12px' }}>Computing cohort analytics from ledger...</p>
              </div>
            ) : (
              <>
                {/* 1. METRICS GRID */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { title: 'Total Customers', value: customerInsights.metrics.total_customers, sub: 'Registered members', icon: <UserCheck size={16} color="#818cf8" />, border: '#818cf8' },
                    { title: 'Active Buyers', value: customerInsights.metrics.active_customers, sub: `Active in last ${inactiveDays}d`, icon: <Activity size={16} color="#34d399" />, border: '#34d399' },
                    { title: 'Inactive Buyers', value: customerInsights.metrics.inactive_customers, sub: `No sales in last ${inactiveDays}d`, icon: <ShieldAlert size={16} color="#f87171" />, border: '#f87171' },
                    { title: 'Repeat Rate', value: `${customerInsights.metrics.repeat_customer_rate}%`, sub: 'Customers with 2+ purchases', icon: <RefreshCw size={16} color="#fbbf24" />, border: '#fbbf24' },
                    { title: 'Average Order', value: `${business?.currency || '₹'}${customerInsights.metrics.average_order_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, sub: 'Avg value per invoice', icon: <IndianRupee size={16} color="#60a5fa" />, border: '#60a5fa' },
                    { title: 'Customer LTV', value: `${business?.currency || '₹'}${customerInsights.metrics.customer_lifetime_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, sub: 'Avg spending per account', icon: <TrendingUp size={16} color="#c084fc" />, border: '#c084fc' },
                  ].map((card) => (
                    <div key={card.title} className="glass-card" style={{ borderLeft: `3px solid ${card.border}`, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.title}</span>
                        {card.icon}
                      </div>
                      <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-main)', lineHeight: 1.2 }}>{card.value}</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--color-text-dim)' }}>{card.sub}</span>
                    </div>
                  ))}
                </div>

                {/* 2. CHARTS GRID (Segmentation & Purchase Trends) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px', marginBottom: '20px' }}>
                  
                  {/* CUSTOMER SEGMENTATION DONUT BLOCK */}
                  <div className="glass-card">
                    <h4 style={{ color: '#818cf8', fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: 6 }}><BarChart2 size={16} color="#818cf8" /> Customer Cohort Segmentation</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                      Merchant database distribution based on purchase frequency, lifetime sales volume, and recency index.
                    </p>
                    
                    {/* Horizontal Bar Chart representation */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                      {Object.entries(customerInsights.segments).map(([segment, count]) => {
                        const total = customerInsights.metrics.total_customers;
                        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                        
                        // Pick segment color
                        let color = "#38bdf8"; // Occasional
                        if (segment === "VIP") color = "#c084fc";
                        else if (segment === "Regular") color = "#6366f1";
                        else if (segment === "New") color = "#34d399";
                        else if (segment === "Inactive") color = "#f87171";
                        
                        return (
                          <div key={segment}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                              <span style={{ fontWeight: '600', color: 'var(--color-text-muted)' }}>{segment} Cohort</span>
                              <span style={{ color: 'var(--color-text-light)' }}>{count} ({percentage}%)</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${percentage}%`, height: '100%', background: color, borderRadius: '4px' }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* PURCHASE TRENDS (MONTHLY REVENUE & UNIQUE ACTIVE BUYERS) */}
                  <div className="glass-card">
                    <h4 style={{ color: '#818cf8', fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: 6 }}><TrendingUp size={16} color="#818cf8" /> Monthly Customer Purchase Activity</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                      Historical comparison of monthly revenue generation streams alongside active buying channels.
                    </p>
                    
                    {customerInsights.trends.length === 0 ? (
                      <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--color-card-border)', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Insufficient historical sales details.</span>
                      </div>
                    ) : (
                      <div className="svg-chart-container" style={{ height: '170px' }}>
                        <svg viewBox="0 0 500 170" style={{ width: '100%', height: '100%' }}>
                          {/* Grid lines */}
                          <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.03)" />
                          <line x1="40" y1="70" x2="480" y2="70" stroke="rgba(255,255,255,0.03)" />
                          <line x1="40" y1="120" x2="480" y2="120" stroke="rgba(255,255,255,0.03)" />
                          <line x1="40" y1="140" x2="480" y2="140" stroke="rgba(255,255,255,0.08)" />

                          {/* Axes labels */}
                          <text x="35" y="23" fill="#64748b" fontSize="7" textAnchor="end">Max</text>
                          <text x="35" y="143" fill="#64748b" fontSize="7" textAnchor="end">0</text>

                          {/* Draw Bars */}
                          {customerInsights.trends.map((item, index) => {
                            const barWidth = 32;
                            const spacing = 70;
                            const x = 50 + index * spacing;
                            
                            // Max revenue baseline helper
                            const maxRev = Math.max(...customerInsights.trends.map(t => t.revenue), 1000);
                            const heightPercentage = item.revenue / maxRev;
                            const barHeight = Math.max(10, heightPercentage * 110);
                            const y = 140 - barHeight;

                            return (
                              <g key={item.month}>
                                {/* Revenue Bar */}
                                <rect 
                                  x={x} 
                                  y={y} 
                                  width={barWidth} 
                                  height={barHeight} 
                                  fill="rgba(129, 140, 248, 0.4)" 
                                  stroke="#818cf8" 
                                  strokeWidth="1" 
                                  rx="2"
                                />
                                {/* Value display */}
                                <text x={x + barWidth/2} y={y - 4} fill="var(--color-text-light)" fontSize="6" textAnchor="middle">
                                  {business?.currency || "₹"}{item.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </text>
                                {/* X Axis Month */}
                                <text x={x + barWidth/2} y="152" fill="#64748b" fontSize="7" textAnchor="middle">
                                  {item.month.split(" ")[0].slice(0,3)}
                                </text>
                                {/* Active buyers counts dots */}
                                <circle 
                                  cx={x + barWidth/2} 
                                  cy={140 - (item.customer_count * 10)} 
                                  r="3" 
                                  fill="#34d399"
                                />
                                <text 
                                  x={x + barWidth/2} 
                                  y={140 - (item.customer_count * 10) - 5} 
                                  fill="#34d399" 
                                  fontSize="6" 
                                  fontWeight="bold" 
                                  textAnchor="middle"
                                >
                                  {item.customer_count}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '0.72rem', marginTop: '4px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', background: '#818cf8', borderRadius: '2px' }}></span> Revenue (Sales)</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '6px', height: '6px', background: '#34d399', borderRadius: '50%' }}></span> Active Customers</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                </div>

                {/* 3. RECOMMENDATIONS & BUNDLE CARDS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  
                  {/* DYNAMIC ACTIONABLE RECOMMENDATIONS */}
                  <div className="glass-card">
                    <h4 style={{ color: '#fbbf24', fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: 6 }}><Bell size={16} color="#fbbf24" /> Recommended Retention Campaigns</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                      Automated risk analysis prompting promotional offerings to counteract customer churn.
                    </p>
                    
                    {customerInsights.recommendations.length === 0 ? (
                      <div style={{ padding: '20px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--color-card-border)', borderRadius: '8px', textAlign: 'center' }}>
                        <CheckCircle size={24} color="#34d399" style={{ marginBottom: '6px' }} />
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>All cohort retention indicators are healthy. No campaigns required.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {customerInsights.recommendations.map((rec, idx) => (
                          <div 
                            key={idx} 
                            style={{ 
                              padding: '12px 14px', 
                              background: 'rgba(255, 255, 255, 0.02)', 
                              border: '1px solid var(--color-card-border)', 
                              borderRadius: '8px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '12px'
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span 
                                  style={{ 
                                    padding: '2px 6px', 
                                    fontSize: '0.62rem', 
                                    borderRadius: '4px',
                                    background: rec.type === 're_engagement' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                                    color: rec.type === 're_engagement' ? '#f87171' : '#fbbf24',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase'
                                  }}
                                >
                                  {rec.type.replace('_', ' ')}
                                </span>
                                <h5 style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', fontWeight: 'bold' }}>{rec.title}</h5>
                              </div>
                              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '4px', lineHeight: '1.4' }}>{rec.message}</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.75rem', color: '#818cf8', fontWeight: '500' }}>
                                <span>Offer: {rec.discount_offer}</span>
                              </div>
                            </div>
                            <button 
                              className="btn btn-primary" 
                              onClick={() => handleGenerateCampaign(rec.customer_id, null, rec.discount_offer)} 
                              style={{ padding: '6px 10px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                            >
                              <MessageSquare size={12} /> Generate Campaign
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* FREQUENTLY BOUGHT TOGETHER */}
                  <div className="glass-card">
                    <h4 style={{ color: '#818cf8', fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: 6 }}><ShoppingCart size={16} color="#818cf8" /> Commonly Bought Together Bundles</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                      Market Basket Analysis identifying products commonly checked out during the same checkout visit.
                    </p>
                    
                    {customerInsights.frequently_bought_together.length === 0 ? (
                      <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--color-card-border)', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', textAlign: 'center', maxWidth: '280px' }}>
                          Log checkouts containing multiple distinct product SKUs to trigger bundle analytics.
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {customerInsights.frequently_bought_together.map((fbt, idx) => (
                          <div 
                            key={idx} 
                            style={{ 
                              padding: '10px 12px', 
                              background: 'rgba(129,140,248,0.02)', 
                              border: '1px solid rgba(129,140,248,0.1)', 
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-light)', fontWeight: 'bold' }}>
                                <ShoppingCart size={14} color="#818cf8" />
                                <span>{fbt.product_a}</span>
                                <span style={{ color: 'var(--color-text-dim)' }}>+</span>
                                <span>{fbt.product_b}</span>
                              </div>
                              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', marginTop: '2px' }}>
                                Support Ratio: **{fbt.support_percentage}%** of invoices | **{fbt.co_occurrence}** bundle co-occurrences
                              </p>
                            </div>
                            <button 
                              className="btn btn-secondary" 
                              onClick={() => handleGenerateCampaign(null, null, `Special bundle discount on ${fbt.product_a} and ${fbt.product_b} together`)}
                              style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                            >
                              Promo
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                </div>

                {/* 4. CUSTOMER REGISTER & ADD WIDGET */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '20px' }}>
                  
                  {/* CUSTOMER DIRECTORY REGISTRY */}
                  <div className="glass-card">
                    <h4 style={{ color: '#818cf8', fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: 6 }}><Users size={16} color="#818cf8" /> Company Customer Registry</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                      Registered client profiles detailing total revenue generation contribution and cohort tags.
                    </p>
                    
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--color-card-border)', color: 'var(--color-text-muted)' }}>
                            <th style={{ padding: '8px 10px' }}>Client</th>
                            <th style={{ padding: '8px 10px' }}>Segment</th>
                            <th style={{ padding: '8px 10px' }}>Spent</th>
                            <th style={{ padding: '8px 10px' }}>Visits</th>
                            <th style={{ padding: '8px 10px' }}>Last Sale</th>
                            <th style={{ padding: '8px 10px' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerInsights.customers.map((c) => {
                            let segColor = "rgba(56, 189, 248, 0.1)"; // Occasional
                            let textCol = "#38bdf8";
                            if (c.segment === "VIP") { segColor = "rgba(192, 132, 252, 0.1)"; textCol = "#c084fc"; }
                            else if (c.segment === "Regular") { segColor = "rgba(99, 102, 241, 0.1)"; textCol = "#6366f1"; }
                            else if (c.segment === "New") { segColor = "rgba(52, 211, 153, 0.1)"; textCol = "#34d399"; }
                            else if (c.segment === "Inactive") { segColor = "rgba(248, 113, 113, 0.1)"; textCol = "#f87171"; }

                            return (
                              <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }} className="hover-row">
                                <td style={{ padding: '10px' }}>
                                  <div style={{ fontWeight: 'bold', color: 'var(--color-text-light)' }}>{c.name}</div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>{c.email} | {c.phone}</div>
                                </td>
                                <td style={{ padding: '10px' }}>
                                  <span style={{ padding: '2px 8px', borderRadius: '4px', background: segColor, color: textCol, fontSize: '0.72rem', fontWeight: 'bold' }}>
                                    {c.segment}
                                  </span>
                                </td>
                                <td style={{ padding: '10px', fontWeight: 'bold' }}>
                                  {business?.currency || "₹"}{c.spending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td style={{ padding: '10px' }}>{c.visits} times</td>
                                <td style={{ padding: '10px' }}>{c.last_purchase}</td>
                                <td style={{ padding: '10px' }}>
                                  <button 
                                    className="btn btn-secondary" 
                                    onClick={() => setSelectedCustomer(c)} 
                                    style={{ padding: '4px 8px', fontSize: '0.7rem', marginRight: '6px' }}
                                  >
                                    Timeline
                                  </button>
                                  <button 
                                    className="btn btn-secondary" 
                                    onClick={() => handleGenerateCampaign(c.id, null, "Special Thank You Discount")} 
                                    style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                  >
                                    Campaign
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ADD CUSTOMER FORM WIDGET */}
                  <div className="glass-card flex-column-full" style={{ alignSelf: 'start' }}>
                    <h4 style={{ color: '#818cf8', fontSize: '1.05rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={16} color="#818cf8" /> Register New Customer</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                      Manually add a buyer account to compile purchase details and establish retention algorithms.
                    </p>
                    
                    <form onSubmit={handleAddCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div className="input-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>FULL NAME:</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Aarav Sharma" 
                          className="text-input" 
                          value={newCustomer.name} 
                          onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})} 
                        />
                      </div>
                      
                      <div className="input-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>EMAIL ADDRESS:</label>
                        <input 
                          type="email" 
                          placeholder="e.g. name@gmail.com" 
                          className="text-input" 
                          value={newCustomer.email} 
                          onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})} 
                        />
                      </div>
                      
                      <div className="input-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>MOBILE NUMBER:</label>
                        <input 
                          type="text" 
                          placeholder="e.g. +919876543210" 
                          className="text-input" 
                          value={newCustomer.phone} 
                          onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})} 
                        />
                      </div>
                      
                      {customerAddStatus.message && (
                        <div style={{ 
                          padding: '8px 10px', 
                          borderRadius: '6px', 
                          fontSize: '0.75rem', 
                          background: customerAddStatus.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                          color: customerAddStatus.type === 'success' ? '#10b981' : '#f87171',
                          border: customerAddStatus.type === 'success' ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(239,68,68,0.15)',
                          marginTop: '4px'
                        }}>
                          {customerAddStatus.message}
                        </div>
                      )}
                      
                      <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={isAddingCustomer} 
                        style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}
                      >
                        {isAddingCustomer ? "Adding Account..." : "Add Customer"}
                      </button>
                    </form>
                  </div>
                  
                </div>
              </>
            )}

            {/* 5. CUSTOMER DETAIL & TIMELINE MODAL */}
            {selectedCustomer && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '640px', background: 'var(--color-bg)', padding: '24px', border: '1px solid var(--color-primary)', borderRadius: '12px', maxHeight: '90vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ color: '#818cf8', fontSize: '1.3rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}><User size={20} color="#818cf8" /> {selectedCustomer.name}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        ID: {selectedCustomer.id} | {selectedCustomer.email} | {selectedCustomer.phone}
                      </p>
                    </div>
                    <span 
                      style={{ 
                        padding: '3px 10px', 
                        borderRadius: '4px', 
                        background: selectedCustomer.segment === 'VIP' ? 'rgba(192, 132, 252, 0.15)' : selectedCustomer.segment === 'Regular' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(56, 189, 248, 0.15)', 
                        color: selectedCustomer.segment === 'VIP' ? '#c084fc' : selectedCustomer.segment === 'Regular' ? '#6366f1' : '#38bdf8', 
                        fontSize: '0.75rem', 
                        fontWeight: 'bold' 
                      }}
                    >
                      {selectedCustomer.segment} Cohort
                    </span>
                  </div>

                  {/* Cohort Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--color-card-border)', marginBottom: '20px' }}>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--color-text-dim)', display: 'block' }}>TOTAL SPENT</span>
                      <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--color-text-light)' }}>
                        {business?.currency || "₹"}{selectedCustomer.spending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--color-text-dim)', display: 'block' }}>VISIT FREQUENCY</span>
                      <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--color-text-light)' }}>{selectedCustomer.visits} orders</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--color-text-dim)', display: 'block' }}>LAST PURCHASE</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--color-text-light)' }}>{selectedCustomer.last_purchase}</span>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '0.92rem', color: '#818cf8', marginBottom: '10px', borderBottom: '1px solid var(--color-card-border)', paddingBottom: '4px', display: 'flex', alignItems: 'center', gap: 6 }}><ShoppingCart size={14} color="#818cf8" /> Preferred Products</h4>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    {selectedCustomer.pref_products && selectedCustomer.pref_products.length > 0 ? (
                      selectedCustomer.pref_products.map((p, i) => (
                        <span key={i} style={{ padding: '3px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {p}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>None registered yet.</span>
                    )}
                  </div>

                  <h4 style={{ fontSize: '0.92rem', color: '#818cf8', marginBottom: '10px', borderBottom: '1px solid var(--color-card-border)', paddingBottom: '4px', display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={14} color="#818cf8" /> Purchase Timeline Logs</h4>
                  {selectedCustomer.purchase_history && selectedCustomer.purchase_history.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                      {selectedCustomer.purchase_history.map((item, idx) => (
                        <div key={idx} style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                          <div>
                            <span style={{ fontWeight: 'bold', color: 'var(--color-text-light)' }}>{item.product}</span>
                            <span style={{ color: 'var(--color-text-dim)', marginLeft: '6px' }}>({item.qty} units)</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ color: 'var(--color-text-muted)', marginRight: '8px' }}>{item.date}</span>
                            <span style={{ fontWeight: 'bold' }}>{business?.currency || "₹"}{item.amount.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>No invoices in purchase history database.</p>
                  )}

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button className="btn btn-secondary" onClick={() => setSelectedCustomer(null)}>Close Profile</button>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => {
                        handleGenerateCampaign(selectedCustomer.id, null, "15% discount code");
                        setSelectedCustomer(null);
                      }}
                    >
                      Draft Campaign
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 6. WHATSAPP CAMPAIGN DRAFT MODAL */}
            {showCampaignModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '520px', background: 'var(--color-bg)', padding: '24px', border: '1px solid rgba(129, 140, 248, 0.4)', borderRadius: '12px' }}>
                  <h3 style={{ color: '#818cf8', fontSize: '1.25rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MessageSquare size={20} /> Targeted Campaign Draft
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
                    Personalized WhatsApp message campaign generated dynamically by the AegisAI Communication Agent:
                  </p>

                  {campaignLoading ? (
                    <div style={{ height: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid var(--color-card-border)' }}>
                      <div className="animate-spin" style={{ width: '24px', height: '24px', border: '2px solid rgba(129,140,248,0.2)', borderTopColor: '#818cf8', borderRadius: '50%' }}></div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', marginTop: '10px' }}>Formulating copywriting draft...</p>
                    </div>
                  ) : (
                    <textarea 
                      className="input-field"
                      value={campaignDraft}
                      readOnly
                      rows={8}
                      style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.78rem', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px', resize: 'none', border: '1px solid var(--color-card-border)', color: '#fff', marginBottom: '16px' }}
                    />
                  )}

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={() => setShowCampaignModal(false)}>Close</button>
                    {!campaignLoading && (
                      <button 
                        className="btn btn-primary" 
                        onClick={() => {
                          navigator.clipboard.writeText(campaignDraft);
                          setSuccessMessage("Campaign copy template copied to clipboard!");
                          setShowCampaignModal(false);
                        }}
                      >
                        <Copy size={14} /> Copy Campaign
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
          </div>
        )}

        {/* TAB: BUSINESS STRATEGY AGENT */}
        {activeTab === "strategy" && (
          <div className="scrollable-tab">
            <div className="glass-card" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ color: 'var(--color-primary)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lightbulb size={20} /> SME Growth Strategy Copilot
                </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Personalized strategy agent analyzing your business profile to generate actionable growth suggestions.
                  </p>
                </div>
                {generatedStrategy && (
                  <div style={{
                    background: generatedStrategy.includes("fallback") ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                    color: generatedStrategy.includes("fallback") ? '#f59e0b' : '#10b981',
                    border: generatedStrategy.includes("fallback") ? '1px solid rgba(245, 158, 11, 0.15)' : '1px solid rgba(16, 185, 129, 0.15)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    {generatedStrategy.includes("fallback") ? '📶 Offline Fallback Active' : '⚡ Groq Engine Active'}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
              {/* Form Input Side */}
              <div className="glass-card flex-column-full">
                <h3 style={{ color: 'var(--color-primary)', fontSize: '1.1rem', marginBottom: '4px', display:'flex', alignItems:'center', gap:6 }}><FileText size={16}/>Business & Goal Details</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
                  Provide details to customize your business strategy.
                </p>

                {strategyError && (
                  <div style={{ padding: '8px 12px', background: 'var(--color-danger-glow)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', fontSize: '0.80rem', color: 'var(--color-danger)', marginBottom: '12px' }}>
                    {strategyError}
                  </div>
                )}

                <form onSubmit={handleGenerateStrategy} style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Business Type *</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Grocery Store, Cafe, Salon"
                      value={strategyInputs.businessType}
                      onChange={(e) => setStrategyInputs(prev => ({ ...prev, businessType: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Target Audience *</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Local residents, students, offices"
                      value={strategyInputs.targetAudience}
                      onChange={(e) => setStrategyInputs(prev => ({ ...prev, targetAudience: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Primary Business Goal *</label>
                    <select 
                      className="select-input"
                      value={strategyInputs.goals}
                      onChange={(e) => setStrategyInputs(prev => ({ ...prev, goals: e.target.value }))}
                    >
                      <option value="attract">🎯 Attract More Customers</option>
                      <option value="sales">📈 Improve Sales & Order Value</option>
                      <option value="retention">🔄 Increase Customer Retention & Loyalty</option>
                      <option value="branding">🌟 Strengthen Branding & Identity</option>
                      <option value="marketing">📢 Enhance Marketing & Social Media</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Competitor Names (Optional)</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Supermarket X, Corner Shop Y"
                      value={strategyInputs.competitors}
                      onChange={(e) => setStrategyInputs(prev => ({ ...prev, competitors: e.target.value }))}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={strategyLoading}>
                    {strategyLoading ? <><div className="animate-spin" style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%' }} /> Formulating strategies...</> : <><Zap size={15}/>Generate Growth Strategy</>}
                  </button>
                </form>
              </div>

              {/* Output Result Side */}
              <div className="glass-card flex-column-full">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ color: 'var(--color-primary)', fontSize: '1.1rem', display:'flex', alignItems:'center', gap:6 }}><Sparkles size={16}/>Actions & Recommendations</h3>
                  {generatedStrategy && (
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      onClick={() => {
                        navigator.clipboard.writeText(generatedStrategy);
                        setSuccessMessage("Strategy copied to clipboard!");
                      }}
                    >
                      <Copy size={12} style={{ marginRight: '4px' }} /> Copy Strategy
                    </button>
                  )}
                </div>

                {strategyLoading ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                    <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid rgba(129,140,248,0.2)', borderTopColor: '#818cf8', borderRadius: '50%' }}></div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '12px' }}>Formulating tailored recommendations...</p>
                  </div>
                ) : generatedStrategy ? (
                  <div 
                    style={{ 
                      flex: 1, 
                      overflowY: 'auto', 
                      maxHeight: '450px', 
                      paddingRight: '6px', 
                      fontSize: '0.88rem', 
                      lineHeight: '1.5',
                      color: 'var(--color-text-light)'
                    }}
                  >
                    <div className="strategy-markdown-rendered" style={{ whiteSpace: 'pre-line' }}>
                      {generatedStrategy}
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', border: '1px dashed var(--color-card-border)', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
                    <Lightbulb size={32} color="#64748b" style={{ marginBottom: '10px' }} />
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>No Strategy Formulated</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', maxWidth: '340px', marginTop: '4px' }}>
                      Fill out the form on the left to invoke the AegisAI Strategy Agent. We will read your active business profile (turnover, category, location) and construct custom pricing, promos, branding, and local ads suggestions.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STOCK CONTROL */}
        {activeTab === "inventory" && (
          <div className="scrollable-tab">
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
              
              <div className="glass-card flex-column-full">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ color: 'var(--color-primary)', fontSize: '1.15rem', display:'flex', alignItems:'center', gap:8 }}><Package size={18}/>Stock Depletion Velocity</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Daily velocities and safety warnings calculated from CSV databases.</p>
                  </div>
                </div>

                {inventory.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--color-card-border)', borderRadius: '8px', textAlign: 'center' }}>
                    <Package size={28} color="#64748b" style={{ marginBottom: '10px' }} />
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '3px' }}>Your Inventory is Empty</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', maxWidth: '300px' }}>
                      Add your first product catalog item using the form on the right to start tracking stock buffers.
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', flex: 1 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-card-border)', color: 'var(--color-text-muted)' }}>
                          <th style={{ padding: '8px 10px' }}>SKU</th>
                          <th style={{ padding: '8px 10px' }}>Product</th>
                          <th style={{ padding: '8px 10px' }}>Stock</th>
                          <th style={{ padding: '8px 10px' }}>Velocity</th>
                          <th style={{ padding: '8px 10px' }}>Days Left</th>
                          <th style={{ padding: '8px 10px' }}>Status</th>
                          <th style={{ padding: '8px 10px' }}>Supplier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.map(item => {
                          let statusBadge = "var(--color-success-glow)";
                          let statusColor = "var(--color-success)";
                          if (item.Status === "Low Stock") {
                            statusBadge = "var(--color-danger-glow)";
                            statusColor = "var(--color-danger)";
                          } else if (item.Status === "Approaching Outage") {
                            statusBadge = "var(--color-warning-glow)";
                            statusColor = "var(--color-warning)";
                          }

                          return (
                            <tr key={item.ProductID} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.ProductID}</td>
                              <td style={{ padding: '10px' }}>{item.ProductName}</td>
                              <td style={{ padding: '10px', fontWeight: '600' }}>{item.CurrentStock}</td>
                              <td style={{ padding: '10px' }}>{item.DailyVelocity} u/d</td>
                              <td style={{ padding: '10px', fontWeight: '600' }}>{item.DaysRemaining} d</td>
                              <td style={{ padding: '10px' }}>
                                <span style={{ background: statusBadge, color: statusColor, padding: '2px 6px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: 'bold' }}>
                                  {item.Status}
                                </span>
                              </td>
                              <td style={{ padding: '10px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.Supplier}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="glass-card flex-column-full">
                <h3 style={{ color: 'var(--color-primary)', fontSize: '1.15rem', marginBottom: '4px', display:'flex', alignItems:'center', gap:8 }}><Plus size={18}/>Register New Product</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
                  Register and append a new product details row directly to your inventory database.
                </p>

                {addStatus.message && (
                  <div style={{ padding: '8px 12px', background: addStatus.type === 'success' ? 'var(--color-success-glow)' : 'var(--color-danger-glow)', border: addStatus.type === 'success' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', fontSize: '0.80rem', color: addStatus.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)', marginBottom: '12px' }}>
                    {addStatus.message}
                  </div>
                )}

                <form onSubmit={handleAddProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Product ID *</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="e.g. P109"
                        value={newProduct.ProductID}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, ProductID: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Product Name *</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="e.g. Maggi Noodles"
                        value={newProduct.ProductName}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, ProductName: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Category</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="e.g. Snacks"
                        value={newProduct.Category}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, Category: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Stock level *</label>
                      <input 
                        type="number" 
                        className="input-field" 
                        placeholder="e.g. 50"
                        value={newProduct.StockLevel}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, StockLevel: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Cost Price (Unit Price) *</label>
                      <input 
                        type="number" 
                        step="0.01"
                        className="input-field" 
                        placeholder="e.g. 20.00"
                        value={newProduct.UnitPrice}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, UnitPrice: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Retail Price</label>
                      <input 
                        type="number" 
                        step="0.01"
                        className="input-field" 
                        placeholder="e.g. 25.00"
                        value={newProduct.RetailPrice}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, RetailPrice: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Reorder Limit</label>
                      <input 
                        type="number" 
                        className="input-field" 
                        placeholder="e.g. 15"
                        value={newProduct.ReorderLevel}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, ReorderLevel: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Supplier / Vendor Name</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="e.g. Tirupur Distributors"
                        value={newProduct.Supplier}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, Supplier: e.target.value }))}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={isAddingProduct}>
                    {isAddingProduct ? 'Adding item...' : <><Plus size={15}/>Append Product Record</>}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* --- NEW TAB 4: SUPPLIER HUB DASHBOARD --- */}
        {activeTab === "supplier" && (
          <div className="scrollable-tab">
            {/* KPI Panels specific to procurement */}
            <div className="metrics-grid" style={{ marginBottom: '20px' }}>
              <div className="glass-card metric-box sales">
                <div className="metric-box-title">Registered Suppliers</div>
                <div className="metric-box-value">{suppliers.length} Vendors</div>
                <div className="metric-box-trend" style={{ color: 'var(--color-primary)' }}><UserCheck size={14} style={{ display: 'inline', marginRight: '3px' }} /> Catalog Active</div>
              </div>
              <div className="glass-card metric-box warnings">
                <div className="metric-box-title">Procurement Warnings</div>
                <div className="metric-box-value">{procurementRecs.length} Alerts</div>
                <div className="metric-box-trend" style={{ color: procurementRecs.length > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  {procurementRecs.length > 0 ? '⚠️ Purchase planning needed' : '🟢 Replenishments satisfied'}
                </div>
              </div>
              <div className="glass-card metric-box profit">
                <div className="metric-box-title">Pending Purchase Orders</div>
                <div className="metric-box-value">{pendingPOsCount} Orders</div>
                <div className="metric-box-trend" style={{ color: 'var(--color-warning)' }}><Truck size={14} style={{ display: 'inline', marginRight: '3px' }} /> Awaiting Delivery</div>
              </div>
              <div className="glass-card metric-box expenses">
                <div className="metric-box-title">Avg Supplier Reliability</div>
                <div className="metric-box-value">{avgSupplierReliability}%</div>
                <div className="metric-box-trend" style={{ color: 'var(--color-success)' }}>▲ Operational quality high</div>
              </div>
            </div>

            {/* Split layout: Procurement Warnings vs Register Supplier */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', marginBottom: '20px' }}>
              
              {/* Procurement Warnings Box */}
              <div className="glass-card flex-column-full">
                <h3 style={{ color: 'var(--color-primary)', fontSize: '1.2rem', marginBottom: '4px', display:'flex', alignItems:'center', gap:8 }}><AlertTriangle size={18}/>Automated Reorder Recommendations</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
                  AegisAI scoring evaluates price, speed, and safety margin.
                </p>

                {procurementRecs.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--color-card-border)', borderRadius: '8px', textAlign: 'center' }}>
                    <CheckCircle size={28} color="var(--color-success)" style={{ marginBottom: '10px' }} />
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>All Stocks Satisfied</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', maxWidth: '340px', marginTop: '4px' }}>
                      No items are below safety stock or running out within 10 days. Reorder advice will trigger automatically upon inventory depletions.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxH: '340px' }}>
                    {procurementRecs.map(rec => (
                      <div key={rec.product_id} className="glass-card" style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(99, 102, 241, 0.15)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 'bold' }}>📦 {rec.product_name} ({rec.product_id})</span>
                          <span style={{ fontSize: '0.72rem', background: 'var(--color-danger-glow)', color: 'var(--color-danger)', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                            Depletes in {rec.days_remaining} Days
                          </span>
                        </div>

                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                          {rec.reasoning}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '8px', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid var(--color-card-border)' }}>
                          <div>
                            <span style={{ color: 'var(--color-text-dim)' }}>Reorder Quantity:</span> <strong style={{ color: '#fff' }}>{rec.recommended_quantity} units</strong> <span style={{ fontSize: '0.65rem' }}>(MOQ fit)</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--color-text-dim)' }}>Expected Cost:</span> <strong style={{ color: 'var(--color-success)' }}>{business?.currency || "₹"}{rec.expected_cost.toLocaleString('en-IN')}</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--color-text-dim)' }}>Replenishment Span:</span> <strong style={{ color: '#fff' }}>~{rec.days_reorder_will_last} days</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--color-text-dim)' }}>Best Vendor:</span> <strong style={{ color: 'var(--color-primary)' }}>{rec.recommended_supplier_name}</strong>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                          <button className="btn btn-secondary" onClick={() => setSelectedRec(rec)} style={{ fontSize: '0.72rem', padding: '4px 10px', flex: 1 }}>
                            <ExternalLink size={12} /> Compare Side-by-Side
                          </button>
                          <button className="btn btn-success" onClick={() => handleApproveRec(rec.product_id, rec.recommended_supplier_id, rec.recommended_quantity)} style={{ fontSize: '0.72rem', padding: '4px 10px', flex: 1 }}>
                            <ShoppingCart size={12} /> Approve Reorder
                          </button>
                          <button className="btn btn-secondary" onClick={() => handleDismissRec(rec.product_id)} style={{ fontSize: '0.72rem', padding: '4px', maxWidth: '32px', color: '#f87171' }}>
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Supplier Box */}
              <div className="glass-card flex-column-full">
                <h3 style={{ color: 'var(--color-primary)', fontSize: '1.2rem', marginBottom: '4px', display:'flex', alignItems:'center', gap:8 }}><Plus size={18}/>Register Vendor</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
                  Register a new supplier to evaluate reorders.
                </p>

                {supplierAddStatus.message && (
                  <div style={{ padding: '8px 12px', background: supplierAddStatus.type === 'success' ? 'var(--color-success-glow)' : 'var(--color-danger-glow)', border: supplierAddStatus.type === 'success' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', fontSize: '0.80rem', color: supplierAddStatus.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)', marginBottom: '12px' }}>
                    {supplierAddStatus.message}
                  </div>
                )}

                <form onSubmit={handleAddSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Supplier Name *</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Raja Pulses"
                      value={newSupplier.name}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>WhatsApp Number *</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="+91..."
                        value={newSupplier.phone}
                        onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Email Address *</label>
                      <input 
                        type="email" 
                        className="input-field" 
                        placeholder="sales@vendor.com"
                        value={newSupplier.email}
                        onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Payment Terms</label>
                    <select 
                      className="select-input"
                      value={newSupplier.paymentTerms}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, paymentTerms: e.target.value }))}
                    >
                      <option value="COD">Cash on Delivery (COD)</option>
                      <option value="Net 15">Net 15 Days</option>
                      <option value="Net 30">Net 30 Days</option>
                      <option value="UPI">UPI instant transfer</option>
                    </select>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={isAddingSupplier}>
                    {isAddingSupplier ? 'Adding Supplier...' : <><Plus size={15}/>Register Vendor</>}
                  </button>
                </form>
              </div>

            </div>

            {/* Live Suppliers Table & Pending POs List */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
              
              {/* Suppliers List Table */}
              <div className="glass-card flex-column-full">
                <h3 style={{ color: 'var(--color-primary)', fontSize: '1.15rem', marginBottom: '14px', display:'flex', alignItems:'center', gap:8 }}><Users size={16}/>Supplier Directory</h3>
                
                <div style={{ overflowX: 'auto', flex: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-card-border)', color: 'var(--color-text-muted)' }}>
                        <th style={{ padding: '8px' }}>ID</th>
                        <th style={{ padding: '8px' }}>Vendor Name</th>
                        <th style={{ padding: '8px' }}>Reliability</th>
                        <th style={{ padding: '8px' }}>Payment Terms</th>
                        <th style={{ padding: '8px' }}>Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliers.map(s => (
                        <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '8px', fontWeight: 'bold' }}>{s.id}</td>
                          <td style={{ padding: '8px' }}>{s.name}</td>
                          <td style={{ padding: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: s.reliability >= 90 ? 'var(--color-success)' : s.reliability >= 80 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                                {s.reliability}%
                              </span>
                              <div style={{ width: '50px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ width: `${s.reliability}%`, height: '100%', background: s.reliability >= 90 ? 'var(--color-success)' : s.reliability >= 80 ? 'var(--color-warning)' : 'var(--color-danger)' }} />
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '8px', color: 'var(--color-text-muted)' }}>{s.payment_terms}</td>
                          <td style={{ padding: '8px', fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>{s.phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Purchase Orders Table */}
              <div className="glass-card flex-column-full">
                <h3 style={{ color: 'var(--color-primary)', fontSize: '1.15rem', marginBottom: '14px', display:'flex', alignItems:'center', gap:8 }}><FileText size={16}/>Purchase Order Logs</h3>
                
                <div style={{ overflowX: 'auto', flex: 1 }}>
                  {purchaseOrders.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-dim)', fontSize: '0.75rem' }}>No purchase orders recorded yet.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-card-border)', color: 'var(--color-text-muted)' }}>
                          <th style={{ padding: '8px' }}>PO ID</th>
                          <th style={{ padding: '8px' }}>Supplier</th>
                          <th style={{ padding: '8px' }}>Total Amount</th>
                          <th style={{ padding: '8px' }}>Expected Delivery</th>
                          <th style={{ padding: '8px' }}>Status</th>
                          <th style={{ padding: '8px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseOrders.map(po => {
                          const isDelivered = po.status === "Delivered";
                          return (
                            <tr key={po.po_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '8px', fontWeight: 'bold' }}>{po.po_id}</td>
                              <td style={{ padding: '8px' }}>{po.supplier_name}</td>
                              <td style={{ padding: '8px', fontWeight: '600', color: 'var(--color-success)' }}>
                                {business?.currency || "₹"}{po.total_amount.toLocaleString('en-IN')}
                              </td>
                              <td style={{ padding: '8px', color: 'var(--color-text-dim)' }}>{po.expected_delivery}</td>
                              <td style={{ padding: '8px' }}>
                                <span style={{ background: isDelivered ? 'var(--color-success-glow)' : 'var(--color-warning-glow)', color: isDelivered ? 'var(--color-success)' : 'var(--color-warning)', padding: '2px 6px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: 'bold' }}>
                                  {po.status}
                                </span>
                              </td>
                              <td style={{ padding: '8px' }}>
                                {!isDelivered && (
                                  <button 
                                    className="btn btn-primary" 
                                    onClick={() => handleReceivePO(po.po_id)} 
                                    disabled={poReceivingId === po.po_id}
                                    style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: '4px' }}
                                  >
                                    {poReceivingId === po.po_id ? 'Loading...' : '🚚 Mark Delivered'}
                                  </button>
                                )}
                                {isDelivered && po.fulfillment_score && (
                                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>
                                    Score: {po.fulfillment_score}%
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>

            {/* SIDE-BY-SIDE COMPARE MODAL */}
            {selectedRec && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '640px', background: 'var(--color-bg)', padding: '24px', border: '1px solid rgba(99, 102, 241, 0.4)', borderRadius: '12px' }}>
                  <h3 style={{ color: '#818cf8', fontSize: '1.25rem', marginBottom: '8px' }}>📊 Side-by-Side Supplier Comparison</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                    Comparing available vendors for <strong>{selectedRec.product_name}</strong> (Stock depletions in {selectedRec.days_remaining} days).
                  </p>

                  <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-card-border)', color: 'var(--color-text-muted)' }}>
                          <th style={{ padding: '8px' }}>Vendor</th>
                          <th style={{ padding: '8px' }}>Procurement Score</th>
                          <th style={{ padding: '8px' }}>Unit Price</th>
                          <th style={{ padding: '8px' }}>Delivery Lead Time</th>
                          <th style={{ padding: '8px' }}>MOQ</th>
                          <th style={{ padding: '8px' }}>Vendor Reliability</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRec.capable_suppliers.map(c => {
                          const isRecommended = c.supplier_id === selectedRec.recommended_supplier_id;
                          const tooSlow = c.lead_time_days > selectedRec.days_remaining;
                          return (
                            <tr key={c.supplier_id} style={{ borderBottom: '1px solid var(--color-card-border)', background: isRecommended ? 'var(--color-primary-light)' : 'transparent' }}>
                              <td style={{ padding: '10px', fontWeight: 'bold' }}>
                                {c.supplier_name} {isRecommended && "⭐"}
                              </td>
                              <td style={{ padding: '10px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                {c.procurement_score}%
                              </td>
                              <td style={{ padding: '10px', fontWeight: 'bold' }}>
                                {business?.currency || "₹"}{c.unit_price}
                              </td>
                              <td style={{ padding: '10px', color: tooSlow ? 'var(--color-danger)' : 'var(--color-text-main)' }}>
                                {c.lead_time_days} days {tooSlow && "(⚠️ Late)"}
                              </td>
                              <td style={{ padding: '10px' }}>
                                {c.min_order_qty} units
                              </td>
                              <td style={{ padding: '10px', color: 'var(--color-text-muted)' }}>
                                {c.reliability}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--color-card-border)', fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: '1.4', marginBottom: '20px' }}>
                    <strong>Analysis:</strong> {selectedRec.reasoning}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={() => setSelectedRec(null)}>Close</button>
                    <button className="btn btn-success" onClick={() => {
                      handleApproveRec(selectedRec.product_id, selectedRec.recommended_supplier_id, selectedRec.recommended_quantity);
                      setSelectedRec(null);
                    }}>
                      Approve Top Recommended Vendor
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* WHATSAPP ORDER PREVIEW MODAL */}
            {showPoModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '520px', background: 'var(--color-bg)', padding: '24px', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '12px' }}>
                  <h3 style={{ color: 'var(--color-success)', fontSize: '1.25rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={20} /> Purchase Order Draft
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
                    Copy this WhatsApp message draft and forward it to your supplier to place the order:
                  </p>

                  <textarea 
                    className="input-field"
                    value={poModalText}
                    readOnly
                    rows={8}
                    style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.78rem', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px', resize: 'none', border: '1px solid var(--color-card-border)', color: '#fff', marginBottom: '16px' }}
                  />

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={() => setShowPoModal(false)}>Close</button>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => {
                        navigator.clipboard.writeText(poModalText);
                        setSuccessMessage("WhatsApp purchase order template copied to clipboard!");
                        setShowPoModal(false);
                      }}
                    >
                      <Copy size={14} /> Copy Draft Text
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 5: DOCUMENT HUB */}
        {activeTab === "upload" && (
          <div className="tab-container">
            <div className="hub-flex-container">
              <div className="glass-card flex-column-full" style={{ gap: '15px' }}>
                <div>
                  <h3 style={{ color: 'var(--color-primary)', marginBottom: '4px', fontSize: '1.15rem', display:'flex', alignItems:'center', gap:8 }}><Upload size={18}/>Document Upload Parser</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Upload invoices, bills, spreadsheets, and voice notes for AI processing.</p>
                </div>

                <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  <div className="dropzone">
                    <Upload size={28} color="var(--color-primary)" />
                    <span style={{ fontSize: '0.85rem' }}>Drag or choose business documents</span>
                    <p style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>Supports CSV, PNG, JPG, PDF, WAV, MP3</p>
                    
                    <input 
                      type="file" 
                      onChange={handleFileChange}
                      style={{ fontSize: '0.75rem', background: '#080c16', padding: '6px', borderRadius: '4px', width: '100%', maxWidth: '240px' }} 
                    />
                  </div>

                  {selectedFile && (
                    <div style={{ fontSize: '0.8rem', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--color-card-border)' }}>
                      Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary" disabled={isUploading || !selectedFile} style={{ width: '100%' }}>
                    {isUploading ? <><div className="animate-spin" style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%' }} /> Processing...</> : <><Zap size={15}/>Process Document</>}
                  </button>
                </form>

                {uploadResult && (
                  <div style={{ color: uploadResult.success ? 'var(--color-success)' : 'var(--color-danger)', fontSize: '0.8rem', padding: '10px', background: uploadResult.success ? 'var(--color-success-glow)' : 'var(--color-danger-glow)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '6px' }}>
                    {uploadResult.message}
                  </div>
                )}
              </div>

              <div className="glass-card flex-column-full" style={{ gap: '15px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
                  <FileCheck size={20} color="var(--color-primary)" /> AI Extracted OCR & Transcription
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  Extracted key-value records mapped from files using Gemini Multimodal models.
                </p>

                <textarea 
                  className="input-field" 
                  value={filePreview || "No files parsed in this session yet. Upload invoices or voice notes to inspect raw metadata logs."}
                  readOnly
                  style={{ flex: 1, height: '100%', fontFamily: 'monospace', fontSize: '0.8rem', resize: 'none', background: 'rgba(5,8,15,0.9)' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: WHATSAPP WEBHOOK SANDBOX SIMULATOR */}
        {activeTab === "phone" && (
          <div className="tab-container">
            <div className="sandbox-flex-container">
              <div className="glass-card flex-column-full" style={{ gap: '15px', justifyContent: 'center' }}>
                <div>
                  <h3 style={{ color: 'var(--color-primary)', marginBottom: '4px', fontSize: '1.15rem', display:'flex', alignItems:'center', gap:8 }}><Smartphone size={18}/>Twilio Sandbox Simulator</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    This simulator logs WhatsApp alerts sent to <strong>{business?.merchantWhatsapp || user?.mobile}</strong> and tests incoming query webhooks.
                  </p>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.01)', padding: '14px', borderRadius: '10px', border: '1px solid var(--color-card-border)' }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '6px' }}>Sandbox Controls</h4>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    <button className="btn btn-secondary" onClick={handleClearLogs} style={{ flex: 1 }}>
                      <Trash2 size={14} /> Clear Logs
                    </button>
                    <button className="btn btn-success" onClick={() => fetchWhatsappLogs(token)} style={{ flex: 1 }}>
                      <RefreshCw size={14} /> Sync Logs
                    </button>
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '10px', border: '1px solid var(--color-card-border)' }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Test Inbound Message</h4>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" onClick={() => handleSimulateInbound("How is my stock level for oils?")} style={{ fontSize: '0.7rem', padding: '4px 8px' }}>Check Oils</button>
                    <button className="btn btn-secondary" onClick={() => handleSimulateInbound("Am I profitable this month?")} style={{ fontSize: '0.7rem', padding: '4px 8px' }}>Check Profits</button>
                    <button className="btn btn-secondary" onClick={() => handleSimulateInbound("Who is my best supplier for Basmati Rice?")} style={{ fontSize: '0.7rem', padding: '4px 8px' }}>Best Supplier</button>
                    <button className="btn btn-secondary" onClick={() => handleSimulateInbound("Create PO recommendation for Basmati Rice")} style={{ fontSize: '0.7rem', padding: '4px 8px' }}>Draft PO Advice</button>
                  </div>
                </div>
              </div>

              <div className="phone-shell">
                <div style={{ padding: '12px 16px', background: '#075e54', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justify: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>A</div>
                  <div>
                    <h4 style={{ fontSize: '0.85rem' }}>AegisAI Gateway</h4>
                    <p style={{ fontSize: '0.6rem', color: '#a3e635' }}>Active (Simulated sandbox)</p>
                  </div>
                </div>

                <div className="phone-screen">
                  {whatsappLogs.length === 0 ? (
                    <div style={{ margin: 'auto', textAlign: 'center', color: '#64748b', fontSize: '0.72rem', padding: '10px', background: 'rgba(255,255,255,0.7)', borderRadius: '6px' }}>
                      No alerts logged in the sandbox. Audit stock levels or trigger manual messages above to begin.
                    </div>
                  ) : (
                    whatsappLogs.map((log, idx) => {
                      const isMerchant = log.body.startsWith("Merchant asked");
                      const cleanBody = log.body.replace("Merchant asked: ", "");
                      return (
                        <div key={idx} className={`phone-msg-bubble ${isMerchant ? 'out' : 'in'}`} style={{ whiteSpace: 'pre-line' }}>
                          <div>{cleanBody}</div>
                          <div style={{ fontSize: '0.52rem', color: '#94a3b8', textAlign: 'right', marginTop: '3px' }}>
                            {log.timestamp} {log.status && `(${log.status})`}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: GOVERNMENT SCHEMES ELIGIBILITY & DOCUMENT VERIFICATION */}
        {activeTab === "schemes" && (
          <div className="scrollable-tab">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', color: 'var(--color-primary)', fontWeight: 'bold', display:'flex', alignItems:'center', gap:8 }}><Award size={22}/>Government Scheme Eligibility Check</h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  Enter your business details below to check eligibility for major Indian MSME credit and certification schemes.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--color-card-border)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Translate Explanation:</span>
                <select className="select-input" value={eligibilityLanguage} onChange={(e) => setEligibilityLanguage(e.target.value)} style={{ padding: '3px 8px', fontSize: '0.78rem' }}>
                  <option value="english">English</option>
                  <option value="tamil">தமிழ் (Tamil)</option>
                  <option value="hindi">हिंदी (Hindi)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '24px' }}>
              {/* LEFT COLUMN: Business Profile Form */}
              <div className="glass-card flex-column-full" style={{ gap: '12px' }}>
                <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--color-card-border)', paddingBottom: '8px', color: 'var(--color-success)', display:'flex', alignItems:'center', gap:6 }}><User size={15}/>Business Profile Details</h3>
                <form onSubmit={handleCheckEligibility} style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', paddingRight: '4px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '3px' }}>
                      Business Name <span style={{ color: 'var(--color-text-dim)' }}>(e.g. Karthik Retailers)</span>
                    </label>
                    <input type="text" className="input-field" value={eligibilityInputs.businessName} onChange={(e) => setEligibilityInputs(prev => ({ ...prev, businessName: e.target.value }))} required placeholder="Karthik Retailers" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '3px' }}>
                        Business Type <span style={{ color: 'var(--color-text-dim)' }}>(e.g. Proprietorship)</span>
                      </label>
                      <select className="select-input" value={eligibilityInputs.businessType} onChange={(e) => setEligibilityInputs(prev => ({ ...prev, businessType: e.target.value }))}>
                        <option value="Sole Proprietorship">Sole Proprietorship</option>
                        <option value="Partnership">Partnership</option>
                        <option value="LLP">LLP (Limited Liability)</option>
                        <option value="Private Limited">Private Limited</option>
                        <option value="Co-operative">Co-operative</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '3px' }}>
                        Business Sector <span style={{ color: 'var(--color-text-dim)' }}>(e.g. Retail)</span>
                      </label>
                      <select className="select-input" value={eligibilityInputs.businessSector} onChange={(e) => setEligibilityInputs(prev => ({ ...prev, businessSector: e.target.value }))}>
                        <option value="Retail & Trading">Retail & Trading</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Services">Services</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '3px' }}>State</label>
                      <select className="select-input" value={eligibilityInputs.state} onChange={(e) => setEligibilityInputs(prev => ({ ...prev, state: e.target.value }))}>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '3px' }}>District</label>
                      <input type="text" className="input-field" value={eligibilityInputs.district} onChange={(e) => setEligibilityInputs(prev => ({ ...prev, district: e.target.value }))} required placeholder="Chennai" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '3px' }}>Business Start Date</label>
                      <input type="date" className="input-field" value={eligibilityInputs.businessStartDate} onChange={(e) => setEligibilityInputs(prev => ({ ...prev, businessStartDate: e.target.value }))} required />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '3px' }}>Employees</label>
                      <input type="number" className="input-field" value={eligibilityInputs.employeeCount} onChange={(e) => setEligibilityInputs(prev => ({ ...prev, employeeCount: e.target.value }))} required placeholder="5" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '3px' }}>
                        Annual Turnover <span style={{ color: 'var(--color-text-dim)' }}>(₹)</span>
                      </label>
                      <input type="number" className="input-field" value={eligibilityInputs.annualTurnover} onChange={(e) => setEligibilityInputs(prev => ({ ...prev, annualTurnover: e.target.value }))} required placeholder="e.g. 2500000" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '3px' }}>
                        Loan Required <span style={{ color: 'var(--color-text-dim)' }}>(₹)</span>
                      </label>
                      <input type="number" className="input-field" value={eligibilityInputs.loanRequirement} onChange={(e) => setEligibilityInputs(prev => ({ ...prev, loanRequirement: e.target.value }))} required placeholder="e.g. 500000" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '3px' }}>GST Status</label>
                      <select className="select-input" value={eligibilityInputs.gstStatus} onChange={(e) => setEligibilityInputs(prev => ({ ...prev, gstStatus: e.target.value }))}>
                        <option value="Registered">Registered</option>
                        <option value="Not Registered">Not Registered</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '3px' }}>Udyam Status</label>
                      <select className="select-input" value={eligibilityInputs.udyamStatus} onChange={(e) => setEligibilityInputs(prev => ({ ...prev, udyamStatus: e.target.value }))}>
                        <option value="Registered">Registered</option>
                        <option value="Not Registered">Not Registered</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '3px' }}>Enterprise Category</label>
                      <select className="select-input" value={eligibilityInputs.enterpriseCategory} onChange={(e) => setEligibilityInputs(prev => ({ ...prev, enterpriseCategory: e.target.value }))}>
                        <option value="Micro">Micro (&lt; ₹5 Cr Turnover)</option>
                        <option value="Small">Small (&lt; ₹50 Cr Turnover)</option>
                        <option value="Medium">Medium (&lt; ₹250 Cr Turnover)</option>
                        <option value="Not Applicable">Not Applicable</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '3px' }}>Prev Govt Assistance</label>
                      <select className="select-input" value={eligibilityInputs.previousAssistance} onChange={(e) => setEligibilityInputs(prev => ({ ...prev, previousAssistance: e.target.value }))}>
                        <option value="No">No (First Time Assistance)</option>
                        <option value="Yes">Yes (Received Subsidies)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', display: 'block', marginBottom: '3px' }}>Social Category</label>
                      <select className="select-input" value={eligibilityInputs.socialCategory} onChange={(e) => setEligibilityInputs(prev => ({ ...prev, socialCategory: e.target.value }))}>
                        <option value="General">General</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', display: 'block', marginBottom: '3px' }}>Owner Gender</label>
                      <select className="select-input" value={eligibilityInputs.ownerGender} onChange={(e) => setEligibilityInputs(prev => ({ ...prev, ownerGender: e.target.value }))}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', display: 'block', marginBottom: '3px' }}>Area</label>
                      <select className="select-input" value={eligibilityInputs.area} onChange={(e) => setEligibilityInputs(prev => ({ ...prev, area: e.target.value }))}>
                        <option value="Urban">Urban</option>
                        <option value="Rural">Rural</option>
                      </select>
                    </div>
                  </div>

                  <button className="btn btn-primary" type="submit" disabled={eligibilityLoading} style={{ marginTop: '10px' }}>
                    {eligibilityLoading ? <RefreshCw size={14} className="spin" /> : "Check Scheme Eligibility"}
                  </button>
                </form>
              </div>

              {/* RIGHT COLUMN: Scheme Results or Document Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', maxHeight: 'calc(100vh - 120px)', paddingRight: '4px' }}>
                
                {/* SCHEME RESULTS CARDS LIST */}
                {eligibilityError && (
                  <div className="glass-card" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)', fontSize: '0.85rem' }}>
                    ⚠️ {eligibilityError}
                  </div>
                )}

                {eligibilityResults.length === 0 ? (
                  <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(15,22,38,0.4)', borderStyle: 'dashed' }}>
                    <Coins size={36} style={{ color: 'var(--color-primary)', marginBottom: '10px', opacity: 0.7 }} />
                    <h4 style={{ fontSize: '1rem', color: 'var(--color-text-main)' }}>Awaiting Eligibility Analysis</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', maxWidth: '400px', margin: '6px auto 0' }}>
                      Submit your business profile details on the left. AegisAI will check your constraints against active schemes and provide guidance.
                    </p>
                  </div>
                ) : (
                  eligibilityResults.map((scheme, idx) => {
                    const isEligible = scheme.status === "Eligible";
                    const isPossible = scheme.status === "Possibly Eligible";
                    
                    let badgeColor = "var(--color-text-muted)";
                    let badgeBg = "rgba(255,255,255,0.05)";
                    let cardBorder = "var(--color-card-border)";
                    let glowStyles = {};

                    if (isEligible) {
                      badgeBg = "var(--color-success-glow)";
                      badgeColor = "var(--color-success)";
                      cardBorder = "rgba(16, 185, 129, 0.25)";
                      glowStyles = { boxShadow: '0 0 20px rgba(16, 185, 129, 0.08)' };
                    } else if (isPossible) {
                      badgeBg = "var(--color-warning-glow)";
                      badgeColor = "var(--color-warning)";
                      cardBorder = "rgba(245, 158, 11, 0.25)";
                      glowStyles = { boxShadow: '0 0 20px rgba(245, 158, 11, 0.08)' };
                    } else {
                      badgeBg = "var(--color-danger-glow)";
                      badgeColor = "var(--color-danger)";
                      cardBorder = "rgba(244, 63, 94, 0.15)";
                    }

                    return (
                      <div 
                        key={idx} 
                        className="glass-card" 
                        style={{ border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: '12px', ...glowStyles }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px' }}>
                          <div>
                            <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-main)' }}>
                              {scheme.name[eligibilityLanguage] || scheme.name.en}
                            </h3>
                            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', marginTop: '2px' }}>
                              {scheme.description[eligibilityLanguage] || scheme.description.en}
                            </p>
                          </div>
                          <span 
                            style={{ 
                              padding: '4px 10px', 
                              borderRadius: '6px', 
                              fontSize: '0.75rem', 
                              fontWeight: 'bold', 
                              background: badgeBg, 
                              color: badgeColor, 
                              whiteSpace: 'nowrap' 
                            }}
                          >
                            {scheme.status}
                          </span>
                        </div>

                        {/* Benefits and official link */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '8px' }}>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase' }}>Scheme Benefit:</span>
                            <span style={{ fontSize: '0.8rem', color: '#a3e635', fontWeight: '500' }}>
                              {scheme.benefits[eligibilityLanguage] || scheme.benefits.en}
                            </span>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase' }}>Official Portal:</span>
                            <a href={scheme.official_link} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#60a5fa', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              Apply Officially <ExternalLink size={10} />
                            </a>
                          </div>
                        </div>

                        {/* Matched / Missing Rules Details */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '15px', fontSize: '0.78rem' }}>
                          <div>
                            <span style={{ color: 'var(--color-success)', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>✓ Matched Conditions:</span>
                            <ul style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {scheme.matched_conditions.map((item, idy) => (
                                <li key={idy} style={{ color: 'var(--color-text-muted)' }}>🟢 {item}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            {scheme.missing_requirements.length > 0 && (
                              <>
                                <span style={{ color: isPossible ? 'var(--color-warning)' : 'var(--color-danger)', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>
                                  {isPossible ? "⚠️ Missing Registrations / Adjustments:" : "❌ Disqualifying Criteria:"}
                                </span>
                                <ul style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  {scheme.missing_requirements.map((item, idy) => (
                                    <li key={idy} style={{ color: 'var(--color-text-muted)' }}>🔴 {item}</li>
                                  ))}
                                </ul>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Required Documents Section */}
                        <div style={{ borderTop: '1px solid var(--color-card-border)', paddingTop: '10px', marginTop: '4px' }}>
                          <span style={{ color: '#818cf8', fontWeight: 'bold', display: 'block', marginBottom: '6px', fontSize: '0.75rem' }}>
                            📁 Required Supporting Documents:
                          </span>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {scheme.required_documents.map((doc, dIdx) => (
                              <span 
                                key={dIdx} 
                                style={{ 
                                  background: 'rgba(255,255,255,0.04)', 
                                  border: '1px solid var(--color-card-border)', 
                                  padding: '4px 10px', 
                                  borderRadius: '6px', 
                                  fontSize: '0.74rem', 
                                  color: 'var(--color-text-main)' 
                                }}
                              >
                                {doc[`name_${eligibilityLanguage}`] || doc.name_en}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Groq Multilingual Guidance Box */}
                        {scheme.explanation && (
                          <div style={{ borderLeft: '3px solid var(--color-primary)', background: 'rgba(99,102,241,0.03)', padding: '10px 14px', borderRadius: '4px', fontSize: '0.8rem', whiteSpace: 'pre-line' }}>
                            <span style={{ color: '#818cf8', fontWeight: 'bold', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>🤖 AegisAI Assistant Guidance (Groq Explainer)</span>
                            {scheme.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: SCHEME ADMIN CONFIGURATION MODULE */}
        {activeTab === "adminSchemes" && (
          <div className="scrollable-tab">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', color: 'var(--color-warning)', fontWeight: 'bold', display:'flex', alignItems:'center', gap:8 }}><Settings size={22}/>Scheme Administration Module</h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  Manage active government schemes, eligibility parameters, rules, benefits, and required document files.
                </p>
              </div>
              <button 
                className="btn btn-success" 
                onClick={() => {
                  setAdminSelectedScheme({
                    id: "",
                    name_en: "", name_ta: "", name_hi: "",
                    description_en: "", description_ta: "", description_hi: "",
                    benefits_en: "", benefits_ta: "", benefits_hi: "",
                    official_link: "",
                    required_documents: [],
                    rules: {
                      enterprise_categories: ["Micro", "Small"],
                      sectors: ["Manufacturing", "Services"],
                      max_turnover: "",
                      min_loan_requirement: "",
                      max_loan_requirement: "",
                      requires_udyam: false,
                      requires_gst: false,
                      owner_gender: [],
                      owner_social_category: []
                    }
                  });
                  setAdminModalMode("add");
                  setAdminModalOpen(true);
                }}
              >
                <Plus size={16} /> Add Custom Scheme
              </button>
            </div>

            {adminError && (
              <div className="glass-card" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)', fontSize: '0.85rem' }}>
                ⚠️ {adminError}
              </div>
            )}

            <div className="glass-card" style={{ padding: '0px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-card-border)', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '12px' }}>Scheme Name</th>
                    <th style={{ padding: '12px' }}>ID</th>
                    <th style={{ padding: '12px' }}>Sectors</th>
                    <th style={{ padding: '12px' }}>MSME Cat</th>
                    <th style={{ padding: '12px' }}>Required Docs</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminSchemes.map((scheme, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--color-card-border)' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{scheme.name_en}</td>
                      <td style={{ padding: '12px', color: 'var(--color-text-muted)' }}><code>{scheme.id}</code></td>
                      <td style={{ padding: '12px' }}>{scheme.rules.sectors.join(", ")}</td>
                      <td style={{ padding: '12px' }}>{scheme.rules.enterprise_categories.join(", ")}</td>
                      <td style={{ padding: '12px' }}>{scheme.required_documents.length} Files</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            onClick={() => {
                              setAdminSelectedScheme(scheme);
                              setAdminModalMode("edit");
                              setAdminModalOpen(true);
                            }}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#f87171', borderColor: 'rgba(248,113,113,0.15)' }}
                            onClick={() => handleAdminDeleteScheme(scheme.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ADMIN MODAL FORM */}
            {adminModalOpen && adminSelectedScheme && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                <div className="glass-card" style={{ width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', border: '1px solid var(--color-primary-glow)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-card-border)', paddingBottom: '8px' }}>
                    <h3 style={{ fontSize: '1.25rem', color: '#f59e0b' }}>
                      {adminModalMode === "add" ? "➕ Create Custom Government Scheme" : "✏️ Edit Scheme Configuration"}
                    </h3>
                    <button onClick={() => setAdminModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleAdminSaveScheme} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    {/* Basic IDs and Links */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>Scheme ID (Unique)</label>
                        <input 
                          type="text" 
                          className="input-field" 
                          value={adminSelectedScheme.id}
                          onChange={(e) => setAdminSelectedScheme(prev => ({ ...prev, id: e.target.value }))}
                          disabled={adminModalMode === "edit"}
                          required 
                          placeholder="e.g. startup_india"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>Official Application Portal URL</label>
                        <input 
                          type="url" 
                          className="input-field" 
                          value={adminSelectedScheme.official_link}
                          onChange={(e) => setAdminSelectedScheme(prev => ({ ...prev, official_link: e.target.value }))}
                          required 
                          placeholder="https://example.gov.in"
                        />
                      </div>
                    </div>

                    {/* Multilingual Names */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>Name (English)</label>
                        <input type="text" className="input-field" value={adminSelectedScheme.name_en} onChange={(e) => setAdminSelectedScheme(prev => ({ ...prev, name_en: e.target.value }))} required />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>Name (Tamil - தமிழ்)</label>
                        <input type="text" className="input-field" value={adminSelectedScheme.name_ta} onChange={(e) => setAdminSelectedScheme(prev => ({ ...prev, name_ta: e.target.value }))} required />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>Name (Hindi - हिंदी)</label>
                        <input type="text" className="input-field" value={adminSelectedScheme.name_hi} onChange={(e) => setAdminSelectedScheme(prev => ({ ...prev, name_hi: e.target.value }))} required />
                      </div>
                    </div>

                    {/* Descriptions */}
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>Description (English)</label>
                      <input type="text" className="input-field" value={adminSelectedScheme.description_en} onChange={(e) => setAdminSelectedScheme(prev => ({ ...prev, description_en: e.target.value }))} required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>Description (Tamil)</label>
                        <input type="text" className="input-field" value={adminSelectedScheme.description_ta} onChange={(e) => setAdminSelectedScheme(prev => ({ ...prev, description_ta: e.target.value }))} required />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>Description (Hindi)</label>
                        <input type="text" className="input-field" value={adminSelectedScheme.description_hi} onChange={(e) => setAdminSelectedScheme(prev => ({ ...prev, description_hi: e.target.value }))} required />
                      </div>
                    </div>

                    {/* Benefits */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>Benefits (English)</label>
                        <input type="text" className="input-field" value={adminSelectedScheme.benefits_en} onChange={(e) => setAdminSelectedScheme(prev => ({ ...prev, benefits_en: e.target.value }))} required />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>Benefits (Tamil)</label>
                        <input type="text" className="input-field" value={adminSelectedScheme.benefits_ta} onChange={(e) => setAdminSelectedScheme(prev => ({ ...prev, benefits_ta: e.target.value }))} required />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>Benefits (Hindi)</label>
                        <input type="text" className="input-field" value={adminSelectedScheme.benefits_hi} onChange={(e) => setAdminSelectedScheme(prev => ({ ...prev, benefits_hi: e.target.value }))} required />
                      </div>
                    </div>

                    {/* Rules Evaluation Parameters */}
                    <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--color-card-border)' }}>
                      <h4 style={{ fontSize: '0.85rem', color: '#f59e0b', marginBottom: '10px' }}>⚙️ Eligibility Rule Engine Thresholds</h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '3px' }}>Sectors Allowed</label>
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '0.75rem', marginTop: '4px' }}>
                            {["Manufacturing", "Services", "Retail & Trading"].map((sec) => (
                              <label key={sec} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input 
                                  type="checkbox"
                                  checked={adminSelectedScheme.rules.sectors.includes(sec)}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setAdminSelectedScheme(prev => {
                                      const oldSectors = prev.rules.sectors;
                                      const newSectors = checked 
                                        ? [...oldSectors, sec]
                                        : oldSectors.filter(s => s !== sec);
                                      return { ...prev, rules: { ...prev.rules, sectors: newSectors } };
                                    });
                                  }}
                                />
                                {sec}
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '3px' }}>MSME Categories Allowed</label>
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '0.75rem', marginTop: '4px' }}>
                            {["Micro", "Small", "Medium"].map((cat) => (
                              <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input 
                                  type="checkbox"
                                  checked={adminSelectedScheme.rules.enterprise_categories.includes(cat)}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setAdminSelectedScheme(prev => {
                                      const oldCats = prev.rules.enterprise_categories;
                                      const newCats = checked 
                                        ? [...oldCats, cat]
                                        : oldCats.filter(c => c !== cat);
                                      return { ...prev, rules: { ...prev.rules, enterprise_categories: newCats } };
                                    });
                                  }}
                                />
                                {cat}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '3px' }}>Max Annual Turnover (₹)</label>
                          <input 
                            type="number" 
                            className="input-field" 
                            value={adminSelectedScheme.rules.max_turnover || ""}
                            onChange={(e) => setAdminSelectedScheme(prev => ({ 
                              ...prev, 
                              rules: { ...prev.rules, max_turnover: e.target.value ? parseFloat(e.target.value) : null } 
                            }))}
                            placeholder="Unlimited"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '3px' }}>Min Loan Amount (₹)</label>
                          <input 
                            type="number" 
                            className="input-field" 
                            value={adminSelectedScheme.rules.min_loan_requirement || ""}
                            onChange={(e) => setAdminSelectedScheme(prev => ({ 
                              ...prev, 
                              rules: { ...prev.rules, min_loan_requirement: e.target.value ? parseFloat(e.target.value) : null } 
                            }))}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '3px' }}>Max Loan Amount (₹)</label>
                          <input 
                            type="number" 
                            className="input-field" 
                            value={adminSelectedScheme.rules.max_loan_requirement || ""}
                            onChange={(e) => setAdminSelectedScheme(prev => ({ 
                              ...prev, 
                              rules: { ...prev.rules, max_loan_requirement: e.target.value ? parseFloat(e.target.value) : null } 
                            }))}
                            placeholder="Unlimited"
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '20px', fontSize: '0.78rem', marginTop: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                          <input 
                            type="checkbox"
                            checked={adminSelectedScheme.rules.requires_udyam}
                            onChange={(e) => setAdminSelectedScheme(prev => ({ 
                              ...prev, 
                              rules: { ...prev.rules, requires_udyam: e.target.checked } 
                            }))}
                          />
                          Requires Active Udyam/MSME Registration
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                          <input 
                            type="checkbox"
                            checked={adminSelectedScheme.rules.requires_gst}
                            onChange={(e) => setAdminSelectedScheme(prev => ({ 
                              ...prev, 
                              rules: { ...prev.rules, requires_gst: e.target.checked } 
                            }))}
                          />
                          Requires Active GSTIN
                        </label>
                      </div>
                    </div>

                    {/* Required Documents Section */}
                    <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--color-card-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h4 style={{ fontSize: '0.85rem', color: '#34d399' }}>📁 Required Supporting Documents</h4>
                        <button 
                          className="btn btn-secondary" 
                          type="button" 
                          style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                          onClick={() => {
                            setAdminSelectedScheme(prev => {
                              const docs = prev.required_documents || [];
                              const newDoc = { id: `doc_${Date.now()}`, name_en: "New Document", name_ta: "புதிய ஆவணம்", name_hi: "नया दस्तावेज़" };
                              return { ...prev, required_documents: [...docs, newDoc] };
                            });
                          }}
                        >
                          + Add Doc Field
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {adminSelectedScheme.required_documents?.map((doc, dIdx) => (
                          <div key={dIdx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                            <input 
                              type="text" 
                              className="input-field" 
                              value={doc.id}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAdminSelectedScheme(prev => {
                                  const list = [...prev.required_documents];
                                  list[dIdx].id = val;
                                  return { ...prev, required_documents: list };
                                });
                              }}
                              placeholder="Doc ID"
                              required 
                              style={{ fontSize: '0.75rem', padding: '4px 6px' }}
                            />
                            <input 
                              type="text" 
                              className="input-field" 
                              value={doc.name_en}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAdminSelectedScheme(prev => {
                                  const list = [...prev.required_documents];
                                  list[dIdx].name_en = val;
                                  return { ...prev, required_documents: list };
                                });
                              }}
                              placeholder="English Name"
                              required 
                              style={{ fontSize: '0.75rem', padding: '4px 6px' }}
                            />
                            <input 
                              type="text" 
                              className="input-field" 
                              value={doc.name_ta}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAdminSelectedScheme(prev => {
                                  const list = [...prev.required_documents];
                                  list[dIdx].name_ta = val;
                                  return { ...prev, required_documents: list };
                                });
                              }}
                              placeholder="Tamil Name"
                              required 
                              style={{ fontSize: '0.75rem', padding: '4px 6px' }}
                            />
                            <input 
                              type="text" 
                              className="input-field" 
                              value={doc.name_hi}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAdminSelectedScheme(prev => {
                                  const list = [...prev.required_documents];
                                  list[dIdx].name_hi = val;
                                  return { ...prev, required_documents: list };
                                });
                              }}
                              placeholder="Hindi Name"
                              required 
                              style={{ fontSize: '0.75rem', padding: '4px 6px' }}
                            />
                            <button 
                              className="btn btn-secondary" 
                              type="button" 
                              style={{ padding: '4px 8px', color: '#f87171' }}
                              onClick={() => {
                                setAdminSelectedScheme(prev => {
                                  const list = prev.required_documents.filter((_, idx) => idx !== dIdx);
                                  return { ...prev, required_documents: list };
                                });
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px', borderTop: '1px solid var(--color-card-border)', paddingTop: '10px' }}>
                      <button className="btn btn-secondary" type="button" onClick={() => setAdminModalOpen(false)}>Cancel</button>
                      <button className="btn btn-success" type="submit" disabled={adminLoading}>
                        {adminLoading ? <RefreshCw size={14} className="spin" /> : "Save Scheme Guidelines"}
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
