import React, { createContext, useContext, useState, useEffect } from 'react';

export interface FarmContextType {
  loading: boolean;
  farm: any;
  fields: any[];
  healthScore: any;
  sustainabilityScore: any;
  recommendations: any[];
  tasks: any[];
  alerts: any[];
  waterIntelligence: any;
  systemStatus: any;
  activeFieldId: string | null;
  setActiveFieldId: (id: string | null) => void;
  currentLanguage: 'en' | 'ta' | 'hi';
  setCurrentLanguage: (lang: 'en' | 'ta' | 'hi') => void;
  fetchDashboard: () => Promise<void>;
  triggerDemo: (scenario: 'smart-farm' | 'disease' | 'soil' | 'reset') => Promise<any>;
  recordIrrigation: (fieldId: string, amountLiters: number) => Promise<any>;
  submitFeedback: (recId: string, action: string, comment?: string) => Promise<any>;
  updateTaskStatus: (taskId: string, status: string) => Promise<any>;
  addCustomTask: (taskData: any) => Promise<any>;
  createNewFarm: (farmData: any) => Promise<any>;
  createNewField: (fieldData: any) => Promise<any>;
  plantNewCrop: (cropData: any) => Promise<any>;
  sendCopilotChat: (message: string) => Promise<string>;
  logout: () => void;
  isAuthenticated: boolean;
  login: (token: string, user: any) => void;
  user: any;
  
  // Shopping Cart & Marketplace
  cart: any[];
  addToCart: (product: any, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  checkoutCart: (checkoutDetails: any) => Promise<any>;
  fetchMarketplace: (category?: string, search?: string) => Promise<any[]>;
  fetchFarmerInventory: () => Promise<any[]>;
  addMarketplaceProduct: (prodData: any) => Promise<any>;
  updateMarketplaceProduct: (id: string, updateData: any) => Promise<any>;
  deleteMarketplaceProduct: (id: string) => Promise<any>;
  fetchCustomerOrders: () => Promise<any[]>;
  fetchFarmerOrders: () => Promise<any[]>;
  updateOrderStatus: (orderId: string, status: string) => Promise<any>;
  cancelOrder: (orderId: string, reason?: string) => Promise<any>;
  
  // Delivery Tracking
  fetchDeliveryPartners: () => Promise<any[]>;
  assignDeliveryPartner: (orderId: string, partnerId: string | null, manualData?: any) => Promise<any>;
  fetchDeliveryProfile: () => Promise<any>;
  updateDeliveryAvailability: (status: string) => Promise<any>;
  fetchOrderTracking: (orderId: string) => Promise<any>;
  fetchDeliveryRoute: (deliveryId: string) => Promise<any>;
  simulateDelivery: (deliveryId: string) => Promise<any>;
  
  // Payment and Disputes Protection
  payOrder: (orderId: string) => Promise<any>;
  acceptOrder: (orderId: string) => Promise<any>;
  dispatchOrder: (orderId: string) => Promise<any>;
  deliverOrder: (orderId: string, otp: string) => Promise<any>;
  disputeOrder: (orderId: string, reason: string) => Promise<any>;
  fetchAdminStats: () => Promise<any>;
  fetchAdminOrders: () => Promise<any[]>;
  restrictFarmer: (farmerId: string, restrict: boolean) => Promise<any>;
  resolveDispute: (orderId: string, resolution: 'REFUND' | 'RELEASE') => Promise<any>;

  // Soil & Crop Advisor
  runSoilTest: (soilData: any) => Promise<any>;
  fetchAdvisorHistory: () => Promise<any[]>;
  sendAdvisorChat: (message: string, soilData: any) => Promise<string>;
  fetchDemandInsights: () => Promise<any[]>;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Farm Telemetry State
  const [farm, setFarm] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState<any>(null);
  const [sustainabilityScore, setSustainabilityScore] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [waterIntelligence, setWaterIntelligence] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>({
    database: 'Checking...',
    ai: 'Checking...',
    weatherApi: 'Checking...',
    n8nStatus: 'Checking...'
  });
  
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ta' | 'hi'>(
    () => (localStorage.getItem('agrimind_language') as any) || 'en'
  );

  useEffect(() => {
    localStorage.setItem('agrimind_language', currentLanguage);
  }, [currentLanguage]);

  // Cart State
  const [cart, setCart] = useState<any[]>([]);

  const getHeaders = () => {
    const token = localStorage.getItem('agrimind_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const login = (token: string, userData: any) => {
    localStorage.setItem('agrimind_token', token);
    localStorage.setItem('agrimind_user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('agrimind_token');
    localStorage.removeItem('agrimind_user');
    localStorage.removeItem('agrimind_cart');
    setIsAuthenticated(false);
    setUser(null);
    setFarm(null);
    setFields([]);
    setCart([]);
  };

  // Check auth state and load cart on mount
  useEffect(() => {
    const token = localStorage.getItem('agrimind_token');
    
    const savedCart = localStorage.getItem('agrimind_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }

    if (token) {
      setLoading(true);
      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (res.ok) {
          return res.json();
        } else {
          throw new Error('Invalid token');
        }
      })
      .then(userData => {
        setIsAuthenticated(true);
        setUser(userData);
        localStorage.setItem('agrimind_user', JSON.stringify(userData));
      })
      .catch(err => {
        console.error('Auto-login session restoration failed:', err);
        localStorage.removeItem('agrimind_token');
        localStorage.removeItem('agrimind_user');
        setIsAuthenticated(false);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  // Save cart to local storage when changed
  const saveCartToStorage = (updatedCart: any[]) => {
    setCart(updatedCart);
    localStorage.setItem('agrimind_cart', JSON.stringify(updatedCart));
  };

  const addToCart = (product: any, quantity: number) => {
    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += quantity;
      saveCartToStorage(updated);
    } else {
      saveCartToStorage([...cart, { product, quantity }]);
    }
  };

  const removeFromCart = (productId: string) => {
    saveCartToStorage(cart.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    const updated = cart.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity: Math.max(1, quantity) };
      }
      return item;
    });
    saveCartToStorage(updated);
  };

  const clearCart = () => {
    saveCartToStorage([]);
  };

  const fetchDashboard = async () => {
    if (!isAuthenticated || (user && user.role !== 'farmer')) return;
    setLoading(true);
    try {
      const response = await fetch('/api/dashboard', { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setFarm(data.farm || null);
        setFields(data.fields || []);
        setHealthScore(data.healthScore || null);
        setSustainabilityScore(data.sustainabilityScore || null);
        setRecommendations(data.recommendations || []);
        setTasks(data.tasks || []);
        setAlerts(data.alerts || []);
        setWaterIntelligence(data.waterIntelligence || null);
        setSystemStatus(data.systemStatus || {});
        
        if (data.fields && data.fields.length > 0 && !activeFieldId) {
          setActiveFieldId(data.fields[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching farm dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
    }
  }, [isAuthenticated, user?.role]);

  const triggerDemo = async (scenario: 'smart-farm' | 'disease' | 'soil' | 'reset') => {
    try {
      const res = await fetch('/api/demo/run', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ scenario })
      });
      const data = await res.json();
      await fetchDashboard();
      return data;
    } catch (err) {
      console.error('Error executing simulation:', err);
    }
  };

  const recordIrrigation = async (fieldId: string, amountLiters: number) => {
    try {
      const res = await fetch('/api/irrigation/record', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ fieldId, amountLiters })
      });
      const data = await res.json();
      await fetchDashboard();
      return data;
    } catch (err) {
      console.error('Error recording irrigation:', err);
    }
  };

  const submitFeedback = async (recommendationId: string, action: string, comment?: string) => {
    try {
      const res = await fetch(`/api/recommendations/${recommendationId}/feedback`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ action, comment })
      });
      const data = await res.json();
      await fetchDashboard();
      return data;
    } catch (err) {
      console.error('Error submitting feedback:', err);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      await fetchDashboard();
      return data;
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const addCustomTask = async (taskData: any) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(taskData)
      });
      const data = await res.json();
      await fetchDashboard();
      return data;
    } catch (err) {
      console.error('Error creating custom task:', err);
    }
  };

  const createNewFarm = async (farmData: any) => {
    try {
      const res = await fetch('/api/farms', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(farmData)
      });
      const data = await res.json();
      await fetchDashboard();
      return data;
    } catch (err) {
      console.error('Error creating farm:', err);
    }
  };

  const createNewField = async (fieldData: any) => {
    try {
      const res = await fetch('/api/fields', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(fieldData)
      });
      const data = await res.json();
      await fetchDashboard();
      return data;
    } catch (err) {
      console.error('Error creating field:', err);
    }
  };

  const plantNewCrop = async (cropData: any) => {
    try {
      const res = await fetch('/api/crops', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(cropData)
      });
      const data = await res.json();
      await fetchDashboard();
      return data;
    } catch (err) {
      console.error('Error planting crop:', err);
    }
  };

  const sendCopilotChat = async (message: string): Promise<string> => {
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ question: message, language: currentLanguage })
      });
      if (res.ok) {
        const data = await res.json();
        return data.answer;
      }
      return 'Sorry, I could not process that message right now.';
    } catch (err) {
      console.error('Copilot request failed:', err);
      return 'Network error connecting to AgriMind Copilot.';
    }
  };

  // --- NEW INTEGRATIONS ---

  const fetchMarketplace = async (category?: string, search?: string) => {
    try {
      let url = '/api/marketplace';
      const params = [];
      if (category) params.push(`category=${encodeURIComponent(category)}`);
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch (e) {
      console.error('Marketplace fetch error', e);
      return [];
    }
  };

  const fetchFarmerInventory = async () => {
    try {
      const res = await fetch('/api/farmer/products', { headers: getHeaders() });
      if (res.ok) return await res.json();
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const addMarketplaceProduct = async (prodData: any) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(prodData)
      });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const updateMarketplaceProduct = async (id: string, updateData: any) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updateData)
      });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteMarketplaceProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const checkoutCart = async (checkoutDetails: any) => {
    try {
      const items = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }));
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ items, ...checkoutDetails })
      });
      const data = await res.json();
      if (data.success) {
        clearCart();
      }
      return data;
    } catch (e) {
      console.error(e);
      return { success: false, error: 'Checkout failed' };
    }
  };

  const fetchCustomerOrders = async () => {
    try {
      const res = await fetch('/api/orders/customer', { headers: getHeaders() });
      if (res.ok) return await res.json();
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const fetchFarmerOrders = async () => {
    try {
      const res = await fetch('/api/orders/farmer', { headers: getHeaders() });
      if (res.ok) return await res.json();
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const cancelOrder = async (orderId: string, reason?: string) => {
    try {
      const res = await fetch(`/api/customer/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ reason })
      });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDeliveryPartners = async () => {
    try {
      const res = await fetch('/api/deliveries/partners', { headers: getHeaders() });
      if (res.ok) return await res.json();
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const fetchDeliveryProfile = async () => {
    try {
      const res = await fetch('/api/delivery/profile', { headers: getHeaders() });
      if (res.ok) return await res.json();
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const updateDeliveryAvailability = async (status: string) => {
    try {
      const res = await fetch('/api/delivery/availability', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const assignDeliveryPartner = async (orderId: string, partnerId: string | null, manualData?: any) => {
    try {
      const bodyData = partnerId ? { deliveryPartnerId: partnerId } : manualData;
      const res = await fetch(`/api/deliveries/${orderId}/assign`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(bodyData)
      });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrderTracking = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/tracking`, { headers: getHeaders() });
      if (res.ok) return await res.json();
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const fetchDeliveryRoute = async (deliveryId: string) => {
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}/route`, { headers: getHeaders() });
      if (res.ok) return await res.json();
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const simulateDelivery = async (deliveryId: string) => {
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}/simulate`, {
        method: 'POST',
        headers: getHeaders()
      });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const payOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/pay`, {
        method: 'POST',
        headers: getHeaders()
      });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const acceptOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/accept`, {
        method: 'POST',
        headers: getHeaders()
      });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const dispatchOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/dispatch`, {
        method: 'POST',
        headers: getHeaders()
      });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const deliverOrder = async (orderId: string, otp: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/deliver`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ otp })
      });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const disputeOrder = async (orderId: string, reason: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/dispute`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ reason })
      });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', { headers: getHeaders() });
      if (res.ok) return await res.json();
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const fetchAdminOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders', { headers: getHeaders() });
      if (res.ok) return await res.json();
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const restrictFarmer = async (farmerId: string, restrict: boolean) => {
    try {
      const res = await fetch(`/api/admin/farmers/${farmerId}/restrict`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ restrict })
      });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const resolveDispute = async (orderId: string, resolution: 'REFUND' | 'RELEASE') => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/resolve-dispute`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ resolution })
      });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const runSoilTest = async (soilData: any) => {
    try {
      const res = await fetch('/api/advisor/soil-test', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(soilData)
      });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdvisorHistory = async () => {
    try {
      const res = await fetch('/api/advisor/history', { headers: getHeaders() });
      if (res.ok) return await res.json();
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const sendAdvisorChat = async (message: string, soilData: any): Promise<string> => {
    try {
      const res = await fetch('/api/advisor/chat', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ question: message, soilData })
      });
      if (res.ok) {
        const data = await res.json();
        return data.answer;
      }
      return 'Sorry, I could not process that question right now.';
    } catch (e) {
      console.error(e);
      return 'Network error connecting to Soil Copilot.';
    }
  };

  const fetchDemandInsights = async () => {
    try {
      const res = await fetch('/api/demand-insights', { headers: getHeaders() });
      if (res.ok) return await res.json();
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  return (
    <FarmContext.Provider value={{
      loading,
      farm,
      fields,
      healthScore,
      sustainabilityScore,
      recommendations,
      tasks,
      alerts,
      waterIntelligence,
      systemStatus,
      activeFieldId,
      setActiveFieldId,
      currentLanguage,
      setCurrentLanguage,
      fetchDashboard,
      triggerDemo,
      recordIrrigation,
      submitFeedback,
      updateTaskStatus,
      addCustomTask,
      createNewFarm,
      createNewField,
      plantNewCrop,
      sendCopilotChat,
      logout,
      isAuthenticated,
      login,
      user,
      
      // Cart & Products
      cart,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      checkoutCart,
      fetchMarketplace,
      fetchFarmerInventory,
      addMarketplaceProduct,
      updateMarketplaceProduct,
      deleteMarketplaceProduct,
      fetchCustomerOrders,
      fetchFarmerOrders,
      updateOrderStatus,
      cancelOrder,
      
      // Delivery
      fetchDeliveryPartners,
      assignDeliveryPartner,
      fetchDeliveryProfile,
      updateDeliveryAvailability,
      fetchOrderTracking,
      fetchDeliveryRoute,
      simulateDelivery,
      
      // Payment/Disputes
      payOrder,
      acceptOrder,
      dispatchOrder,
      deliverOrder,
      disputeOrder,
      fetchAdminStats,
      fetchAdminOrders,
      restrictFarmer,
      resolveDispute,
      
      // Advisor
      runSoilTest,
      fetchAdvisorHistory,
      sendAdvisorChat,
      fetchDemandInsights
    }}>
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (context === undefined) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
};
