import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Package, ShoppingBag, Plus, Trash2, Camera, Edit2, CreditCard, QrCode, Share2, Copy, CheckCircle2, Clock, MapPin, Sparkles, Palette, Eye, Building, Check, Store, Printer, RotateCw, HelpCircle, X, Bell, Trash, ShieldCheck, LogOut, Lock, MessageSquare, TrendingUp, Calendar, FileSpreadsheet, ChevronDown, AlertTriangle, RefreshCw, Banknote, Briefcase, UtensilsCrossed, Truck, AlertCircle, Hash, Moon, Sun, ExternalLink, Search, ChevronRight } from 'lucide-react';
import { Product, StoreSettings, Order, OrderStatus, DeliveryZone, DaySchedule, PaymentMethod } from '../types';
import { motion, AnimatePresence } from 'motion/react';

// Elegant Animated Toggle Component for 'Yes/No' options
const AnimatedToggle = ({ checked, onChange, label, disabled = false }: { checked: boolean, onChange: (val: boolean) => void, label?: string, disabled?: boolean }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={(e) => {
      e.stopPropagation();
      if (!disabled) onChange(!checked);
    }}
    className={`relative flex items-center p-1 w-14 h-7 sm:w-16 sm:h-8 rounded-full transition-colors duration-300 shrink-0 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${checked ? 'bg-emerald-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]' : 'bg-gray-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]'}`}
  >
    <motion.div
      initial={false}
      animate={{ x: checked ? '120%' : '0%' }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`w-6 h-6 sm:w-7 sm:h-7 bg-white rounded-full shadow-md flex items-center justify-center`}
    >
      {checked ? <Check className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" /> : <X className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />}
    </motion.div>
    {label && (
      <span className="absolute left-full ml-3 text-xs font-bold text-gray-700 whitespace-nowrap">
        {label}
      </span>
    )}
  </button>
);

const compressCover = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400; // Resizing cover to max 400px to avoid large payload sizes
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Fill background with white to support transparent PNG conversion beautifully
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          // Using JPEG format with 0.4 quality to be extremely compact (~10-15KB)
          resolve(canvas.toDataURL('image/jpeg', 0.4));
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

const compressLogo = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 160; // Resizing logo to max 160px for excellent performance and lightweight payload
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Fill background with white to support transparent PNG conversion beautifully
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.4); // Compact 40% JPEG compression (~3-5KB)
          resolve(compressedDataUrl);
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => {
        resolve(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const compressProductImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 240; // Resizing product image to max 240px for superb performance and small footprint to avoid DB limits
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Fill background with white to support transparent PNG conversion beautifully
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          // Always use image/jpeg with 0.4 quality. Older iOS Safari fallbacks webp to huge uncompressed PNGs!
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.4); // Extremely lightweight (~4-7KB)
          resolve(compressedDataUrl);
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => {
        resolve(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const slugifyText = (text: string): string => {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accent characters
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // keep only standard alphanumeric, spaces and hyphens
    .trim()
    .replace(/[\s_]+/g, '-') // convert spaces to single hyphens
    .replace(/-+/g, '-'); // collapse multiple hyphens
};

let globalAudioCtx: AudioContext | null = null;

export const initAudioContext = () => {
  try {
    if (!globalAudioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        globalAudioCtx = new AudioContextClass();
      }
    }
    if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume();
    }
  } catch (e) {
    console.warn("AudioContext init error", e);
  }
};

const playNotificationSound = () => {
  try {
    if (!globalAudioCtx) {
      initAudioContext();
    }
    const ctx = globalAudioCtx;
    if (!ctx) return;
    
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    const playBellPart = (freq: number, volume: number, decay: number, delay: number = 0) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      
      gain.gain.setValueAtTime(0, now + delay);
      // Harder attack for a struck bell
      gain.gain.linearRampToValueAtTime(volume, now + delay + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + decay);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + delay);
      osc.stop(now + delay + decay);
    };

    // Realistic desk bell simulation
    // A bell has an inharmonic spectrum. Using multiple sine waves with these ratios makes it sound like a bell:
    // Base frequency
    const f0 = 1200; 
    
    // Impact strike sound
    playBellPart(f0, 0.6, 2.5);          // Fundamental
    playBellPart(f0 * 1.6, 0.4, 1.5);    // Inharmonic partial
    playBellPart(f0 * 2.4, 0.3, 1.0);    // Inharmonic partial
    playBellPart(f0 * 3.2, 0.2, 0.7);
    playBellPart(f0 * 4.4, 0.1, 0.4); 

    // Double chime to mimic "ding-ding"
    const f1 = 1400;
    const delay = 0.15;
    playBellPart(f1, 0.5, 2.5, delay);
    playBellPart(f1 * 1.6, 0.3, 1.5, delay);
    playBellPart(f1 * 2.4, 0.2, 1.0, delay);
    playBellPart(f1 * 3.2, 0.1, 0.7, delay);
  } catch (e) {
    console.error('AudioContext sound failed to play:', e);
  }
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('admin_dark_mode') === 'true');
  
  // Super Admin Check, State, and Handlers
  const isSuperAdminUser = localStorage.getItem('is_super_admin') === 'true';
  const [superStores, setSuperStores] = useState<any[]>([]);
  const [superLoading, setSuperLoading] = useState(false);
  const [superError, setSuperError] = useState('');
  const [superSearch, setSuperSearch] = useState('');
  const [credentialsCreated, setCredentialsCreated] = useState<{
    email: string;
    password: string;
    storeName: string;
    storeLink: string;
    loginLink: string;
  } | null>(null);

  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newIdType, setNewIdType] = useState<'email' | 'username'>('email');
  const [newPassword, setNewPassword] = useState('');
  const [newStoreName, setNewStoreName] = useState('');
  const [newPlanType, setNewPlanType] = useState<'free' | 'monthly' | 'quarterly' | 'semiannual' | 'annual'>('free');

  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editStoreName, setEditStoreName] = useState('');
  const [editStorePassword, setEditStorePassword] = useState('');
  const [editStorePlanType, setEditStorePlanType] = useState<'free' | 'monthly' | 'quarterly' | 'semiannual' | 'annual'>('free');

  const [storeIdToDelete, setStoreIdToDelete] = useState<string | null>(null);

  // Super Admin - Revenue/Finance Dashboard state managers
  const [superTab, setSuperTab] = useState<'stores' | 'billing' | 'platform_settings'>('stores');
  const [superTransactions, setSuperTransactions] = useState<any[]>([]);
  const [txStoreName, setTxStoreName] = useState('');
  const [txPlanType, setTxPlanType] = useState('monthly');
  const [txAmount, setTxAmount] = useState('24.90');
  const [txDate, setTxDate] = useState(new Date().toISOString().substring(0, 10));
  const [txLoading, setTxLoading] = useState(false);

  const fetchSuperTransactions = async () => {
    try {
      const res = await fetch('/api/super/transactions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      if (res.status === 200) {
        const data = await res.json();
        setSuperTransactions(data);
      }
    } catch (e) {
      console.error('Error fetching transactions:', e);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const storeNameClean = txStoreName.trim();
    if (!storeNameClean || !txAmount) {
      showNotification('Nome da Loja e valor são obrigatórios.', 'warning');
      return;
    }
    setTxLoading(true);
    try {
      const res = await fetch('/api/super/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({
          storeName: storeNameClean,
          planType: txPlanType,
          amount: parseFloat(txAmount),
          date: new Date(txDate + 'T12:00:00').toISOString()
        })
      });
      if (res.status === 200) {
        showNotification('Faturamento registrado com sucesso!', 'success');
        setTxStoreName('');
        setTxPlanType('monthly');
        setTxAmount('24.90');
        fetchSuperTransactions();
      } else {
        const data = await res.json();
        showNotification(data.error || 'Erro ao registrar faturamento.', 'warning');
      }
    } catch (err) {
      showNotification('Erro ao conectar para registrar faturamento.', 'warning');
    } finally {
      setTxLoading(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const res = await fetch(`/api/super/transactions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      if (res.status === 200) {
        showNotification('Lançamento excluído com sucesso.', 'success');
        fetchSuperTransactions();
      } else {
        const data = await res.json();
        showNotification(data.error || 'Erro ao excluir faturamento.', 'warning');
      }
    } catch (e) {
      showNotification('Erro ao conectar para exclusão.', 'warning');
    }
  };

  const billingCalculations = useMemo(() => {
    let rawTotal = 0;
    const dailyMap: { [dateStr: string]: number } = {};
    const monthlyMap: { [monthStr: string]: number } = {};

    superTransactions.forEach(tx => {
      const amt = Number(tx.amount || 0);
      rawTotal += amt;

      const txDateObj = new Date(tx.date);
      let dayKey = 'Data Indefinida';
      let monthKey = 'Mês Indefinido';

      if (!isNaN(txDateObj.getTime())) {
        dayKey = txDateObj.toISOString().substring(0, 10);
        monthKey = txDateObj.toISOString().substring(0, 7);
      } else if (tx.date) {
        dayKey = String(tx.date).substring(0, 10);
        monthKey = String(tx.date).substring(0, 7);
      }

      dailyMap[dayKey] = (dailyMap[dayKey] || 0) + amt;
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + amt;
    });

    const sortedDays = Object.entries(dailyMap)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => b.date.localeCompare(a.date));

    const sortedMonths = Object.entries(monthlyMap)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => b.month.localeCompare(a.month));

    const maxDayAmount = sortedDays.length > 0 ? Math.max(...sortedDays.map(d => d.total)) : 1;
    const maxMonthAmount = sortedMonths.length > 0 ? Math.max(...sortedMonths.map(m => m.total)) : 1;

    return {
      rawTotal,
      sortedDays,
      sortedMonths,
      maxDayAmount,
      maxMonthAmount,
    };
  }, [superTransactions]);

  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pass = 'pass';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  const fetchSuperStores = async () => {
    setSuperLoading(true);
    setSuperError('');
    try {
      const res = await fetch('/api/super/stores', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      if (res.status === 200) {
        const data = await res.json();
        setSuperStores(data);
      } else {
        const errData = await res.json();
        setSuperError(errData.error || 'Erro ao carregar lojas.');
      }
    } catch (err) {
      setSuperError('Erro de conexão ao servidor.');
    } finally {
      setSuperLoading(false);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuperError('');
    setCredentialsCreated(null);

    const emailToSend = newIdType === 'email' ? newEmail.trim() : '';
    const usernameToSend = newIdType === 'username' ? newUsername.trim() : '';

    if (newIdType === 'email' && !emailToSend) {
      setSuperError('O e-mail de login é obrigatório.');
      return;
    }
    if (newIdType === 'username' && !usernameToSend) {
      setSuperError('O nome de usuário (username) é obrigatório.');
      return;
    }
    if (!newPassword || !newStoreName) {
      setSuperError('A senha e o nome da loja são obrigatórios.');
      return;
    }

    try {
      const res = await fetch('/api/super/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({
          email: emailToSend,
          username: usernameToSend,
          password: newPassword,
          storeName: newStoreName,
          planType: newPlanType
        })
      });
      const data = await res.json();
      if (res.status === 200) {
        const host = window.location.origin;
        const loginLink = `${host}/admin/login`;
        let publicHost = host;
        if (publicHost.includes('ais-dev-')) {
          publicHost = publicHost.replace('ais-dev-', 'ais-pre-');
        }
        const storeLink = `${publicHost}/cardapp/${data.storeSlug || data.storeId}`;
        
        setCredentialsCreated({
          email: emailToSend || usernameToSend,
          password: newPassword,
          storeName: newStoreName,
          storeLink,
          loginLink
        });
        
        setNewEmail('');
        setNewUsername('');
        generateRandomPassword();
        setNewStoreName('');
        
        showNotification('Loja registrada com sucesso!', 'success');
        fetchSuperStores();
      } else {
        setSuperError(data.error || 'Erro de criação.');
      }
    } catch (err) {
      setSuperError('Falha ao processar solicitação de criação.');
    }
  };

  const handleUpdateStore = async (id: string) => {
    try {
      const res = await fetch(`/api/super/stores/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({
          planType: editStorePlanType,
          password: editStorePassword,
          storeName: editStoreName
        })
      });
      if (res.status === 200) {
        setEditingStoreId(null);
        showNotification('Configurações atualizadas com sucesso!', 'success');
        fetchSuperStores();
      } else {
        const err = await res.json();
        showNotification(err.error || 'Erro ao salvar', 'warning');
      }
    } catch (e) {
      showNotification('Erro de rede ao salvar', 'warning');
    }
  };

  const handleDeleteStore = async (id: string) => {
    try {
      const res = await fetch(`/api/super/stores/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      if (res.status === 200) {
        setStoreIdToDelete(null);
        showNotification('Loja excluída permanentemente.', 'success');
        fetchSuperStores();
      } else {
        const err = await res.json();
        showNotification(err.error || 'Erro ao excluir', 'warning');
      }
    } catch (e) {
      showNotification('Erro ao conectar para exclusão', 'warning');
    }
  };

  useEffect(() => {
    if (isSuperAdminUser && !newPassword) {
      generateRandomPassword();
    }
  }, [isSuperAdminUser, newEmail]);

  const [storeBusinessModel, setStoreBusinessModel] = useState<'store' | 'restaurant'>('store');
  const [activeTab, setActiveTab] = useState<'settings' | 'products' | 'orders' | 'share' | 'tutorial'>('orders');
  const [settingsSubTab, setSettingsSubTab] = useState<'identity' | 'operation' | 'design' | 'logistics' | 'contact' | 'scheduling' | 'categories'>('identity');
  const [ceoName, setCeoName] = useState('');
  
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [allowScheduling, setAllowScheduling] = useState(false);
  const [schedulingDate, setSchedulingDate] = useState('');
  const [blockTakenSlots, setBlockTakenSlots] = useState(false);
  const [customTimeSlots, setCustomTimeSlots] = useState<string[]>([]);
  const [manualBlockedSlots, setManualBlockedSlots] = useState<Record<string, string[]>>({});
  const [newTimeSlot, setNewTimeSlot] = useState('');
  const [reservationDate, setReservationDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const ordersRef = useRef<Order[]>([]);
  
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);
  
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const [orderToAutoPrint, setOrderToAutoPrint] = useState<Order | null>(null);

  // Plan logic removed
  const isPlanExpired = false;
  const daysRemaining = 0;
  const [selectedOrderDay, setSelectedOrderDay] = useState<string>('all');
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>('all');

  // Order Deletion 2-Step states
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [deleteConfirmationStep, setDeleteConfirmationStep] = useState<number>(1);
  const [isDeletingOrderSpinner, setIsDeletingOrderSpinner] = useState(false);
  const [deleteSecondStepInput, setDeleteSecondStepInput] = useState('');

  const getOrderDayKey = (createdAt: Date | string) => {
    const d = new Date(createdAt);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const uniqueOrderDays = Array.from(new Set(orders.map(o => getOrderDayKey(o.createdAt)))).filter(Boolean).sort((a,b) => (b as string).localeCompare(a as string));
  
  // Forms
  const [storeName, setStoreName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#22c55e');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [description, setDescription] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [is24Hours, setIs24Hours] = useState(false);
  const [acceptedPaymentMethods, setAcceptedPaymentMethods] = useState<PaymentMethod[]>(['pix', 'card', 'cash']);
  const [createdAt, setCreatedAt] = useState('');
  const [logo, setLogo] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [storeTagline, setStoreTagline] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [printMode, setPrintMode] = useState<'manual' | 'auto'>('manual');
  const printModeRef = useRef<'manual' | 'auto'>('manual');
  
  useEffect(() => {
    printModeRef.current = printMode;
  }, [printMode]);
  const [editingDeliveryFeeId, setEditingDeliveryFeeId] = useState<string | null>(null);
  
  // Custom manual orders
  const [showManualSaleModal, setShowManualSaleModal] = useState(false);
  const [manualSaleDescription, setManualSaleDescription] = useState('');
  const [manualSalePrice, setManualSalePrice] = useState('');
  const [manualSaleProductId, setManualSaleProductId] = useState('');
  const [manualSaleQuantity, setManualSaleQuantity] = useState('1');

  // Extended Forms State
  const [storeNameFirst, setStoreNameFirst] = useState('');
  const [storeNameFirstColor, setStoreNameFirstColor] = useState('#1e293b');
  const [businessType, setBusinessType] = useState<'hortifruti' | 'livraria' | 'marmitaria' | 'lanchonete' | 'outros'>('hortifruti');
  const [categories, setCategories] = useState<string[]>([]);
  const [editingCategory, setEditingCategory] = useState<{old: string, current: string} | null>(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressNeighborhood, setAddressNeighborhood] = useState('');
  const [addressCityState, setAddressCityState] = useState('');
  const [addressComplement, setAddressComplement] = useState('');
  const [addressMapsLink, setAddressMapsLink] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [fontFamily, setFontFamily] = useState('inter');
  const [customerFontSize, setCustomerFontSize] = useState(16);
  const [headerFontSize, setHeaderFontSize] = useState(24);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const aAvail = a.isAvailable !== false;
      const bAvail = b.isAvailable !== false;
      if (aAvail && !bAvail) return -1;
      if (!aAvail && bAvail) return 1;
      return (a.name || '').localeCompare(b.name || '', 'pt-BR');
    });
  }, [products]);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Custom Dynamic City Delivery Fees States
  const [deliveryFees, setDeliveryFees] = useState<DeliveryZone[]>([]);
  const [newDeliveryCity, setNewDeliveryCity] = useState('');
  const [newDeliveryZone, setNewDeliveryZone] = useState('');
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false);
  const [newNeighborhoodName, setNewNeighborhoodName] = useState('');
  const [newCityFee, setNewCityFee] = useState('');
  const [newDeliveryTime, setNewDeliveryTime] = useState('');
  const [minimumOrderValue, setMinimumOrderValue] = useState<number>(0);
  const [productOrder, setProductOrder] = useState<'name-first' | 'price-first'>('name-first');
  const [blockOutsideDelivery, setBlockOutsideDelivery] = useState(false);
  
  // Delivery zones configuration
  const [storeType, setStoreType] = useState<'delivery_and_pickup' | 'only_delivery' | 'only_pickup'>('delivery_and_pickup');
  const [weeklySchedules, setWeeklySchedules] = useState<DaySchedule[]>([]);
  const [coverImage, setCoverImage] = useState<string>('');

  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editProduct, setEditProduct] = useState<Partial<Product>>({});
  const [highlightProductErrors, setHighlightProductErrors] = useState(false);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean, message: string, onConfirm: () => void } | null>(null);
  
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'warning' } | null>(null);
  const [isLogoZoomed, setIsLogoZoomed] = useState(false);

  const showNotification = (message: string, type: 'success' | 'warning' = 'success') => {
    setNotification({ message, type });
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const handleInteraction = () => initAudioContext();
    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('keydown', handleInteraction, { once: true });
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            localStorage.setItem('push_notifications_enabled', 'true');
            setPushEnabled(true);
            ensurePushSubscription();
          }
        }).catch(() => {});
      } else if (Notification.permission === 'granted') {
        // Automatically sync and re-subscribe on refresh or revisit to ensure active status
        localStorage.setItem('push_notifications_enabled', 'true');
        setPushEnabled(true);
        ensurePushSubscription();
      }
    } catch (e) {
      console.warn("Notification API error on mount:", e);
    }
  }, []);

  const ensurePushSubscription = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      if (Notification.permission !== 'granted') return;
      
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      
      const existingSub = await registration.pushManager.getSubscription();
      
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      const vapidRes = await fetch('/api/admin/push/vapid-key', { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      const vapidData = await vapidRes.json();
      
      if (vapidData.publicKey) {
        let subscription = existingSub;
        
        // If not subscribed, try to subscribe now
        if (!subscription) {
          const padding = '='.repeat((4 - vapidData.publicKey.length % 4) % 4);
          const base64 = (vapidData.publicKey + padding).replace(/\-/g, '+').replace(/_/g, '/');
          const rawData = window.atob(base64);
          const applicationServerKey = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) {
            applicationServerKey[i] = rawData.charCodeAt(i);
          }
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey
          });
        }
        
        await fetch('/api/admin/push/subscribe', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify(subscription.toJSON())
        });
      }
    } catch (err) {
      console.warn("Falha ao garantir inscrição de push:", err);
    }
  };
  
  const [copiedLink, setCopiedLink] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedTableNumber, setSelectedTableNumber] = useState('');

  // Real-time Order Alert States & Polling
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);
  const [pushEnabled, setPushEnabled] = useState(localStorage.getItem('push_notifications_enabled') === 'true');
  
  const showNativeNotification = async (title: string, options: NotificationOptions) => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && 'showNotification' in registration) {
          await registration.showNotification(title, options);
          return;
        }
      }
      new Notification(title, options);
    } catch (e) {
      console.warn("Error showing native notification:", e);
    }
  };

  const togglePushNotifications = async () => {
    if (!('Notification' in window)) {
      showNotification("Seu navegador não suporta notificações de Desktop.", "warning");
      return;
    }
    
    if (!pushEnabled) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem('push_notifications_enabled', 'true');
        setPushEnabled(true);
        
        // Register Push Subscription via Service Worker
        try {
          if ('serviceWorker' in navigator && 'PushManager' in window) {
            const registration = await navigator.serviceWorker.register('/sw.js');
            
            // Get Server VAPID Key
            const vapidRes = await fetch('/api/admin/push/vapid-key', { headers: getAuthHeaders() });
            const vapidData = await vapidRes.json();
            
            if (vapidData.publicKey) {
              const padding = '='.repeat((4 - vapidData.publicKey.length % 4) % 4);
              const base64 = (vapidData.publicKey + padding).replace(/\-/g, '+').replace(/_/g, '/');
              const rawData = window.atob(base64);
              const applicationServerKey = new Uint8Array(rawData.length);
              for (let i = 0; i < rawData.length; ++i) {
                applicationServerKey[i] = rawData.charCodeAt(i);
              }
              
              const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
              });
              
              await fetch('/api/admin/push/subscribe', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(subscription.toJSON())
              });
              
              showNativeNotification("✅ Notificações Ativadas!", { 
                body: "Você receberá alertas mesmo com o navegador fechado ou em outros apps.",
                icon: '/logo.png',
                tag: 'admin-notif'
              });
            }
          } else {
             // Fallback
             showNativeNotification("Notificações Ativadas (Aba Aberta)!", { 
               body: "Você será notificado. Mantenha a aba aberta.",
               icon: '/logo.png'
             });
          }
        } catch (err) {
          console.error("Erro ao registrar service worker ou push manager:", err);
          showNotification("Erro ao registrar. Verifique permissões.", "warning");
        }
      } else {
        showNotification("Notificações bloqueadas! Habilite clicando no ícone de opções do site.", "warning");
      }
    } else {
      localStorage.setItem('push_notifications_enabled', 'false');
      setPushEnabled(false);
      
      // Unsubscribe from PushManager
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
            await fetch('/api/admin/push/unsubscribe', {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify({ endpoint: subscription.endpoint })
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error("Erro ao remover inscrição:", err);
      }
      
      showNotification("Notificações desativadas.", "success");
    }
  };
  const [dashboardLoadTime] = useState(() => new Date());

  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [isEditingOrderPrice, setIsEditingOrderPrice] = useState(false);
  const [newOrderTotal, setNewOrderTotal] = useState<string>('');
  const [newOrderItems, setNewOrderItems] = useState<any[]>([]);

  const pollOrders = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;
      const opt = { 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
      
      const res = await fetch('/api/admin/orders', opt);
      if (res.status === 200) {
        const latestOrders: Order[] = await res.json();
        
        // Find new orders before updating state
        const currentOrders = ordersRef.current;
        if (currentOrders && currentOrders.length > 0) {
          const prevIds = new Set(currentOrders.map(o => o.id));
          const freshOrders = latestOrders.filter(o => !prevIds.has(o.id));
          
          if (freshOrders.length > 0) {
            const newest = freshOrders[0];
            setNewOrderAlert(newest);
            playNotificationSound();
            
            if (printModeRef.current === 'auto') {
              setOrderToAutoPrint(newest);
              setTimeout(() => {
                window.print();
                setOrderToAutoPrint(null);
              }, 800);
            }
            
            const isPushActive = localStorage.getItem('push_notifications_enabled') === 'true';
            
            if (isPushActive && 'Notification' in window && Notification.permission === 'granted') {
              // The backend pushes the web-push payload directly.
              // To avoid duplicates, we only show a local Desktop Notification if
              // this tab is effectively taking priority and there's no SW active, OR if the SW is configured to skip focused clients.
              // But actually our SW skips focused clients! So if this tab is focused, SW does NOT show it.
              // Thus we MUST show it locally here IF we want a Desktop Notification while focused.
              // If the app is NOT focused, SW WILL show it. To prevent double, we don't show it here if hidden.
              if (!document.hidden || !('serviceWorker' in navigator && navigator.serviceWorker.controller)) {
                try {
                  showNativeNotification("Novo Pedido Recebido!", {
                    body: `Um novo pedido chegou (Pedido #${newest.protocol || newest.id.substring(0, 5)}) no valor de R$ ${Number(newest.totalPrice || 0).toFixed(2)}.`,
                    icon: '/logo.png'
                  });
                } catch (err) {
                  console.error("Erro ao disparar notificação push:", err);
                }
              }
            }
          }
        }
        
        setOrders(latestOrders);
      }
    } catch (e) {
      console.warn('Error polling live orders:', e);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token || isSuperAdminUser) return;
    
    // Poll for new requests every 2 seconds
    const interval = setInterval(pollOrders, 2000);
    return () => clearInterval(interval);
  }, [dashboardLoadTime]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (isSuperAdminUser) {
        await Promise.all([fetchSuperStores(), fetchSuperTransactions()]);
      } else {
        await fetchData();
      }
    } catch (err) {
      console.error('Erro ao atualizar dados: ', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    if (isSuperAdminUser) {
      fetchSuperStores();
      fetchSuperTransactions();
    } else {
      fetchData();
    }
  }, []);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
  });

  const fetchData = async () => {
    try {
      const opt = { headers: getAuthHeaders() };
      
      const sRes = await fetch('/api/admin/settings', opt);
      if (sRes.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
        return;
      }
      if (!sRes.ok) throw new Error('Falha ao carregar configurações');
      const sData = await sRes.json();
      if (!sData) throw new Error('Configurações não retornadas');

      setSettings(sData);
      setAllowScheduling(!!sData.allowScheduling);
      setSchedulingDate(sData.schedulingDate || '');
      setBlockTakenSlots(!!sData.blockTakenSlots);
      setCustomTimeSlots(sData.customTimeSlots || []);
      setManualBlockedSlots(sData.manualBlockedSlots || {});
      setStoreName(sData.storeName || '');
      setPrimaryColor(sData.primaryColor || '#22c55e');
      setWhatsappNumber(sData.whatsappNumber || '');
      setStoreSlug(sData.storeSlug || localStorage.getItem('store_id') || '');
      setDescription(sData.description || '');
    setOpeningHours(sData.openingHours || '');
    setOpeningTime(sData.openingTime || '');
    setClosingTime(sData.closingTime || '');
    setIs24Hours(sData.is24Hours || false);
    setAcceptedPaymentMethods(sData.acceptedPaymentMethods || ['pix', 'card', 'cash']);
    setCreatedAt(sData.createdAt || '');
    setLogo(sData.logo || '');
    setInstagramUrl(sData.instagramUrl || '');
    setFacebookUrl(sData.facebookUrl || '');
    setWebsiteUrl(sData.websiteUrl || '');
    setStoreTagline(sData.storeTagline || '');
    setCeoName(sData.ceoName || '');
    setDeliveryTime(sData.deliveryTime || '');
    setPrintMode(sData.printMode || 'manual');

    // Initialize Extended settings
    const defaultFirst = sData.storeNameFirst || sData.storeName || '';
    setStoreNameFirst(defaultFirst);
    setStoreNameFirstColor(sData.storeNameFirstColor || '#1e293b');
    setBusinessType(sData.businessType || 'hortifruti');
    setCategories(sData.categories || []);
    const addr = sData.locationAddress || '';
    setLocationAddress(addr);
    try {
      if (addr.trim().startsWith('{')) {
        const parsed = JSON.parse(addr);
        setAddressStreet(parsed.street || '');
        setAddressNeighborhood(parsed.neighborhood || '');
        setAddressCityState(parsed.cityState || '');
        setAddressComplement(parsed.complement || '');
        setAddressMapsLink(parsed.mapsLink || '');
      } else {
        setAddressStreet(addr);
        setAddressNeighborhood('');
        setAddressCityState('');
        setAddressComplement('');
        setAddressMapsLink('');
      }
    } catch (e) {
      setAddressStreet(addr);
      setAddressNeighborhood('');
      setAddressCityState('');
      setAddressComplement('');
      setAddressMapsLink('');
    }
    setIsOpen(sData.isOpen !== undefined ? sData.isOpen : true);
    setFontFamily(sData.fontFamily || 'inter');
    setCustomerFontSize(sData.customerFontSize || 16);
    setHeaderFontSize(sData.headerFontSize || 24);
    setDeliveryFees(sData.deliveryFees || []);
    setMinimumOrderValue(sData.minimumOrderValue || 0);
    setProductOrder(sData.productOrder || 'name-first');
    setCoverImage(sData.coverImage || '');
    setBlockOutsideDelivery(sData.blockOutsideDelivery || false);
    setStoreType(sData.storeType || 'delivery_and_pickup');
    
    const defaultSchedules: DaySchedule[] = [
      { dayIndex: 0, isOpen: false, openingTime: '08:00', closingTime: '18:00', hasLunchBreak: false, lunchBreakStart: '12:00', lunchBreakEnd: '13:30' },
      { dayIndex: 1, isOpen: true, openingTime: '08:00', closingTime: '18:00', hasLunchBreak: false, lunchBreakStart: '12:00', lunchBreakEnd: '13:30' },
      { dayIndex: 2, isOpen: true, openingTime: '08:00', closingTime: '18:00', hasLunchBreak: false, lunchBreakStart: '12:00', lunchBreakEnd: '13:30' },
      { dayIndex: 3, isOpen: true, openingTime: '08:00', closingTime: '18:00', hasLunchBreak: false, lunchBreakStart: '12:00', lunchBreakEnd: '13:30' },
      { dayIndex: 4, isOpen: true, openingTime: '08:00', closingTime: '18:00', hasLunchBreak: false, lunchBreakStart: '12:00', lunchBreakEnd: '13:30' },
      { dayIndex: 5, isOpen: true, openingTime: '08:00', closingTime: '18:00', hasLunchBreak: false, lunchBreakStart: '12:00', lunchBreakEnd: '13:30' },
      { dayIndex: 6, isOpen: true, openingTime: '08:00', closingTime: '18:00', hasLunchBreak: false, lunchBreakStart: '12:00', lunchBreakEnd: '13:30' },
    ];
    setWeeklySchedules(sData.weeklySchedules && sData.weeklySchedules.length === 7 ? sData.weeklySchedules : defaultSchedules);
    
    // Load products and orders
    const pRes = await fetch('/api/admin/products', opt);
    if (pRes.ok) setProducts(await pRes.json());
    
    const oRes = await fetch('/api/admin/orders', opt);
    if (oRes.ok) setOrders(await oRes.json());
    } catch (err) {
      console.error('FetchData Error:', err);
      showNotification('Erro ao carregar dados. Tente atualizar a página.', 'warning');
    }
  };

  const handleAddManualSale = async () => {
    if (!manualSalePrice || isNaN(Number(manualSalePrice)) || Number(manualSalePrice) <= 0) {
      showNotification('Insira um valor válido', 'warning');
      return;
    }
    
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/orders/manual', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          description: manualSaleDescription,
          totalPrice: Number(manualSalePrice),
          productId: manualSaleProductId,
          quantity: Number(manualSaleQuantity) || 1
        })
      });
      if (res.ok) {
        const newOrder = await res.json();
        setOrders(prev => [newOrder, ...prev]);
        
        // Update local stock if product was selected
        if (manualSaleProductId && manualSaleQuantity) {
          setProducts(prev => prev.map(p => {
            if (p.id === manualSaleProductId && p.stockCount !== undefined) {
              return { ...p, stockCount: Math.max(0, p.stockCount - Number(manualSaleQuantity)) };
            }
            return p;
          }));
        }

        setShowManualSaleModal(false);
        setManualSaleDescription('');
        setManualSalePrice('');
        setManualSaleProductId('');
        setManualSaleQuantity('1');
        showNotification('Venda avulsa registrada com sucesso!', 'success');
        
        // Refresh to ensure everything is in sync
        fetchData();
      } else {
        showNotification('Erro ao registrar venda', 'warning');
      }
    } catch (e) {
      console.error(e);
      showNotification('Erro de rede', 'warning');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveSettings = async () => {
    // Basic validations
    if (!storeNameFirst.trim()) {
      showNotification('O primeiro nome da loja é obrigatório.', 'warning');
      return;
    }

    const fullStoreName = storeNameFirst.trim();

    let compiledAddress = '';
    if (addressStreet.trim() || addressNeighborhood.trim() || addressCityState.trim() || addressComplement.trim() || addressMapsLink.trim()) {
      compiledAddress = JSON.stringify({
        street: addressStreet.trim(),
        neighborhood: addressNeighborhood.trim(),
        cityState: addressCityState.trim(),
        complement: addressComplement.trim(),
        mapsLink: addressMapsLink.trim()
      });
    }

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          storeName: fullStoreName, 
          primaryColor, 
          whatsappNumber, 
          storeSlug, 
          description,
          ceoName,
          deliveryTime,
          printMode,
          openingHours,
          openingTime,
          closingTime,
          is24Hours,
          acceptedPaymentMethods,
          logo,
          storeNameFirst: storeNameFirst.trim(),
          storeNameFirstColor,
          businessType,
          categories,
          locationAddress: compiledAddress,
          isOpen,
          instagramUrl,
          facebookUrl,
          websiteUrl,
          storeTagline,
          fontFamily,
          customerFontSize,
          headerFontSize,
          deliveryFees,
          blockOutsideDelivery,
          storeType,
          weeklySchedules,
          coverImage,
          minimumOrderValue,
          productOrder,
          allowScheduling,
          schedulingDate,
          blockTakenSlots,
          customTimeSlots,
          manualBlockedSlots
        })
      });

      if (!res.ok) {
        let errMsg = 'Ocorreu um erro ao salvar as configurações.';
        try {
          const errData = await res.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch (_) {}
        showNotification(errMsg, 'warning');
        return;
      }

      const newSettings = await res.json();
      setSettings(newSettings);
      setLocationAddress(newSettings.locationAddress || '');
      setOpeningHours(newSettings.openingHours || '');
      if (newSettings.weeklySchedules) {
        setWeeklySchedules(newSettings.weeklySchedules);
      }
      // Synchronize global storeName
      setStoreName(newSettings.storeName);
      showNotification('Configurações salvas com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      showNotification('Não foi possível se conectar ao servidor para salvar as configurações.', 'warning');
    }
  };

  const handleAddCategory = () => {
    const cleanCat = newCategoryName.trim();
    if (!cleanCat) return;
    if (categories.some(c => c.toLowerCase() === cleanCat.toLowerCase())) {
      showNotification('Esta categoria já existe!', 'warning');
      return;
    }
    setCategories([...categories, cleanCat]);
    setNewCategoryName('');
  };

  const handleRemoveCategory = (catToRemove: string) => {
    setConfirmState({
      isOpen: true,
      message: `Tem certeza de que deseja excluir a categoria "${catToRemove}"?`,
      onConfirm: () => {
        setCategories(categories.filter(c => c !== catToRemove));
      }
    });
  };

  const saveEditCategory = async () => {
    if (!editingCategory) return;
    const oldCat = editingCategory.old;
    const newCat = editingCategory.current;
    
    if (!newCat || newCat.trim() === '' || newCat === oldCat) {
      setEditingCategory(null);
      return;
    }
    
    const cleanNewCat = newCat.trim();
    if (categories.some(c => c.toLowerCase() === cleanNewCat.toLowerCase() && c !== oldCat)) {
      showNotification('Esta categoria já existe!', 'warning');
      return;
    }

    const updatedCategories = categories.map(c => c === oldCat ? cleanNewCat : c);
    setCategories(updatedCategories);

    // Immediate settings save
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ categories: updatedCategories })
      });
    } catch (e) {
      console.error('Failed to save settings categories:', e);
    }

    // Update products that reference this category
    const updatedProducts = products.map(p => {
      if (p.category === oldCat) {
        return { ...p, category: cleanNewCat };
      }
      return p;
    });
    
    const productsChanged = updatedProducts.some((p, i) => p.category !== products[i].category);
    
    if (productsChanged) {
      setProducts(updatedProducts);
      try {
        await Promise.all(
          updatedProducts.filter((p, i) => p.category !== products[i].category).map(p => 
            fetch(`/api/admin/products/${p.id}`, {
              method: 'PUT',
              headers: getAuthHeaders(),
              body: JSON.stringify({ category: cleanNewCat })
            })
          )
        );
      } catch (err) {
        console.error(err);
      }
    }
    setEditingCategory(null);
    showNotification('Categoria editada com sucesso!', 'success');
  };

  const handleAddDeliveryZone = () => {
    const cleanCityName = newDeliveryCity.trim();
    const cleanZoneName = newDeliveryZone.trim();
    const cleanNeighborhoodName = newNeighborhoodName.trim();
    
    if (!cleanCityName) {
      showNotification('Preencha a Cidade.', 'warning');
      return;
    }
    if (!cleanZoneName) {
      showNotification('Preencha a Zona (Ex: Zona Sul).', 'warning');
      return;
    }
    if (!cleanNeighborhoodName) {
      showNotification('Preencha o Bairro.', 'warning');
      return;
    }
    const parsedFeeStr = newCityFee.toString().replace(/\s/g, '').replace('R$', '').replace(',', '.');
    const cleanPrice = parseFloat(parsedFeeStr);
    if (isNaN(cleanPrice) || cleanPrice < 0) {
      showNotification('Digite um valor de taxa de entrega válido.', 'warning');
      return;
    }

    if (editingDeliveryFeeId) {
      setDeliveryFees(deliveryFees.map(fee => 
        fee.id === editingDeliveryFeeId 
          ? { ...fee, city: cleanCityName, zone: cleanZoneName, neighborhood: cleanNeighborhoodName, fee: cleanPrice, deliveryTime: newDeliveryTime }
          : fee
      ));
      setEditingDeliveryFeeId(null);
      showNotification('Taxa de entrega atualizada com sucesso!', 'success');
    } else {
      if (deliveryFees.some(item => 
        (item.city || '').toLowerCase() === cleanCityName.toLowerCase() &&
        (item.zone || '').toLowerCase() === cleanZoneName.toLowerCase() &&
        item.neighborhood.toLowerCase() === cleanNeighborhoodName.toLowerCase()
      )) {
        showNotification('Esta zona de entrega já foi adicionada!.', 'warning');
        return;
      }

      const newItem: DeliveryZone = {
        id: Math.random().toString(36).substring(2, 9),
        state: '',
        city: cleanCityName,
        zone: cleanZoneName,
        neighborhood: cleanNeighborhoodName,
        fee: cleanPrice,
        deliveryTime: newDeliveryTime
      };

      setDeliveryFees([...deliveryFees, newItem]);
      showNotification(`Taxa para ${cleanCityName} - ${cleanZoneName} - ${cleanNeighborhoodName} adicionada com sucesso!`, 'success');
    }

    setNewNeighborhoodName('');
    setNewCityFee('');
    setNewDeliveryTime('');
  };

  const handleEditCityFee = (fee: DeliveryZone) => {
    setNewDeliveryCity(fee.city || '');
    setNewDeliveryZone(fee.zone || '');
    setNewNeighborhoodName(fee.neighborhood);
    setNewCityFee(fee.fee.toString());
    setNewDeliveryTime(fee.deliveryTime || '');
    setEditingDeliveryFeeId(fee.id);
    
    // Scroll to form
    const element = document.getElementById('delivery-zone-form');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const syncSchedules = () => {
    const reference = weeklySchedules.find(s => s.isOpen) || weeklySchedules[0];
    if (!reference) {
      showNotification('Configure pelo menos um horário antes de sincronizar.', 'warning');
      return;
    }
    
    setConfirmState({
      isOpen: true,
      message: 'Deseja copiar o horário atual para todos os outros dias da semana?',
      onConfirm: () => {
        const newSchedules = Array.from({ length: 7 }, (_, i) => ({
          ...reference,
          dayIndex: i,
        }));
        setWeeklySchedules(newSchedules);
        showNotification('Horários sincronizados para toda a semana!', 'success');
      }
    });
  };

  const handleRemoveCityFee = (id: string, name: string) => {
    setConfirmState({
      isOpen: true,
      message: `Deseja remover permanentemente a taxa da região: ${name}?`,
      onConfirm: () => {
        setDeliveryFees(deliveryFees.filter(fee => fee.id !== id));
        showNotification(`Taxa de ${name} removida com sucesso.`, 'success');
      }
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressLogo(file);
        setLogo(compressed);
      } catch (err) {
        console.error("Erro ao fazer upload da logo:", err);
        // Fallback to normal upload
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogo(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressCover(file);
        setCoverImage(compressed);
      } catch (err) {
        console.error("Erro ao fazer upload da capa:", err);
        const reader = new FileReader();
        reader.onloadend = () => {
          setCoverImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressProductImage(file);
        setEditProduct(prev => ({ ...prev, image: compressed }));
      } catch (err) {
        console.error("Erro ao fazer upload da imagem do produto:", err);
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditProduct(prev => ({ ...prev, image: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editProduct.name?.trim() || !editProduct.price || editProduct.price <= 0) {
      setHighlightProductErrors(true);
      document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const isNew = !editProduct.id;
    const url = isNew ? '/api/admin/products' : `/api/admin/products/${editProduct.id}`;
    const method = isNew ? 'POST' : 'PUT';
    
    // Sanitize flavors and addons
    const sanitizedProduct = {
      ...editProduct,
      flavors: editProduct.flavors?.filter(f => f.trim() !== '') || [],
      unavailableFlavors: editProduct.unavailableFlavors?.filter(f => f.trim() !== '') || [],
      addons: editProduct.addons?.filter(a => a.name.trim() !== '') || [],
      stockCount: editProduct.stockCount !== undefined ? editProduct.stockCount : null
    };
    
    await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(sanitizedProduct)
    });
    
    setIsEditingProduct(false);
    fetchData();
  };

  const handleDeleteProduct = async (id: string) => {
    setConfirmState({
      isOpen: true,
      message: 'Tem certeza que deseja excluir este produto?',
      onConfirm: async () => {
        await fetch(`/api/admin/products/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
        fetchData();
      }
    });
  };

  const handleUpdateOrderStatus = async (id: string, status: OrderStatus) => {
    await fetch(`/api/admin/orders/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    fetchData();
  };

  const handleDeleteOrder = async (orderId: string) => {
    setIsDeletingOrderSpinner(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        setOrderToDelete(null);
        setDeleteConfirmationStep(1);
        setDeleteSecondStepInput('');
        showNotification('Pedido excluído com sucesso!', 'success');
      } else {
        const errObj = await res.json();
        showNotification(errObj?.error || 'Erro ao excluir o pedido.', 'warning');
      }
    } catch (e) {
      console.error(e);
      showNotification('Conexão instável. Tente novamente!', 'warning');
    } finally {
      setIsDeletingOrderSpinner(false);
    }
  };

  const handleSaveEditedOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToEdit) return;

    try {
      const totalVal = parseFloat(newOrderTotal.replace(',', '.'));
      if (isNaN(totalVal)) {
        showNotification('Formato de preço inválido.', 'warning');
        return;
      }

      const updatedOrder = {
        ...orderToEdit,
        totalPrice: totalVal,
        items: newOrderItems
      };

      const res = await fetch(`/api/admin/orders/${orderToEdit.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedOrder)
      });

      if (res.ok) {
        showNotification('Pedido atualizado com sucesso!', 'success');
        setOrderToEdit(null);
        fetchData();
      } else {
        showNotification('Erro ao atualizar pedido.', 'warning');
      }
    } catch (e) {
      showNotification('Erro de processamento.', 'warning');
    }
  };

  const statusMap: Record<OrderStatus, string> = {
    pending: 'Recebido',
    preparing: 'Preparando',
    delivery: 'Saindo para Entrega',
    pickup: 'Pronto para Retirada',
    completed: 'Finalizado',
    canceled: 'Cancelado'
  };

  const statusColors: Record<OrderStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    preparing: 'bg-orange-100 text-orange-800',
    delivery: 'bg-blue-100 text-blue-800',
    pickup: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    canceled: 'bg-rose-100 text-rose-800'
  };

  if (isSuperAdminUser) {
    const filteredStores = superStores.filter(store => {
      const query = superSearch.toLowerCase().trim();
      return (
        store.settings?.storeName?.toLowerCase().includes(query) ||
        (store.email || '').toLowerCase().includes(query) ||
        (store.id || '').toLowerCase().includes(query)
      );
    });

    const totalStores = superStores.length;
    const testStores = superStores.filter(s => s.settings?.planType === 'free').length;
    const paidStores = superStores.filter(s => s.settings?.planType === 'monthly').length;

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 lg:p-8 selection:bg-emerald-500 selection:text-slate-950">
        {/* Notifications */}
        {notification && (
          <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl border text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300 ${
            notification.type === 'success' 
              ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
              : 'bg-amber-950 text-amber-300 border-amber-800'
          }`}>
            <span className="w-2 h-2 rounded-full bg-current animate-ping" />
            {notification.message}
          </div>
        )}

        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/20 mb-3">
                <ShieldCheck className="w-4 h-4" />
                Acesso Sênior • Supervisor Geral
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Cardapp<span className="text-emerald-500">.</span> Admin
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Controle e gerenciamento manual de lojas, acessos e faturamento de clientes.
              </p>
            </div>
            
            <button
              onClick={() => {
                localStorage.clear();
                navigate('/admin/login');
              }}
              className="px-5 py-2.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-200 text-slate-300 border border-slate-750 hover:border-rose-900 rounded-xl text-sm font-bold tracking-wide transition-all"
            >
              Log Out do Sistema
            </button>
          </header>

          {/* Quick Stats Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 relative overflow-hidden">
              <div className="absolute right-4 top-4 bg-slate-800 p-2.5 rounded-xl text-slate-400">
                <Store className="w-5 h-5" />
              </div>
              <p className="text-xs font-extrabold text-slate-450 tracking-wider uppercase">Lojas Vinculadas</p>
              <h3 className="text-3xl font-black text-white mt-1">{totalStores}</h3>
              <p className="text-xs text-slate-400 mt-2">Registros totais no Firestore / Local</p>
            </div>
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 relative overflow-hidden">
              <div className="absolute right-4 top-4 bg-amber-500/10 p-2.5 rounded-xl text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-xs font-extrabold text-slate-450 tracking-wider uppercase">Contas em Período de Teste</p>
              <h3 className="text-3xl font-black text-amber-400 mt-1">{testStores}</h3>
              <p className="text-xs text-slate-400 mt-2">7 dias gratuitos de degustação ativa</p>
            </div>
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 relative overflow-hidden">
              <div className="absolute right-4 top-4 bg-emerald-500/10 p-2.5 rounded-xl text-emerald-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <p className="text-xs font-extrabold text-slate-450 tracking-wider uppercase">Assinaturas Mensais Ativas</p>
              <h3 className="text-3xl font-black text-emerald-400 mt-1">{paidStores}</h3>
              <p className="text-xs text-slate-400 mt-2">Faturamento recorrente de R$ 19,90/loja</p>
            </div>
          </section>

          {/* Error Feed */}
          {superError && (
            <div className="bg-rose-950 border border-rose-900 text-rose-300 p-4 rounded-2xl text-xs font-bold text-center">
              ⚠️ {superError}
            </div>
          )}

          {/* Main Navigation Tabs */}
          <div className="flex border-b border-slate-805 gap-6">
            <button
              onClick={() => setSuperTab('stores')}
              className={`pb-4 px-2 text-xs uppercase tracking-widest font-black transition-all border-b-2 text-center cursor-pointer select-none ${
                superTab === 'stores'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              🏢 Lojas e Clientes ({totalStores})
            </button>
            <button
              onClick={() => setSuperTab('billing')}
              className={`pb-4 px-2 text-xs uppercase tracking-widest font-black transition-all border-b-2 text-center cursor-pointer select-none ${
                superTab === 'billing'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              💰 Painel de Faturamento ({billingCalculations.rawTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
            </button>
            <button
              onClick={() => setSuperTab('platform_settings')}
              className={`pb-4 px-2 text-xs uppercase tracking-widest font-black transition-all border-b-2 text-center cursor-pointer select-none ${
                superTab === 'platform_settings'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              ⚙️ Ajustes do CEO
            </button>
          </div>

          {/* Main Workspace */}
          {superTab === 'stores' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left Column - Forms & Newly Created Panel */}
            <div className="space-y-6 lg:col-span-1">
              
              {/* Form Card */}
              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-400">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Criar Nova Conta</h2>
                    <p className="text-xs text-slate-400">Cadastre um novo lojista na hora</p>
                  </div>
                </div>

                <form onSubmit={handleCreateStore} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 tracking-wider uppercase mb-1">Nome da Loja</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Frutas do Bosque"
                      value={newStoreName}
                      onChange={e => setNewStoreName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-400 tracking-wider uppercase mb-1">Como o cliente prefere entrar?</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
                      <button
                        type="button"
                        onClick={() => {
                          setNewIdType('email');
                          setNewUsername('');
                        }}
                        className={`py-2 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
                          newIdType === 'email'
                            ? 'bg-emerald-500/10 text-emerald-400 font-extrabold border border-emerald-500/20'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Usar E-mail
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewIdType('username');
                          setNewEmail('');
                        }}
                        className={`py-2 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
                          newIdType === 'username'
                            ? 'bg-emerald-500/10 text-emerald-400 font-extrabold border border-emerald-500/20'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Usar Usuário
                      </button>
                    </div>
                  </div>

                  {newIdType === 'email' ? (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 tracking-wider uppercase mb-1">E-mail de Login do Cliente</label>
                      <input
                        type="email"
                        required
                        placeholder="email@cliente.com"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 tracking-wider uppercase mb-1">Nome de Usuário (Username)</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: samuelsilva"
                        value={newUsername}
                        onChange={e => setNewUsername(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-black text-slate-400 tracking-wider uppercase">Senha de Acesso</label>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-[10px] font-extrabold text-emerald-400 hover:underline uppercase"
                      >
                        Gerar aleatório
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Senha do cliente"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm font-mono font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 tracking-wider uppercase mb-2">Plano Inicial Autorizado</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewPlanType('free')}
                        className={`p-2.5 rounded-xl border text-[10px] font-black uppercase text-center transition-all ${
                          newPlanType === 'free'
                            ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/5'
                            : 'bg-slate-950 border-slate-855 text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        Teste 7 Dias
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPlanType('monthly')}
                        className={`p-2.5 rounded-xl border text-[10px] font-black uppercase text-center transition-all ${
                          newPlanType === 'monthly'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/5'
                            : 'bg-slate-950 border-slate-855 text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        Mensal (30d)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPlanType('quarterly')}
                        className={`p-2.5 rounded-xl border text-[10px] font-black uppercase text-center transition-all ${
                          newPlanType === 'quarterly'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/5'
                            : 'bg-slate-950 border-slate-855 text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        Trimestral (90d)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPlanType('semiannual')}
                        className={`p-2.5 rounded-xl border text-[10px] font-black uppercase text-center transition-all ${
                          newPlanType === 'semiannual'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/5'
                            : 'bg-slate-950 border-slate-855 text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        Semestral (180d)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPlanType('annual')}
                        className={`p-2.5 rounded-xl border text-[10px] font-black uppercase text-center transition-all col-span-2 ${
                          newPlanType === 'annual'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/5'
                            : 'bg-slate-950 border-slate-855 text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        Anual PRO (365 dias)
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-black py-3 rounded-xl text-sm transition-all uppercase tracking-wider cursor-pointer"
                  >
                    Criar Conta & Liberar Acesso
                  </button>
                </form>
              </div>

              {/* Newly Created Card credentials */}
              {credentialsCreated && (
                <div className="bg-emerald-950/40 rounded-3xl border border-emerald-800/40 p-6 space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <h3 className="font-black text-white text-base">Ficha de Instruções Comercial</h3>
                  </div>
                  
                  <p className="text-xs text-emerald-200 leading-relaxed font-semibold">
                    Conta criada! Copie os dados de acesso abaixo para enviar para o seu cliente pelo WhatsApp:
                  </p>

                  <div className="bg-slate-950 rounded-2xl p-4 border border-emerald-900 font-mono text-xs text-white space-y-2 select-all whitespace-pre-wrap">
                    {`🎉 *Sua loja está no ar!*\n\n` +
                     `📲 *Cardápio Digital:*\n${credentialsCreated.storeLink}\n\n` +
                     `⚙️ *Painel de Gestão:*\n${credentialsCreated.loginLink}\n\n` +
                     `🔑 *Dados de Acesso:*\n` +
                     `*Login:* ${credentialsCreated.email}\n` +
                     `*Senha:* ${credentialsCreated.password}`}
                  </div>

                  <button
                    onClick={() => {
                      const text = `🎉 *Sua loja está no ar!*\n\n` +
                                   `📲 *Cardápio Digital:*\n${credentialsCreated.storeLink}\n\n` +
                                   `⚙️ *Painel de Gestão:*\n${credentialsCreated.loginLink}\n\n` +
                                   `🔑 *Dados de Acesso:*\n` +
                                   `*Login:* ${credentialsCreated.email}\n` +
                                   `*Senha:* ${credentialsCreated.password}\n\n` +
                                   `Boas vendas! 🚀`;
                      navigator.clipboard.writeText(text);
                      showNotification('Dados de acesso copiados para a área de transferência!', 'success');
                    }}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 hover:text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                  >
                    Copiar Dados Comerciais
                  </button>
                </div>
              )}
            </div>

            {/* Right Column - Client list */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Search Bar */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Pesquisar loja por nome, e-mail ou link..."
                  value={superSearch}
                  onChange={e => setSuperSearch(e.target.value)}
                  className="flex-1 bg-transparent border-none text-sm font-semibold outline-none focus:ring-0 text-white placeholder-slate-550"
                />
                <button 
                  onClick={fetchSuperStores}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                  title="Atualizar Banco de Dados"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              {/* Stores feed */}
              <div className="space-y-3">
                {superLoading && filteredStores.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-wider text-xs">
                    🔄 Sincronizando com Firestore do Google...
                  </div>
                ) : filteredStores.length === 0 ? (
                  <div className="bg-slate-900/40 p-12 text-center rounded-3xl border border-slate-800 text-slate-500 font-semibold">
                    Nenhum cliente cadastrado correspondendo aos termos especificados.
                  </div>
                ) : (
                  <motion.div layout className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {filteredStores.map((store, sIdx) => {
                        const isEditing = editingStoreId === store.id;
                        const isDeletingConfirm = storeIdToDelete === store.id;
                        
                        // Expiration checking logic
                        const start = new Date(store.settings?.planStartDate || store.createdAt).getTime();
                        let end = start;
                        if (store.settings?.planType === 'free') {
                          end = start + 7 * 24 * 60 * 60 * 1000;
                        } else if (store.settings?.planType === 'quarterly') {
                          end = start + 90 * 24 * 60 * 60 * 1000;
                        } else if (store.settings?.planType === 'semiannual') {
                          end = start + 180 * 24 * 60 * 60 * 1000;
                        } else if (store.settings?.planType === 'annual') {
                          end = start + 365 * 24 * 60 * 60 * 1000;
                        } else {
                          end = start + 30 * 24 * 60 * 60 * 1000; // monthly or others
                        }
                        const now = new Date().getTime();
                        const diff = end - now;
                        const isExpired = diff <= 0;
                        const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

                        return (
                          <motion.div 
                            layout
                            key={store.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3, delay: sIdx * 0.03 }}
                            className={`bg-slate-900 p-5 rounded-3xl border transition-all ${
                              isExpired 
                                ? 'border-rose-950/60 bg-gradient-to-br from-slate-900 to-rose-950/10' 
                                : 'border-slate-800'
                            }`}
                          >
                        {isEditing ? (
                          // Edit Interface
                          <div className="space-y-4">
                            <h4 className="text-xs font-black text-emerald-450 uppercase tracking-widest border-b border-slate-800 pb-2">
                              Editando Cadastro: <span className="text-white font-mono">{store.id}</span>
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-bold text-slate-400 tracking-wider uppercase mb-1">Nome Fantasia da Loja</label>
                                <input
                                  type="text"
                                  value={editStoreName}
                                  onChange={e => setEditStoreName(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-slate-400 tracking-wider uppercase mb-1">Senha Secreta</label>
                                <input
                                  type="text"
                                  value={editStorePassword}
                                  onChange={e => setEditStorePassword(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none"
                                />
                              </div>
                            </div>

                             <div>
                              <label className="block text-[9px] font-bold text-slate-400 tracking-wider uppercase mb-1.5">Renovar Acesso / Ajustar Plano</label>
                              <div className="grid grid-cols-2 gap-2 max-w-xs">
                                <button
                                  type="button"
                                  onClick={() => setEditStorePlanType('free')}
                                  className={`py-1.5 rounded-lg border text-[9px] font-black uppercase text-center transition-all ${
                                    editStorePlanType === 'free'
                                      ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                                      : 'bg-slate-950 border-slate-855 text-slate-400 hover:bg-slate-900'
                                  }`}
                                >
                                  Teste 7d
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditStorePlanType('monthly')}
                                  className={`py-1.5 rounded-lg border text-[9px] font-black uppercase text-center transition-all ${
                                    editStorePlanType === 'monthly'
                                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                      : 'bg-slate-950 border-slate-855 text-slate-400 hover:bg-slate-900'
                                  }`}
                                >
                                  Mensal (30d)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditStorePlanType('quarterly')}
                                  className={`py-1.5 rounded-lg border text-[9px] font-black uppercase text-center transition-all ${
                                    editStorePlanType === 'quarterly'
                                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                      : 'bg-slate-950 border-slate-855 text-slate-400 hover:bg-slate-900'
                                  }`}
                                >
                                  Trimestral (90d)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditStorePlanType('semiannual')}
                                  className={`py-1.5 rounded-lg border text-[9px] font-black uppercase text-center transition-all ${
                                    editStorePlanType === 'semiannual'
                                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                      : 'bg-slate-950 border-slate-855 text-slate-400 hover:bg-slate-900'
                                  }`}
                                >
                                  Semestral (180d)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditStorePlanType('annual')}
                                  className={`py-1.5 rounded-lg border text-[9px] font-black uppercase text-center transition-all col-span-2 ${
                                    editStorePlanType === 'annual'
                                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                      : 'bg-slate-950 border-slate-855 text-slate-400 hover:bg-slate-900'
                                  }`}
                                >
                                  Anual PRO (365d)
                                </button>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-slate-800">
                              <button
                                onClick={() => handleUpdateStore(store.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-slate-950 rounded-lg text-xs font-extrabold uppercase transition"
                              >
                                Salvar Alterações
                              </button>
                              <button
                                onClick={() => setEditingStoreId(null)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-extrabold uppercase transition"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : isDeletingConfirm ? (
                          // Deletion Confirm Interface
                          <div className="bg-rose-955/30 border border-rose-900 rounded-2xl p-4 text-center space-y-3">
                            <p className="text-xs text-rose-300 font-extrabold">
                              Excluir permanentemente a loja <span className="font-mono text-white">"{store.settings?.storeName}"</span>?<br />
                              Todos os produtos e pedidos desta loja serão apagados. Esta operação é irreversível!
                            </p>
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleDeleteStore(store.id)}
                                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black uppercase transition-all"
                              >
                                Sim, Excluir Totalmente
                              </button>
                              <button
                                onClick={() => setStoreIdToDelete(null)}
                                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-black uppercase transition-all"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Standard Card Interface
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-black text-white text-base">
                                  {store.settings?.storeName}
                                </h3>
                                
                                {isExpired ? (
                                  <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full animate-pulse">
                                    Acesso Expirado ⚠️
                                  </span>
                                ) : store.settings?.planType === 'free' ? (
                                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                                    Teste Grátis ({daysLeft}d restantes)
                                  </span>
                                ) : (
                                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                                    {store.settings?.planType === 'monthly' ? 'Plano Mensal' :
                                     store.settings?.planType === 'quarterly' ? 'Plano Trimestral' :
                                     store.settings?.planType === 'semiannual' ? 'Plano Semestral' :
                                     store.settings?.planType === 'annual' ? 'Plano Anual' : 'Acesso PRO'} ({daysLeft}d restantes)
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-col gap-1 text-slate-400 text-xs mt-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-500">Slug:</span>
                                  <a 
                                    href={`/${store.settings?.storeSlug || store.id}`} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="font-mono text-emerald-400 hover:underline hover:text-emerald-300 flex items-center gap-1"
                                  >
                                    /{store.settings?.storeSlug || store.id}
                                    <Eye className="w-3 h-3" />
                                  </a>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-500">Credenciais:</span>
                                  <span className="bg-slate-950 px-2 py-0.5 rounded text-[11px] font-mono font-semibold text-slate-300">
                                    {store.email} / <span className="text-emerald-500 font-bold">{store.password}</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <button
                                onClick={() => {
                                  localStorage.setItem('admin_token', store.id);
                                  localStorage.setItem('store_id', store.id);
                                  localStorage.setItem('is_super_admin', 'false');
                                  localStorage.setItem('super_impersonating', 'true');
                                  window.location.reload();
                                }}
                                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 rounded-xl transition flex items-center gap-1.5 border border-slate-800 shadow-sm"
                                title="Acessar Painel do Lojista"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Acessar</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingStoreId(store.id);
                                  setEditStoreName(store.settings?.storeName || '');
                                  setEditStorePassword(store.password || '');
                                  setEditStorePlanType(store.settings?.planType || 'free');
                                }}
                                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded-xl transition"
                                title="Editar configurações"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  let publicHost = window.location.origin;
                                  if (publicHost.includes('ais-dev-')) {
                                    publicHost = publicHost.replace('ais-dev-', 'ais-pre-');
                                  }
                                  const text = `🎉 *Sua loja está no ar!*\n\n` +
                                               `📲 *Cardápio Digital:*\n${publicHost}/cardapp/${store.settings?.storeSlug || store.id}\n\n` +
                                               `⚙️ *Painel de Gestão:*\n${publicHost}/admin/login\n\n` +
                                               `🔑 *Dados de Acesso:*\n` +
                                               `*Login:* ${store.email}\n` +
                                               `*Senha:* ${store.password}\n\n` +
                                               `Boas vendas! 🚀`;
                                  navigator.clipboard.writeText(text);
                                  showNotification('Copiado para WhatsApp!', 'success');
                                }}
                                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded-xl transition"
                                title="Copiar credenciais"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setStoreIdToDelete(store.id)}
                                className="p-2 hover:bg-slate-850 text-slate-400 hover:text-rose-500 rounded-xl transition"
                                title="Excluir Lojista"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                    })}
                    </AnimatePresence>
                  </motion.div>
                )}
                </div>

              </div>
            </div>
          ) : superTab === 'billing' ? (
            
            /* Gorgeous Financial / Billing Tab Content Pane */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-in fade-in duration-250 text-left">
              
              {/* Left Column - Manual Receipt Logger */}
              <div className="space-y-6 lg:col-span-1 border-none pb-8 text-left">
                <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-400">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-lg font-black text-white leading-tight">Registrar Lançamento</h2>
                      <p className="text-xs text-slate-400">Lance recebimentos manuais ou adicionais</p>
                    </div>
                  </div>

                  <form onSubmit={handleAddTransaction} className="space-y-4 pt-2 text-left">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 tracking-wider uppercase mb-1">Nome da Loja do Cliente</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Lanchonete El Shadday"
                        value={txStoreName}
                        onChange={e => setTxStoreName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-855 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 tracking-wider uppercase mb-1">Valor (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={txAmount}
                          onChange={e => setTxAmount(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-855 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 tracking-wider uppercase mb-1">Data da Transação</label>
                        <input
                          type="date"
                          required
                          value={txDate}
                          onChange={e => setTxDate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-855 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 tracking-wider uppercase mb-1.5">Plano / Periodicidade</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { val: 'monthly', lbl: 'Mensal', price: '24.90' },
                          { val: 'quarterly', lbl: 'Trimestral', price: '59.90' },
                          { val: 'semiannual', lbl: 'Semestral', price: '109.90' },
                          { val: 'annual', lbl: 'Anual PRO', price: '199.90' },
                        ].map((p) => (
                          <button
                            key={p.val}
                            type="button"
                            onClick={() => {
                              setTxPlanType(p.val);
                              setTxAmount(p.price);
                            }}
                            className={`py-2 rounded-xl border text-[10px] font-black uppercase text-center transition-all cursor-pointer ${
                              txPlanType === p.val
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-extrabold'
                                : 'bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-900'
                            }`}
                          >
                            {p.lbl}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={txLoading}
                      className="w-full py-3 bg-emerald-500 disabled:opacity-50 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border-none"
                    >
                      {txLoading ? 'Registrando...' : 'Confirmar Recebimento 💰'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column - Finance Dashboard (Days, Months and lists) */}
              <div className="lg:col-span-2 space-y-6 text-left">
                
                {/* Visual Analytics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Faturamento por Dia */}
                  <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col gap-4 text-left">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-200">Faturamento por Dia</h3>
                      </div>
                      <span className="text-[10px] bg-slate-950 border border-slate-855 px-2.5 py-0.5 rounded-full font-mono text-slate-400">
                        {billingCalculations.sortedDays.length} Dias
                      </span>
                    </div>

                    <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
                      {billingCalculations.sortedDays.length === 0 ? (
                        <p className="text-xs text-slate-500 font-semibold text-center py-8">Nenhum faturamento diário registrado.</p>
                      ) : (
                        billingCalculations.sortedDays.map((d) => {
                          const percentage = Math.max(8, Math.round((d.total / billingCalculations.maxDayAmount) * 100));
                          let ptDate = d.date;
                          try {
                            const parsed = new Date(d.date + 'T12:00:00');
                            if (!isNaN(parsed.getTime())) {
                              ptDate = parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                            }
                          } catch (e) {}

                          return (
                            <div key={d.date} className="space-y-1">
                              <div className="flex justify-between text-xs font-bold text-slate-300">
                                <span>📅 {ptDate}</span>
                                <span className="text-emerald-400 font-black">{d.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                              </div>
                              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-855">
                                <div 
                                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Faturamento por Mês */}
                  <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col gap-4 text-left">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-200">Faturamento por Mês</h3>
                      </div>
                      <span className="text-[10px] bg-slate-950 border border-slate-855 px-2.5 py-0.5 rounded-full font-mono text-slate-400">
                        {billingCalculations.sortedMonths.length} Meses
                      </span>
                    </div>

                    <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
                      {billingCalculations.sortedMonths.length === 0 ? (
                        <p className="text-xs text-slate-500 font-semibold text-center py-8">Nenhum faturamento mensal acumulado.</p>
                      ) : (
                        billingCalculations.sortedMonths.map((m) => {
                          const percentage = Math.max(8, Math.round((m.total / billingCalculations.maxMonthAmount) * 100));
                          let ptMonth = m.month;
                          try {
                            const parsed = new Date(m.month + '-02T12:00:00');
                            if (!isNaN(parsed.getTime())) {
                              const formatted = parsed.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                              ptMonth = formatted.charAt(0).toUpperCase() + formatted.slice(1);
                            }
                          } catch (e) {}

                          return (
                            <div key={m.month} className="space-y-1">
                              <div className="flex justify-between text-xs font-bold text-slate-350">
                                <span>🗓️ {ptMonth}</span>
                                <span className="text-emerald-400 font-black">{m.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                              </div>
                              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-855">
                                <div 
                                  className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>

                {/* Histórico Geral das Transações com Lixeira */}
                <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                      <h3 className="font-extrabold text-sm text-white">Fluxo de Entradas Recentes</h3>
                    </div>
                    <span className="text-xs text-slate-450 font-bold font-mono bg-slate-950 border border-slate-850 px-2.5 py-0.5 rounded-full">
                      {superTransactions.length} Lançamentos
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[360px] overflow-y-auto scrollbar-thin pr-1">
                    {superTransactions.length === 0 ? (
                      <p className="text-xs text-slate-500 font-semibold text-center py-12">Não há registros de transações neste período.</p>
                    ) : (
                      superTransactions.map((tx) => {
                        let txPtDate = tx.date;
                        try {
                          const d = new Date(tx.date);
                          if (!isNaN(d.getTime())) {
                            txPtDate = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
                          }
                        } catch (e){}

                        return (
                          <div 
                            key={tx.id} 
                            className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-slate-800 transition"
                          >
                            <div className="text-left space-y-0.5">
                              <h4 className="font-black text-xs text-white leading-tight">{tx.storeName}</h4>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <span className={`px-1.5 py-0.2 rounded ${
                                  tx.planType === 'free' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                                }`}>
                                  Plano: {
                                    tx.planType === 'free' ? 'Teste' :
                                    tx.planType === 'monthly' ? 'Mensal' :
                                    tx.planType === 'quarterly' ? 'Trimestral' :
                                    tx.planType === 'semiannual' ? 'Semestral' :
                                    tx.planType === 'annual' ? 'Anual' : String(tx.planType).toUpperCase()
                                  }
                                </span>
                                <span>• {txPtDate}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <span className="text-sm font-black font-mono text-emerald-400">
                                {Number(tx.amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </span>
                              <button
                                onClick={() => handleDeleteTransaction(tx.id)}
                                className="p-2 hover:bg-slate-900 hover:text-rose-400 text-slate-500 rounded-xl transition cursor-pointer border-none bg-transparent"
                                title="Excluir Lançamento"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            /* Platform / CEO Settings Tab Content */
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-amber-500/10 p-3 rounded-2xl text-amber-400">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">Configurações Críticas do CEO</h2>
                    <p className="text-slate-400 font-medium">Ajustes globais da plataforma Cardapp</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest border-b border-slate-800 pb-2">Parâmetros de Venda</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 tracking-wider uppercase mb-1.5">Taxa de Adesão Sugerida (R$)</label>
                        <input type="text" defaultValue="99,00" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none border-dashed opacity-75 cursor-not-allowed" disabled />
                        <p className="text-[10px] text-slate-500 mt-1">Valor base para novos contratos físicos.</p>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 tracking-wider uppercase mb-1.5">Mensalidade Padrão (R$)</label>
                        <input type="text" defaultValue="24,90" className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none border-dashed opacity-75 cursor-not-allowed" disabled />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest border-b border-slate-800 pb-2">Suporte & Backup</h3>
                    
                    <div className="space-y-4">
                      <button className="w-full flex items-center justify-between p-4 bg-slate-950 border border-slate-850 rounded-2xl hover:border-emerald-500/50 transition-all group">
                        <div className="flex items-center gap-3">
                          <RotateCw className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                          <div className="text-left">
                            <p className="text-xs font-bold text-white">Sincronizar Firestore</p>
                            <p className="text-[10px] text-slate-500">Forçar atualização de cache local</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-700" />
                      </button>

                      <button className="w-full flex items-center justify-between p-4 bg-slate-950 border border-slate-850 rounded-2xl hover:border-rose-500/50 transition-all group">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 text-slate-500 group-hover:text-rose-400 transition-colors" />
                          <div className="text-left">
                            <p className="text-xs font-bold text-white">Log de Erros Globais</p>
                            <p className="text-[10px] text-slate-500">Visualizar instabilidades do sistema</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-700" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-12 p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h4 className="font-black text-white text-lg">Proteção do Ecossistema Cardapp</h4>
                    <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
                      As alterações nesta página afetam diretamente o funcionamento comercial da plataforma. Use com cautela e sempre realize backups antes de modificações estruturais.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!settings) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">Carregando painel...</div>;
  }

  const getPrintAnalysis = (printOrder: Order) => {
    const groupsInfo = new Map<string, { totalQty: number, promoQuantity?: number, promoPrice?: number, unitPrice?: number, isPromo: boolean }>();
    printOrder.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return;
      const key = product.promoGroup || product.id;
      if (!groupsInfo.has(key)) {
        groupsInfo.set(key, { 
          totalQty: 0, 
          promoQuantity: product.promoQuantity, 
          promoPrice: product.promoPrice,
          unitPrice: Number(product.price || 0),
          isPromo: !!product.promotion || (!!product.promoQuantity && product.promoQuantity > 0 && !!product.promoPrice)
        });
      }
      groupsInfo.get(key)!.totalQty += (Number(item.quantity) || 0);
    });

    let calculatedSubtotal = 0;
    groupsInfo.forEach(g => {
      const effectivePromoQty = g.promoQuantity || 1;
      if (g.isPromo && g.promoPrice && g.totalQty >= effectivePromoQty) {
        const bundles = Math.floor(g.totalQty / effectivePromoQty);
        const remainder = g.totalQty % effectivePromoQty;
        calculatedSubtotal += (bundles * Number(g.promoPrice)) + (remainder * (g.unitPrice || 0));
      } else {
        calculatedSubtotal += (g.unitPrice || 0) * g.totalQty;
      }
    });

    printOrder.items.forEach(item => {
      const addonsPrice = (item.addons || []).reduce((acc, a) => acc + Number(a.price || 0), 0);
      calculatedSubtotal += addonsPrice * item.quantity;
    });

    const calculatedFee = printOrder.deliveryFee !== undefined 
      ? printOrder.deliveryFee 
      : Math.max(0, Number(printOrder.totalPrice) - calculatedSubtotal);

    return { groupsInfo, calculatedSubtotal, calculatedFee };
  };

  return (
    <>
      <AnimatePresence>
        {confirmState && confirmState.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmState(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 text-center"
            >
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2 uppercase tracking-tight">Confirmar Ação?</h3>
              <p className="text-sm text-gray-500 font-medium mb-6 leading-relaxed">
                {confirmState?.message}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setConfirmState(null)}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    if (confirmState?.onConfirm) confirmState.onConfirm();
                    setConfirmState(null);
                  }}
                  className="px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-rose-200 transition-all active:scale-95"
                >
                  Sim, Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ALERTA DE NOVO PEDIDO (NOTIFICAÇÃO ATIVA LIVES) */}
      {newOrderAlert && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in fade-in slide-in-from-top-4 duration-350 print:hidden">
          <div className="bg-orange-600 text-white rounded-2xl shadow-2xl p-5 border border-orange-550/40 flex flex-col gap-3.5 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-orange-500 rounded-full opacity-25 animate-pulse pointer-events-none" />
            
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 animate-bounce">
                <Bell className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div className="flex-grow min-w-0 text-left">
                <span className="inline-block text-[10px] font-black tracking-widest bg-orange-800 px-2 py-0.5 rounded-full mb-1 uppercase">
                  🔔 NOVO PEDIDO RECEBIDO!
                </span>
                <h4 className="font-extrabold text-base leading-tight truncate">
                  {newOrderAlert.customerName}
                </h4>
                <p className="text-xs text-orange-100 font-medium">
                  Protocolo: <span className="font-mono font-bold text-white">{newOrderAlert.protocol}</span> • Total: R$ {Number(newOrderAlert.totalPrice || 0).toFixed(2)}
                </p>
              </div>
              <button 
                onClick={() => setNewOrderAlert(null)}
                className="w-7 h-7 rounded-lg bg-orange-700 hover:bg-orange-800 transition-colors flex items-center justify-center cursor-pointer text-orange-100 hover:text-white shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setActiveTab('orders');
                  setNewOrderAlert(null);
                }}
                className="flex-grow py-2 px-3 bg-white text-orange-700 font-bold text-xs rounded-xl shadow-md hover:bg-orange-50 active:scale-95 transition-all cursor-pointer text-center"
              >
                Ver Pedidos Agora
              </button>
              <button
                onClick={() => setNewOrderAlert(null)}
                className="py-2 px-4 bg-orange-700 border border-orange-500/20 text-white font-bold text-xs rounded-xl hover:bg-orange-800 active:scale-95 transition-all cursor-pointer"
              >
                Dispensar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`h-[100dvh] bg-gray-50 flex flex-col print:hidden relative overflow-hidden ${isDarkMode ? 'dark-mode-override' : ''}`}>
        {localStorage.getItem('super_impersonating') === 'true' && (
          <div className="bg-emerald-950 text-emerald-100 px-4 py-3.5 text-center text-xs font-black uppercase tracking-wider flex flex-col sm:flex-row items-center justify-center gap-3 border-b border-emerald-800 shrink-0 z-50 shadow-md">
            <span className="flex items-center gap-2">🛡️ Modo CEO / Gestor: Você está visualizando o painel de <strong className="text-white">{settings?.storeName}</strong></span>
            <button
              onClick={() => {
                localStorage.setItem('admin_token', 'super-admin-token');
                localStorage.setItem('is_super_admin', 'true');
                localStorage.removeItem('super_impersonating');
                window.location.reload();
              }}
              className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-950 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm hover:shadow active:scale-95 shrink-0"
            >
              Voltar ao Painel Geral
            </button>
          </div>
        )}
        <main className="flex-grow p-4 md:p-8 py-8 overflow-y-auto pb-32 scroll-smooth">
          {/* ORDERS TAB */}
            {activeTab === 'orders' && (() => {
          let ordersForCalculations = selectedOrderDay === 'all' 
            ? orders 
            : orders.filter(o => getOrderDayKey(o.createdAt) === selectedOrderDay);

          let filteredOrdersByDay = [...ordersForCalculations];

          if (selectedOrderStatus !== 'all') {
            if (selectedOrderStatus === 'pending') {
              filteredOrdersByDay = filteredOrdersByDay.filter(o => o.status === 'pending' && !o.scheduledDate);
            } else if (selectedOrderStatus === 'preparing') {
              filteredOrdersByDay = filteredOrdersByDay.filter(o => o.status === 'preparing');
            } else if (selectedOrderStatus === 'shipped') {
              filteredOrdersByDay = filteredOrdersByDay.filter(o => o.status === 'delivery' || o.status === 'pickup');
            } else if (selectedOrderStatus === 'completed') {
              filteredOrdersByDay = filteredOrdersByDay.filter(o => o.status === 'completed');
            } else if (selectedOrderStatus === 'scheduled') {
              filteredOrdersByDay = filteredOrdersByDay.filter(o => !!o.scheduledDate && o.status !== 'completed');
            }
          }

          if (orderSearchQuery.trim()) {
            const query = orderSearchQuery.toLowerCase();
            filteredOrdersByDay = filteredOrdersByDay.filter(o => 
              o.protocol.toLowerCase().includes(query) || 
              o.customerName.toLowerCase().includes(query) || 
              (o.customerPhone && o.customerPhone.toLowerCase().includes(query)) ||
              (o.address && o.address.toLowerCase().includes(query))
            );
          }

          return (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Controle de Pedidos e Balanço Financeiro</h1>
                <div className="flex flex-col items-end gap-1 px-1">
                  <div 
                    onClick={togglePushNotifications}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${pushEnabled ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.3)]' : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 shadow-sm'}`}
                    title={pushEnabled ? "Notificações ativas" : "Clique para ativar notificações de novos pedidos"}
                  >
                    <AnimatedToggle 
                      checked={pushEnabled}
                      onChange={togglePushNotifications}
                      disabled={false}
                    />
                    <span className="flex items-center gap-1.5 select-none uppercase tracking-tighter">
                      <Bell className={`w-3.5 h-3.5 ${pushEnabled ? 'fill-emerald-500 text-emerald-500 animate-bounce' : 'text-rose-500'}`} />
                      {pushEnabled ? 'Alertas em 2º Plano Ativos' : 'Ativar Alertas de Pedidos'}
                    </span>
                  </div>
                  {pushEnabled ? (
                    <span className="text-[9px] font-medium text-emerald-600 uppercase tracking-tighter text-right">
                      ✓ Notificando mesmo fora do app
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-rose-600 animate-pulse uppercase tracking-widest leading-none mt-1">
                      ⚠️ ATIVE PARA ALERTAS NO WHATSAPP
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Pesquisar por código, cliente, endereço..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm shadow-sm transition-all"
                  />
                </div>
                
                <button
                    disabled={isRefreshing}
                    onClick={handleRefresh}
                    className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl shadow-sm transition-all focus:outline-none cursor-pointer duration-200 justify-center"
                  >
                    <RotateCw className={`w-3.5 h-3.5 text-gray-500 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
                    {isRefreshing ? 'Atualizando...' : 'Atualizar Pedidos'}
                </button>
              </div>
              
              {/* Resumo/Balanço */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                  <span className="text-gray-500 text-sm font-medium">Pedidos {selectedOrderDay !== 'all' ? `(${selectedOrderDay})` : 'Total'}</span>
                  <span className="text-2xl font-bold text-gray-800">{filteredOrdersByDay.length}</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                  <span className="text-gray-500 text-sm font-medium">Faturamento</span>
                  <span className="text-2xl font-bold text-green-600">
                    R$ {filteredOrdersByDay.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalPrice, 0).toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-400 mt-1">Apenas finalizados</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                  <span className="text-gray-500 text-sm font-medium">Novos Pedidos</span>
                  <span className="text-2xl font-bold text-amber-600">
                    {filteredOrdersByDay.filter(o => o.status === 'pending' && !o.scheduledDate).length}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                  <span className="text-gray-500 text-sm font-medium">Para Entrega</span>
                  <span className="text-2xl font-bold text-rose-500">
                    {filteredOrdersByDay.filter(o => o.status === 'delivery').length}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                  <span className="text-gray-500 text-sm font-medium">Em Entrega</span>
                  <span className="text-2xl font-bold text-blue-500">
                    {filteredOrdersByDay.filter(o => o.status === 'delivery').length}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                  <span className="text-gray-500 text-sm font-medium">Finalizados</span>
                  <span className="text-2xl font-bold text-emerald-500">
                    {filteredOrdersByDay.filter(o => o.status === 'completed').length}
                  </span>
                </div>
              </div>

              {/* Filtro por Status e Dias */}
              {orders.length > 0 && (
                <div className="mb-8 flex flex-col gap-4 bg-white p-4.5 rounded-xl border border-gray-200 shadow-sm">
                  <div>
                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2.5">
                      Filtrar por Status:
                    </span>
                    <div className="flex flex-wrap bg-gray-100 p-1.5 rounded-xl gap-1 relative w-full sm:w-auto self-start">
                      {[
                        { id: 'all', label: 'Todos', count: ordersForCalculations.length },
                        { id: 'pending', label: 'Novos', count: ordersForCalculations.filter(o => o.status === 'pending' && !o.scheduledDate).length },
                        { id: 'preparing', label: 'Cozinha', count: ordersForCalculations.filter(o => o.status === 'preparing').length },
                        { id: 'scheduled', label: 'Reservados', count: ordersForCalculations.filter(o => !!o.scheduledDate && o.status !== 'completed').length },
                        { id: 'shipped', label: 'Prontos / Despachados', count: ordersForCalculations.filter(o => o.status === 'delivery' || o.status === 'pickup').length },
                        { id: 'completed', label: 'Concluídos', count: ordersForCalculations.filter(o => o.status === 'completed').length }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setSelectedOrderStatus(tab.id)}
                          className={`relative px-4 py-2 text-xs font-bold rounded-lg transition-colors flex-1 sm:flex-none text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                            selectedOrderStatus === tab.id
                              ? 'text-gray-900'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {selectedOrderStatus === tab.id && (
                            <motion.div
                              layoutId="status-indicator"
                              className="absolute inset-0 bg-white shadow-sm rounded-lg border border-gray-200/60"
                              initial={false}
                              transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                            />
                          )}
                          <span className="relative z-10">{tab.label}</span>
                          <span className={`relative z-10 text-[9px] px-1.5 py-0.5 rounded-full ${selectedOrderStatus === tab.id ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'}`}>
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-gray-100 w-full my-2"></div>

                  <div>
                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2.5">
                      Filtrar e balancear por ano, mês e dia:
                    </span>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <button
                        onClick={() => setSelectedOrderDay('all')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer border ${
                          selectedOrderDay === 'all'
                            ? 'bg-white text-gray-900 border-gray-300 shadow-sm'
                            : 'bg-gray-50 text-gray-500 hover:text-gray-700 border-gray-200'
                        }`}
                      >
                        Todos os Dias ({orders.length})
                      </button>
                      <input 
                        type="date"
                        value={selectedOrderDay !== 'all' ? selectedOrderDay : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            setSelectedOrderDay(e.target.value);
                          } else {
                            setSelectedOrderDay('all');
                          }
                        }}
                        className={`px-4 py-1.5 text-xs font-bold tracking-wider rounded-lg outline-none cursor-pointer transition-colors border shadow-sm ${selectedOrderDay !== 'all' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-gray-200 text-gray-600 focus:border-gray-300 hover:border-gray-300'}`}
                      />
                    </div>
                  </div>
              </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredOrdersByDay.length === 0 ? (
                  <div className="col-span-full bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
                    {selectedOrderDay === 'all' ? 'Nenhum pedido recebido ainda.' : `Nenhum pedido recebido no dia ${selectedOrderDay}.`}
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {[...filteredOrdersByDay].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => {
                      // Calculate delay
                      let delayStatus = null;
                      if (order.status === 'pending' || order.status === 'preparing' || order.status === 'out_for_delivery') {
                        let delayMinutes = 40; // Default
                        if (settings?.deliveryTime) {
                          const match = settings.deliveryTime.match(/\d+/);
                          if (match) delayMinutes = parseInt(match[0], 10);
                        }
                        
                        let baselineTime = new Date(order.createdAt).getTime();
                        if (order.scheduledDate && order.scheduledTime) {
                          const [hh, mm] = order.scheduledTime.split(':').map(Number);
                          const schedD = new Date(order.scheduledDate + 'T00:00:00');
                          schedD.setHours(hh, mm, 0, 0);
                          baselineTime = schedD.getTime();
                        }
                        
                        const expectedDeliveryTime = baselineTime + delayMinutes * 60000;
                        const now = new Date().getTime();
                        const diffMs = expectedDeliveryTime - now;
                        const diffMinutes = Math.floor(diffMs / 60000);
                        
                        if (diffMinutes < 0) {
                          delayStatus = { isDelayed: true, text: `ATRASADO: ${Math.abs(diffMinutes)} MIN`, color: 'bg-red-50 text-red-700 border-red-200 ring-2 ring-red-500' };
                        } else {
                          delayStatus = { isDelayed: false, text: `NO HORÁRIO: ${diffMinutes} MIN`, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
                        }
                      }

                      return (
                      <motion.div 
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        layout
                        className={`bg-white p-5 rounded-xl border shadow-sm flex flex-col relative ${delayStatus?.isDelayed ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200'}`}
                      >
                    <div className="flex-grow">
                      <div className="flex flex-col mb-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-black text-lg text-gray-900 uppercase tracking-tight">{order.customerName}</h3>
                          <span className={`text-[10px] font-black px-2 py-1 rounded-full border ${statusColors[order.status]}`}>
                            {statusMap[order.status].toUpperCase()}
                          </span>
                          {order.status === 'pending' && (
                            <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-1 rounded border border-rose-700 animate-pulse shadow-sm flex items-center gap-1 uppercase tracking-widest shrink-0">
                               NOVO PEDIDO
                            </span>
                          )}
                        </div>
                        {delayStatus && (
                          <div className="mt-2 text-[10px] font-black">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-sm ${delayStatus.color}`}>
                              <Clock className="w-3.5 h-3.5" />
                              {delayStatus.text}
                            </span>
                          </div>
                        )}
                        {order.scheduledDate && (
                          <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-black uppercase tracking-wider shadow-md animate-pulse ring-4 ring-amber-100/50 self-start">
                            <Calendar className="w-4 h-4" />
                            AGENDADO: {new Date(order.scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR')} às {order.scheduledTime}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                           <a 
                             href={`https://wa.me/${order.customerPhone?.replace(/\D/g, '')}`} 
                             target="_blank" 
                             className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black border border-emerald-100 hover:bg-emerald-100 transition-colors shadow-xs"
                           >
                              <MessageSquare className="w-3.5 h-3.5" /> {order.customerPhone}
                           </a>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 mb-3 mt-3 px-3 border-l-2 border-gray-200">
                         <div className="text-xs text-gray-600 flex justify-between">
                            <span><strong>{order.deliveryMethod === 'delivery' ? 'Entrega' : 'Retirada'}</strong> • {new Date(order.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                            <span className="font-mono text-gray-500">#{order.protocol}</span>
                          </div>
                          
                          {order.deliveryMethod === 'delivery' && (
                            <div className="text-xs text-gray-800 leading-tight">
                              <strong>Endereço:</strong> {order.address}
                              <a 
                                 href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address || '')}`}
                                 target="_blank"
                                 className="ml-2 text-blue-500 hover:underline"
                               >
                                (Ver Rota)
                               </a>
                               {(order.deliveryFee !== undefined || order.deliveryZone !== undefined) && (
                                 <p className="mt-1 text-[10px] text-gray-500 font-bold uppercase tracking-tight">
                                   Região: {order.deliveryZone || 'Desconhecida'} | Taxa: R$ {(order.deliveryFee || 0).toFixed(2)}
                                 </p>
                               )}
                            </div>
                          )}
                          
                          <p className="text-xs text-gray-800">
                            <strong>Pgto:</strong> {order.paymentMethod === 'card' ? 'Cartão' : order.paymentMethod === 'cash' ? `Dinheiro ${order.changeFor ? `(Troco p/ R$${order.changeFor.toFixed(2)})` : ''}` : 'Pix'}
                          </p>

                          {order.observation && (
                            <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 p-1.5 rounded uppercase font-bold tracking-tight">
                              Obs: {order.observation}
                            </p>
                          )}
                        </div>
                        
                        <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-100 flex-grow">
                          <ul className="text-sm space-y-1 text-gray-800 font-medium">
                            {order.items.map((item, idx) => {
                              const p = products.find(prod => prod.id === item.productId);
                              let productName = p ? p.name : 'Produto Indisponível';
                              if (Array.isArray(item.flavors) && item.flavors.length > 0) {
                                productName += ` de ${item.flavors.join(', ')}`;
                              }
                              return (
                                <li key={idx} className="flex flex-col leading-tight border-b border-gray-100/50 pb-1.5 last:border-0 last:pb-0">
                                  <span><span className="font-black text-gray-900">{item.quantity}x</span> {productName}</span>
                                  {Array.isArray(item.addons) && item.addons.length > 0 && (
                                    <span className="text-[10px] text-gray-500 ml-5 block uppercase tracking-tight font-bold">
                                      + {item.addons.map(a => a.name).join(', ')}
                                    </span>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                        <div className="mt-3 mb-4 flex justify-between items-center bg-gray-900 text-white px-3 py-2 rounded-lg">
                           <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Total Pago</span>
                           <span className="font-black text-base">R$ {order.totalPrice.toFixed(2)}</span>
                        </div>
                      </div>

                    <div className="w-full md:w-48 flex flex-col gap-2">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Ações do Pedido</p>
                      
                      {/* 1. SE STATUS FOR PENDENTE (NÃO PREPARADO AINDA) */}
                      {order.status === 'pending' && (
                        <button 
                          onClick={() => handleUpdateOrderStatus(order.id, 'preparing')} 
                          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          🍳 Preparar Pedido
                        </button>
                      )}

                      {/* 2. SE STATUS FOR PREPARANDO */}
                      {order.status === 'preparing' && (
                        order.deliveryMethod === 'delivery' ? (
                          <button 
                            onClick={() => handleUpdateOrderStatus(order.id, 'delivery')} 
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            🛵 Despachar Delivery
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleUpdateOrderStatus(order.id, 'pickup')} 
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            🏪 Pronto para Retirada
                          </button>
                        )
                      )}

                      {/* 3. ATALHOS SECUNDÁRIOS CASO O CEO DESEJE SALTAR PASSOS */}
                      {order.status === 'pending' && (
                        <div className="grid grid-cols-2 gap-1.5 mt-1">
                          {order.deliveryMethod === 'delivery' ? (
                            <button 
                              onClick={() => handleUpdateOrderStatus(order.id, 'delivery')} 
                              className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100/60 rounded-lg text-[9px] font-black uppercase tracking-wider text-center transition-colors cursor-pointer"
                            >
                              Enviar Direto
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleUpdateOrderStatus(order.id, 'pickup')} 
                              className="py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100/60 rounded-lg text-[9px] font-black uppercase tracking-wider text-center transition-colors cursor-pointer"
                            >
                              Pronto Direto
                            </button>
                          )}
                          <button 
                            onClick={() => handleUpdateOrderStatus(order.id, 'completed')} 
                            className="py-1.5 px-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-100/60 rounded-lg text-[9px] font-black uppercase tracking-wider text-center transition-colors cursor-pointer"
                          >
                            Finalizar Já
                          </button>
                        </div>
                      )}

                      {/* 4. MARCAR COMO FINALIZADO SE ESTIVER EM TRÂNSITO OU EM RETIRADA */}
                      {(order.status === 'delivery' || order.status === 'pickup' || order.status === 'preparing') && (
                        <button 
                          onClick={() => handleUpdateOrderStatus(order.id, 'completed')} 
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-750 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 mt-1"
                        >
                          ✅ Concluir Pedido
                        </button>
                      )}

                      <button 
                        onClick={() => setOrderToPrint(order)}
                        className="w-full py-2 bg-gray-100 text-gray-750 hover:bg-gray-200 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-1 font-medium"
                      >
                        <Printer className="w-4 h-4 text-gray-600" />
                        Imprimir Pedido
                      </button>

                      <button 
                        onClick={() => {
                          setOrderToEdit(order);
                          setNewOrderTotal(order.totalPrice.toString());
                          setNewOrderItems([...order.items]);
                        }}
                        className="w-full py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1 border border-emerald-100 shadow-sm"
                      >
                         ⚙️ Alterar Valores / Qtd
                      </button>

                      {order.status !== 'completed' && order.status !== 'canceled' && (
                        <button 
                          onClick={() => {
                            setConfirmState({
                              isOpen: true,
                              message: 'Tem certeza que deseja cancelar este pedido? A reserva de horário (se houver) será liberada.',
                              onConfirm: () => {
                                handleUpdateOrderStatus(order.id, 'canceled');
                              }
                            });
                          }}
                          className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100/60 rounded-lg text-[9px] font-black uppercase tracking-wider text-center transition-colors cursor-pointer mt-1"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" /> Cancelar Pedido
                        </button>
                      )}

                      <button 
                        onClick={() => {
                          setOrderToDelete(order);
                          setDeleteConfirmationStep(1);
                          setDeleteSecondStepInput('');
                        }}
                        className="w-full py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2 border border-rose-200/40 group overflow-hidden"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500 group-hover:rotate-12 group-hover:scale-115 transition-transform duration-200" />
                        Apagar Pedido
                      </button>
                    </div>
                  </motion.div>
                  );
                  })}
                  </AnimatePresence>
                )}
              </div>
            </div>
          );
        })()}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && !isEditingProduct && (
          <div className="max-w-4xl max-auto animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Catálogo de Produtos</h1>
              <div className="flex items-center gap-2">
                <button
                  disabled={isRefreshing}
                  onClick={handleRefresh}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg shadow-sm transition-all focus:outline-none cursor-pointer duration-200"
                >
                  <RotateCw className={`w-3.5 h-3.5 text-gray-500 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
                  {isRefreshing ? 'Atualizando...' : 'Atualizar'}
                </button>
                <button 
                  onClick={() => { 
                    setEditProduct({ promotion: false, category: categories[0] || 'Geral' }); 
                    setIsEditingProduct(true); 
                  }} 
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  <Plus className="w-5 h-5" /> Novo Produto
                </button>
              </div>
            </div>

            <div className="space-y-8">
              {Array.from(new Set(sortedProducts.map(p => p.category || 'Geral'))).map(category => {
                const categoryProducts = sortedProducts.filter(p => (p.category || 'Geral') === category);
                if (categoryProducts.length === 0) return null;
                return (
                  <div key={category} className="space-y-4">
                    <h2 className="text-xl font-black text-gray-800 border-b border-gray-200 pb-2 flex items-center gap-2">
                      <Hash className="w-5 h-5 text-emerald-600" />
                      {category}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <AnimatePresence mode="popLayout">
                        {categoryProducts.map(product => (
                          <motion.div 
                            key={product.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            layout
                            className="bg-white p-4 rounded-xl border border-gray-200 flex gap-4 items-center shadow-sm relative overflow-hidden"
                          >
                            <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                            {product.image ? (
                              <img src={product.image} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300"><Camera className="w-6 h-6" /></div>
                            )}
                          </div>
                          <div className="flex-grow">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                              {product.name}
                              {product.promotion && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">PROMO</span>}
                              {product.isAvailable === false && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold border border-gray-200">Indisponível</span>}
                              {(product.isAvailable !== false && product.stockCount === 0) && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold border border-amber-200">Esgotado</span>}
                            </h3>
                            <p className="text-sm text-gray-500">{product.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="font-bold text-gray-800">
                                {product.promotion && product.promoPrice ? (
                                  <span className="flex items-center gap-1">
                                    <span className="text-xs text-gray-400 line-through">R$ {product.price.toFixed(2)}</span>
                                    <span className="text-emerald-600">R$ {product.promoPrice.toFixed(2)}</span>
                                  </span>
                                ) : (
                                  `R$ ${product.price.toFixed(2)}`
                                )}
                                <span className="text-xs font-normal text-gray-500"> / {product.unit || 'UN'}</span>
                              </p>
                              {product.stockCount !== undefined && (
                                <motion.span 
                                  key={product.stockCount}
                                  initial={{ scale: 1.2, color: '#059669' }}
                                  animate={{ scale: 1, color: '#374151' }}
                                  className="text-[10px] bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded font-black tracking-tighter"
                                >
                                  📦 ESTOQUE: {product.stockCount}
                                </motion.span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button onClick={() => { setEditProduct(product); setIsEditingProduct(true); }} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PRODUCT FORM */}
        {activeTab === 'products' && isEditingProduct && (
          <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-800">{editProduct.id ? 'Editar' : 'Novo'} Produto</h1>
              <button onClick={() => setIsEditingProduct(false)} className="text-gray-500 hover:text-gray-800 font-medium cursor-pointer">Cancelar</button>
            </div>

            <form onSubmit={handleSaveProduct} className="bg-white p-6 rounded-xl border border-gray-200 space-y-5 shadow-sm">
              <div className="flex items-start gap-6">
                <div className="w-32 h-32 rounded-xl relative border-2 border-dashed overflow-hidden group transition-all duration-300 bg-gray-100 border-gray-300 hover:border-emerald-500">
                  {editProduct.image && <img src={editProduct.image} className="absolute inset-0 w-full h-full object-cover" />}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5 hover:bg-black/10 p-2 text-center transition-colors cursor-pointer">
                    <Camera className="w-7 h-7 mb-1 text-gray-450" />
                    <span className="text-[9px] text-gray-500 uppercase font-bold tracking-tight select-none">Enviar Foto</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                  </div>
                </div>
                <div className="flex-grow space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-750 mb-1 flex items-center justify-between transition-all">
                      <span>Nome do Produto</span>
                      {highlightProductErrors && !editProduct.name?.trim() && (
                        <span className="text-red-500 text-[10px] uppercase font-black tracking-widest animate-bounce">⚠️ Digite o Nome da mercadoria</span>
                      )}
                    </label>
                    <input 
                      type="text" 
                      value={editProduct.name || ''} 
                      onChange={e => setEditProduct({...editProduct, name: e.target.value})} 
                      placeholder="Ex: Açaí 500ml"
                      className={`w-full px-3 py-2.5 border rounded-lg transition-all duration-300 ${highlightProductErrors && !editProduct.name?.trim() ? 'border-red-500 ring-4 ring-red-500/15 bg-red-50/25 scale-[1.015] shadow-xs' : 'border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'}`} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-750 mb-1 flex items-center justify-between transition-all">
                      <span>Preço (R$)</span>
                      {highlightProductErrors && !editProduct.price && (
                        <span className="text-red-500 text-[10px] uppercase font-black tracking-widest animate-bounce">⚠️ Digite o Preço de venda</span>
                      )}
                    </label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={editProduct.price || ''} 
                      onChange={e => setEditProduct({...editProduct, price: Number(e.target.value)})} 
                      placeholder="0.00"
                      className={`w-full px-3 py-2.5 border rounded-lg transition-all duration-300 ${highlightProductErrors && !editProduct.price ? 'border-red-500 ring-4 ring-red-500/15 bg-red-50/25 scale-[1.015] shadow-xs' : 'border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'}`} 
                    />
                  </div>

                  {/* PROMOÇÃO DE VOLUME */}
                  <div className="bg-emerald-50/50 p-4 border border-emerald-100 rounded-xl space-y-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                      <TrendingUp className="w-12 h-12 text-emerald-600" />
                    </div>
                    <div className="flex items-center gap-2 text-emerald-800 font-bold mb-1">
                      <TrendingUp className="w-5 h-5 text-emerald-600" /> Promoção de Volume (Ex: 2 por R$ 8.00)
                    </div>
                    <div className="grid grid-cols-2 gap-3 relative z-10">
                      <div>
                        <label className="block text-[10px] uppercase font-black text-emerald-700/70 tracking-widest mb-1.5">Qtd para Combo</label>
                        <input 
                          type="number" 
                          placeholder="Ex: 3"
                          value={editProduct.promoQuantity || ''} 
                          onChange={e => setEditProduct({...editProduct, promoQuantity: e.target.value ? Number(e.target.value) : undefined})}
                          className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:border-emerald-500 outline-none transition-all shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black text-emerald-700/70 tracking-widest mb-1.5">Preço do Combo (R$)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          placeholder="Ex: 10.00"
                          value={editProduct.promoPrice || ''} 
                          onChange={e => setEditProduct({...editProduct, promoPrice: e.target.value ? Number(e.target.value) : undefined})}
                          className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:border-emerald-500 outline-none transition-all shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-[10px] uppercase font-black text-emerald-700/70 tracking-widest mb-1.5 flex items-center gap-1">
                        Grupo da Promoção (opcional) 
                        <HelpCircle className="w-3 h-3 cursor-help text-emerald-400" title="Use o mesmo nome de grupo em diferentes produtos para que eles contem juntos para a promoção de volume (ex: Trufas)." />
                      </label>
                      <input 
                        type="text" 
                        placeholder="Ex: trufas"
                        value={editProduct.promoGroup || ''} 
                        onChange={e => setEditProduct({...editProduct, promoGroup: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:border-emerald-500 outline-none transition-all shadow-sm"
                      />
                    </div>
                    <p className="text-[10px] text-emerald-600/80 font-bold leading-tight">
                      Exemplo: Se 3 itens saem por R$ 10,00, preencha 3 e 10.00 acima. O sistema aplicará o desconto automaticamente.
                    </p>
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-750 mb-1">Unidade / Medida</label>
                    <div 
                      onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
                      className={`w-full px-3 py-2.5 bg-white border ${isUnitDropdownOpen ? 'border-gray-950 ring-1 ring-gray-950' : 'border-gray-300'} rounded-lg cursor-pointer flex items-center justify-between transition-all duration-200 text-sm`}
                    >
                      <span className="text-gray-800 font-medium">
                        {(() => {
                          const unit = editProduct.unit || 'UN';
                          const unitLabels: Record<string, string> = {
                            UN: "Unidade (UN)",
                            KG: "Quilograma (KG)",
                            PCT: "Pacote (PCT)",
                            L: "Litro (L)",
                            BDJ: "Bandeja (BDJ)",
                            MÇ: "Maço (MÇ)",
                            DZ: "Dúzia (DZ)",
                            CX: "Caixa (CX)"
                          };
                          return unitLabels[unit] || unitLabels['UN'];
                        })()}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isUnitDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    <AnimatePresence>
                      {isUnitDropdownOpen && (
                        <>
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/5" 
                            onClick={() => setIsUnitDropdownOpen(false)}
                          ></motion.div>
                          <motion.div 
                            initial={{ opacity: 0, y: -10, scale: 0.9, rotateX: -15 }}
                            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95, rotateX: -10 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            style={{ perspective: '1000px', transformOrigin: 'top' }}
                            className="absolute top-[100%] left-0 mt-2 w-full bg-white border border-gray-250 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto text-left py-1"
                          >
                            {Object.entries({
                              UN: "Unidade (UN)",
                              KG: "Quilograma (KG)",
                              PCT: "Pacote (PCT)",
                              L: "Litro (L)",
                              BDJ: "Bandeja (BDJ)",
                              MÇ: "Maço (MÇ)",
                              DZ: "Dúzia (DZ)",
                              CX: "Caixa (CX)"
                            }).map(([code, label], idx) => {
                              const isSelected = (editProduct.unit || 'UN') === code;
                              return (
                                <motion.div
                                  key={code}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.03 }}
                                  onClick={() => {
                                    setEditProduct({...editProduct, unit: code});
                                    setIsUnitDropdownOpen(false);
                                  }}
                                  className={`px-4 py-2.5 text-sm cursor-pointer transition-all flex items-center justify-between group ${
                                    isSelected 
                                      ? 'bg-slate-900 text-white font-black' 
                                      : 'text-gray-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className={isSelected ? '' : 'group-hover:translate-x-1 transition-transform'}>{label}</span>
                                  {isSelected && <motion.div layoutId="unit-check"><Check className="w-4 h-4 text-emerald-400" /></motion.div>}
                                </motion.div>
                              );
                            })}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-750 mb-1">Categoria de Atribuição</label>
                    <div 
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className={`w-full px-3 py-2.5 bg-white border ${isCategoryDropdownOpen ? 'border-gray-950 ring-1 ring-gray-950' : 'border-gray-300'} rounded-lg cursor-pointer flex items-center justify-between transition-all duration-200 text-sm`}
                    >
                      <span className="text-gray-800 font-medium">
                        {editProduct.category || (categories[0] || 'Geral')}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    <AnimatePresence>
                      {isCategoryDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsCategoryDropdownOpen(false)}></div>
                          <motion.div 
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="absolute top-[100%] left-0 mt-1 w-full bg-white border border-gray-250 rounded-xl shadow-xl z-50 overflow-hidden max-h-56 overflow-y-auto text-left"
                          >
                            {(categories.length > 0 ? categories : ['Geral']).map((cat) => {
                              const isSelected = (editProduct.category || (categories[0] || 'Geral')) === cat;
                              return (
                                <div
                                  key={cat}
                                  onClick={() => {
                                    setEditProduct({...editProduct, category: cat});
                                    setIsCategoryDropdownOpen(false);
                                  }}
                                  className={`px-3 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between ${
                                    isSelected 
                                      ? 'bg-slate-100 text-slate-900 font-bold' 
                                      : 'text-gray-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span>{cat}</span>
                                  {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                                </div>
                              );
                            })}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea rows={3} value={editProduct.description || ''} onChange={e => setEditProduct({...editProduct, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 outline-none" placeholder="Conte mais sobre este item..." />
              </div>

              {/* Complementos (Addons) */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex flex-col items-center gap-3 mb-5 text-center">
                  <h3 className="font-black text-sm text-gray-800 uppercase tracking-wider">Complementos</h3>
                  <button 
                    type="button" 
                    onClick={() => {
                      const currentAddons = editProduct.addons || [];
                      setEditProduct({ ...editProduct, addons: [...currentAddons, { name: '', price: 0, isAvailable: true }] });
                    }} 
                    className="text-xs font-bold text-gray-950 bg-gray-200 hover:bg-gray-300 px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 w-full max-w-[280px] mx-auto active:scale-95 shadow-xs"
                  >
                    <Plus className="w-4 h-4 shrink-0" /> Adicionar Acompanhamento
                  </button>
                </div>
                {editProduct.addons && editProduct.addons.length > 0 ? (
                  <div className="space-y-3">
                    {Array.isArray(editProduct.addons) && editProduct.addons.map((addon, index) => {
                      const isUnavailable = addon.isAvailable === false;
                      const isCurrentlyAvailable = addon.isAvailable !== false;
                      return (
                      <div key={index} className={`flex flex-col sm:flex-row gap-2 sm:items-center p-3 border rounded-xl shadow-sm transition-all duration-200 ${isUnavailable ? 'bg-gray-100 border-gray-200 opacity-75' : 'bg-white border-emerald-100'}`}>
                        <div className="flex gap-2 w-full sm:w-auto flex-[2]">
                          <input type="text" placeholder="Categoria (Ex: Adicionais)" value={addon.category || ''} onChange={(e) => {
                            const newAddons = [...editProduct.addons!];
                            newAddons[index].category = e.target.value;
                            setEditProduct({ ...editProduct, addons: newAddons });
                          }} className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors outline-none"/>
                          <input type="text" placeholder="Nome (Ex: Bacon)" value={addon.name} onChange={(e) => {
                            const newAddons = [...editProduct.addons!];
                            newAddons[index].name = e.target.value;
                            setEditProduct({ ...editProduct, addons: newAddons });
                          }} className="w-2/3 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors outline-none"/>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto items-center">
                          <div className="relative flex-1 min-w-0">
                            <span className="absolute left-2 top-2.5 text-xs text-gray-500 font-medium font-mono">R$</span>
                            <input type="number" step="0.01" min="0" placeholder="0,00" value={addon.price || ''} onChange={(e) => {
                              const newAddons = [...editProduct.addons!];
                              newAddons[index].price = Number(e.target.value);
                              setEditProduct({ ...editProduct, addons: newAddons });
                            }} className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-lg text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors outline-none"/>
                          </div>
                          
                          <button 
                            type="button" 
                            onClick={() => {
                              const newAddons = [...editProduct.addons!];
                              newAddons[index].isAvailable = !isCurrentlyAvailable;
                              setEditProduct({ ...editProduct, addons: newAddons });
                            }} 
                            className={`px-3 py-2 rounded-lg cursor-pointer flex-shrink-0 transition-all duration-250 border font-bold text-xs ${isCurrentlyAvailable ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100/55' : 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100/55'}`} 
                            title={isCurrentlyAvailable ? "Marcar como Indisponível" : "Marcar como Disponível"}
                          >
                             {isCurrentlyAvailable ? 'Disponível' : 'Indisponível'}
                          </button>
                          
                          <button type="button" onClick={() => {
                            const newAddons = [...editProduct.addons!];
                            newAddons.splice(index, 1);
                            setEditProduct({ ...editProduct, addons: newAddons });
                          }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer flex-shrink-0 transition-colors border border-transparent hover:border-rose-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )})}
                  </div>
                ) : (
                   <p className="text-xs font-medium text-gray-500 text-center py-2">Nenhum complemento adicionado.</p> 
                )}
              </div>

              {/* Sabores */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex flex-col items-center gap-3 mb-5 text-center">
                  <h3 className="font-black text-sm text-gray-800 uppercase tracking-wider">Sabores</h3>
                  <button 
                    type="button" 
                    onClick={() => {
                      const currentFlavors = editProduct.flavors || [];
                      setEditProduct({ ...editProduct, flavors: [...currentFlavors, ''] });
                    }} 
                    className="text-xs font-bold text-gray-950 bg-gray-200 hover:bg-gray-300 px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 w-full max-w-[280px] mx-auto active:scale-95 shadow-xs"
                  >
                    <Plus className="w-4 h-4 shrink-0" /> Adicionar Sabor
                  </button>
                </div>
                {editProduct.flavors && editProduct.flavors.length > 0 ? (
                  <div className="space-y-2">
                    {Array.isArray(editProduct.flavors) && editProduct.flavors.map((flavor, index) => {
                      const isUnavailable = editProduct.unavailableFlavors?.includes(flavor) || false;
                      
                      return (
                      <div key={index} className={`flex gap-2 items-center animate-in fade-in slide-in-from-left-2 duration-200 ${isUnavailable ? 'opacity-60' : ''}`}>
                        <input 
                          type="text" 
                          placeholder="Ex: Morango" 
                          value={flavor} 
                          onChange={(e) => {
                            const newFlavors = [...editProduct.flavors!];
                            const oldFlavor = newFlavors[index];
                            newFlavors[index] = e.target.value;
                            
                            // If it was unavailable, update the unavailableFlavors array too
                            let newUnavailable = [...(editProduct.unavailableFlavors || [])];
                            if (newUnavailable.includes(oldFlavor)) {
                               newUnavailable = newUnavailable.filter(f => f !== oldFlavor);
                               if (e.target.value.trim() !== '') {
                                 newUnavailable.push(e.target.value);
                               }
                            }
                            
                            setEditProduct({ ...editProduct, flavors: newFlavors, unavailableFlavors: newUnavailable });
                          }} 
                          className={`flex-1 px-3 py-2 border rounded-lg text-sm transition-colors outline-none font-medium shadow-sm ${isUnavailable ? 'border-gray-200 bg-gray-100 text-gray-500 line-through focus:border-gray-400' : 'border-gray-300 bg-white text-gray-900 focus:border-gray-900 focus:ring-1 focus:ring-gray-900'}`}
                        />
                        
                        {flavor.trim() !== '' && (
                           <button 
                             type="button" 
                             onClick={() => {
                               let newUnavailable = [...(editProduct.unavailableFlavors || [])];
                               if (isUnavailable) {
                                 newUnavailable = newUnavailable.filter(f => f !== flavor);
                               } else {
                                 newUnavailable.push(flavor);
                               }
                               setEditProduct({ ...editProduct, unavailableFlavors: newUnavailable });
                             }} 
                             className={`px-3 py-2 rounded-lg cursor-pointer flex-shrink-0 transition-all duration-250 border font-bold text-xs ${!isUnavailable ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100/55' : 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100/55'}`} 
                             title={!isUnavailable ? "Marcar como Esgotado" : "Marcar como Disponível"}
                           >
                              {!isUnavailable ? 'Disponível' : 'Esgotado'}
                           </button>
                        )}

                        <button type="button" onClick={() => {
                          const newFlavors = [...editProduct.flavors!];
                          const removedFlavor = newFlavors[index];
                          newFlavors.splice(index, 1);
                          
                          let newUnavailable = [...(editProduct.unavailableFlavors || [])];
                          newUnavailable = newUnavailable.filter(f => f !== removedFlavor);
                          
                          setEditProduct({ ...editProduct, flavors: newFlavors, unavailableFlavors: newUnavailable });
                        }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-rose-100 active:scale-90">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )})}
                  </div>
                ) : (
                   <p className="text-xs font-medium text-gray-500 text-center py-2">Nenhum sabor adicionado (Opção gratuita).</p> 
                )}
              </div>

              <div className="bg-amber-50/50 p-4 border border-amber-100 rounded-xl space-y-3 relative overflow-hidden">
                <div className="flex items-center gap-2 text-amber-800 font-bold mb-1">
                  <Package className="w-5 h-5 text-amber-600" /> Controle de Estoque (Opcional)
                </div>
                <div className="flex flex-col sm:flex-row gap-3 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex-1 max-w-full">
                    <label className="block text-xs font-bold text-amber-900 mb-1">Unidade de Medida</label>
                    <div className="flex gap-1 bg-amber-100/50 p-1 rounded-xl relative w-full overflow-x-auto hide-scrollbar">
                      {[
                        { id: 'unidade', label: 'Un' },
                        { id: 'kilo', label: 'Kg' },
                        { id: 'litro', label: 'L' },
                        { id: 'caixa', label: 'Cx' },
                        { id: 'bandeja', label: 'Bj' },
                        { id: 'pacote', label: 'Pc' }
                      ].map((unit, idx) => (
                        <motion.button
                          key={unit.id}
                          type="button"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => { e.preventDefault(); setEditProduct({...editProduct, stockUnit: unit.id as any}); }}
                          className={`relative px-3 py-2 min-w-[36px] text-xs font-bold rounded-lg transition-colors flex-1 text-center cursor-pointer select-none ${
                            (editProduct.stockUnit || 'unidade') === unit.id ? 'text-amber-950' : 'text-amber-700/60 hover:text-amber-800'
                          }`}
                        >
                          {(editProduct.stockUnit || 'unidade') === unit.id && (
                            <motion.div
                              layoutId="stockUnit"
                              className="absolute inset-0 bg-white shadow-md rounded-lg border-2 border-amber-400"
                              initial={false}
                              transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                            />
                          )}
                          <span className="relative z-10">{unit.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-amber-900 mb-1">Quantidade Disponível</label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.001"
                      value={editProduct.stockCount !== undefined ? editProduct.stockCount : ''} 
                      onChange={e => setEditProduct({...editProduct, stockCount: e.target.value ? Number(e.target.value) : undefined})} 
                      placeholder="Sem limite" 
                      className="w-full px-4 py-2 border border-amber-300 rounded-lg text-amber-900 bg-white placeholder-amber-400 text-sm focus:border-amber-600 focus:ring-1 focus:ring-amber-600 outline-none transition-colors"
                    />
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-amber-700/80 font-semibold leading-snug">Ao preencher a quantidade, o sistema bloqueará compras caso o cliente tente pedir mais do que você tem em estoque. Deixe em branco se for Ilimitado.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-2 p-3 bg-red-50 border border-red-100 rounded-xl relative">
                  <div 
                    className="flex items-center gap-3 cursor-pointer select-none" 
                    onClick={() => setEditProduct({...editProduct, promotion: !editProduct.promotion})}
                  >
                    <AnimatedToggle 
                      checked={!!editProduct.promotion}
                      onChange={(val) => setEditProduct({...editProduct, promotion: val})}
                    />
                    <span className="font-semibold text-red-800 text-xs sm:text-sm">Destacar como Promoção</span>
                  </div>
                  
                  <AnimatePresence>
                    {editProduct.promotion && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-2 overflow-hidden"
                      >
                        <div className="flex flex-col gap-1.5 border-t border-red-200/50 pt-2">
                          <label className="text-[10px] font-black text-red-800 uppercase tracking-widest">Preço Promocional (Opcional)</label>
                          <input 
                            type="number"
                            step="0.01"
                            value={editProduct.promoQuantity === 1 && editProduct.promoPrice ? editProduct.promoPrice : ''}
                            onChange={(e) => {
                               const val = e.target.value;
                               if (val) {
                                  setEditProduct({...editProduct, promoQuantity: 1, promoPrice: Number(val)});
                               } else {
                                  setEditProduct({...editProduct, promoQuantity: undefined, promoPrice: undefined});
                               }
                            }}
                            placeholder="De: X Por: Y"
                            className="bg-white px-3 py-2 border border-red-200 rounded-lg text-sm text-red-900 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 placeholder-red-300"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div 
                  className="flex-1 flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl cursor-pointer select-none h-fit" 
                  onClick={() => {
                    const currentlyAvailable = editProduct.isAvailable !== false;
                    const becomeAvailable = !currentlyAvailable;
                    const newStockCount = (becomeAvailable && editProduct.stockCount !== undefined && editProduct.stockCount <= 0) ? undefined : editProduct.stockCount;
                    setEditProduct({...editProduct, isAvailable: becomeAvailable, stockCount: newStockCount});
                  }}
                >
                  <AnimatedToggle 
                    checked={editProduct.isAvailable !== false}
                    onChange={(val) => {
                      const newStockCount = (val && editProduct.stockCount !== undefined && editProduct.stockCount <= 0) ? undefined : editProduct.stockCount;
                      setEditProduct({...editProduct, isAvailable: val, stockCount: newStockCount});
                    }}
                  />
                  <span className="font-semibold text-indigo-800 text-xs sm:text-sm">Disponível em Estoque</span>
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 cursor-pointer">
                Salvar Produto
              </button>
            </form>
          </div>
        )}        {activeTab === 'settings' && (
          <div className="max-w-2xl pb-16 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            <div className="mb-6">
             {/* MODERN MULTI-CATEGORY SETTINGS NAV */}
            <div className="bg-white rounded-3xl border border-gray-150 p-2 shadow-sm mb-8 overflow-x-auto no-scrollbar">
              <div className="flex gap-1 min-w-max">
                {[
                  { id: 'identity', title: 'Identidade', icon: <Store className="w-4 h-4" /> },
                  { id: 'operation', title: 'Horários', icon: <Clock className="w-4 h-4" /> },
                  { id: 'design', title: 'Visual', icon: <Palette className="w-4 h-4" /> },
                  { id: 'payment', title: 'Pagamento', icon: <CreditCard className="w-4 h-4" /> },
                  { id: 'logistics', title: 'Logística', icon: <MapPin className="w-4 h-4" /> },
                  { id: 'contact', title: 'Contato', icon: <MessageSquare className="w-4 h-4" /> },
                  { id: 'scheduling', title: 'Agendamento', icon: <Calendar className="w-4 h-4" /> },
                  { id: 'categories', title: 'Categorias', icon: <Hash className="w-4 h-4" /> },
                ].map((item) => {
                  const isActive = settingsSubTab === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSettingsSubTab(item.id as any)}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all cursor-pointer whitespace-nowrap text-xs font-black uppercase tracking-widest ${
                        isActive
                          ? 'bg-gray-900 text-white shadow-lg'
                          : 'bg-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {item.icon}
                      {item.title}
                    </motion.button>
                  );
                })}
              </div>
            </div>
            
            <div className="space-y-6">
              
              {/* CATEGORIA: IDENTIDADE VISUAL */}
              {settingsSubTab === 'identity' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* LOGOMARCA E CAPA */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                      <div className="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center">
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Identidade da Marca</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Logo, Capa e Nome Social</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Logo Upload Section */}
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Logomarca (Quadrada)</label>
                        <div className="relative group">
                          <div className={`w-32 h-32 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden ${logo ? 'border-gray-200' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'}`}>
                             {logo ? (
                               <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                             ) : (
                               <>
                                 <Plus className="w-6 h-6 text-gray-300 group-hover:text-gray-500 mb-1" />
                                 <span className="text-[8px] font-black text-gray-400 uppercase">Subir Logo</span>
                               </>
                             )}
                             <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                             />
                          </div>
                          {logo && (
                            <button 
                              onClick={() => setLogo('')}
                              className="absolute -top-2 -right-2 w-7 h-7 bg-white text-gray-400 hover:text-rose-500 rounded-full flex items-center justify-center shadow-lg border border-gray-100 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Store Name & Description */}
                      <div className="space-y-4 text-left">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Comércio</label>
                          <input 
                            type="text"
                            value={storeNameFirst}
                            onChange={e => setStoreNameFirst(e.target.value)}
                            placeholder="Ex: Pizzaria Real"
                            className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-800 transition-all focus:bg-white focus:ring-4 focus:ring-gray-100 focus:border-gray-900 outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição / Biografia da Empresa</label>
                          <textarea 
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Descreva seu comércio, horários, especialidades ou qualquer outra informação para seus clientes..."
                            className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-600 transition-all focus:bg-white focus:ring-4 focus:ring-gray-100 focus:border-gray-900 outline-none h-24 resize-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Responsável / CEO</label>
                          <input 
                            type="text"
                            value={ceoName}
                            onChange={e => setCeoName(e.target.value)}
                            placeholder="Seu nome ou nome do responsável"
                            className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-600 transition-all focus:bg-white focus:ring-4 focus:ring-gray-100 focus:border-gray-900 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* LINK DA LOJA E COMPARTILHAMENTO */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
                    <div>
                      <h3 className="text-xs font-black text-gray-900 uppercase tracking-tight mb-1">Link de Acesso Direto</h3>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Como seus clientes encontrarão sua loja.</p>
                    </div>
                    
                    <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-gray-900 transition-all flex items-stretch">
                      <span className="px-3 py-3 text-gray-400 flex-shrink-0 text-[10px] font-black uppercase tracking-widest bg-gray-100/50 border-r border-gray-200 flex items-center">
                        /
                      </span>
                      <input 
                        type="text" 
                        value={storeSlug}
                        onChange={e => setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        className="flex-grow px-3 py-3 bg-transparent outline-none font-mono text-xs font-black text-gray-800"
                        placeholder="minha-loja-123"
                        required
                      />
                    </div>

                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Sugestão: {slugifyText(storeNameFirst || 'loja')}</span>
                      <button 
                        type="button" 
                        onClick={() => setStoreSlug(slugifyText(storeNameFirst))}
                        className="text-[9px] text-emerald-600 font-black uppercase tracking-widest hover:underline"
                      >
                        Sincronizar com Nome
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-tight">Cores Identitárias</h3>
                    <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 items-center">
                       <input 
                        type="color" 
                        value={primaryColor}
                        onChange={e => setPrimaryColor(e.target.value)}
                        className="w-12 h-12 p-1 border-2 border-white rounded-xl cursor-pointer shadow-sm"
                      />
                      <div>
                        <p className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Cor de Destaque</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Aplicado em botões e acentos</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {settingsSubTab === 'operation' && (
                <motion.div 
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="space-y-6"
                >
                  {/* BUSINESS TYPE CHOICE */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                      <div className="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Modelo de Negócio</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Loja ou Alimentação</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <button 
                         onClick={() => setStoreBusinessModel('store')}
                         className={`p-5 rounded-3xl border-2 transition-all text-left flex flex-col gap-3 ${storeBusinessModel === 'store' ? 'border-gray-900 bg-gray-50' : 'border-gray-100'}`}
                       >
                         <ShoppingBag className={`w-6 h-6 ${storeBusinessModel === 'store' ? 'text-gray-900' : 'text-gray-300'}`} />
                         <div>
                           <span className="block text-xs font-black uppercase tracking-tight">Loja / Catálogo</span>
                           <span className="text-[10px] font-bold text-gray-400">Roupas, Eletrônicos, etc</span>
                         </div>
                       </button>
                       <button 
                         onClick={() => setStoreBusinessModel('restaurant')}
                         className={`p-5 rounded-3xl border-2 transition-all text-left flex flex-col gap-3 ${storeBusinessModel === 'restaurant' ? 'border-gray-900 bg-gray-50' : 'border-gray-100'}`}
                       >
                         <UtensilsCrossed className={`w-6 h-6 ${storeBusinessModel === 'restaurant' ? 'text-gray-900' : 'text-gray-300'}`} />
                         <div>
                           <span className="block text-xs font-black uppercase tracking-tight">Restaurante / Delivery</span>
                           <span className="text-[10px] font-bold text-gray-400">Pizzas, Lanches, Marmitas</span>
                         </div>
                       </button>
                    </div>
                  </div>

                  {/* STATUS DE FUNCIONAMENTO (ABERTO / FECHADO) */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h2 className="text-xs font-bold text-gray-700 tracking-wider uppercase mb-3.5 flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  Funcionamento Online
                </h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-gray-150 bg-gray-50/50">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-800">
                      Sua loja está atualmente: <span className={isOpen ? 'text-emerald-600 font-extrabold' : 'text-rose-600 font-extrabold'}>{isOpen ? 'ABERTA ✅' : 'FECHADA ❌'}</span>
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {isOpen 
                        ? 'Clientes podem ver o catálogo e realizar pedidos normalmente, enviando a sacola no seu WhatsApp.'
                        : 'O catálogo continuará disponível para visualização, mas os botões de compra estarão suspensos com um aviso elegante.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setIsOpen(true)}
                      className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                        isOpen 
                          ? 'bg-emerald-600 text-white shadow-sm' 
                          : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'
                      }`}
                    >
                      Loja Aberta
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                        !isOpen 
                          ? 'bg-rose-600 text-white shadow-sm' 
                          : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'
                      }`}
                    >
                      Loja Fechada
                    </button>
                  </div>
                </div>
              </div>

              {/* GRADE DE HORÁRIOS - MOVIDO PARA DENTRO DE OPERATION */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-600" />
                        <div>
                          <h2 className="text-xs font-black text-gray-800 tracking-wider uppercase">
                            Horário de Funcionamento & Descanso
                          </h2>
                          <p className="text-[10px] text-gray-400 font-medium">Configure seu calendário semanal e intervalos de descanso (almoço).</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={syncSchedules}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 border border-emerald-100 active:scale-95"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Sincronizar Dias
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Configurações básicas / 24h */}
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <AnimatedToggle 
                          checked={is24Hours}
                          onChange={(val) => setIs24Hours(val)}
                          label="Aberto 24 Horas (Ininterrupto)"
                        />
                      </div>

                      {!is24Hours && (
                        <div className="space-y-4">
                          {/* Grade Semanal */}
                          <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
                            {/* Headers de coluna para alinhamento em telas maiores */}
                            <div className="hidden lg:grid lg:grid-cols-[130px_110px_200px_1fr] gap-4 pb-2 border-b border-gray-150 text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">
                              <div>Dia da Semana</div>
                              <div>Status</div>
                              <div>Expediente</div>
                              <div>Intervalo / Almoço</div>
                            </div>

                            <div className="divide-y divide-gray-100">
                              {[
                                { index: 0, label: 'Domingo' },
                                { index: 1, label: 'Segunda-feira' },
                                { index: 2, label: 'Terça-feira' },
                                { index: 3, label: 'Quarta-feira' },
                                { index: 4, label: 'Quinta-feira' },
                                { index: 5, label: 'Sexta-feira' },
                                { index: 6, label: 'Sábado' },
                              ].map((day) => {
                                const sched = weeklySchedules.find(s => s.dayIndex === day.index) || {
                                  dayIndex: day.index,
                                  isOpen: true,
                                  openingTime: '08:00',
                                  closingTime: '18:00',
                                  hasLunchBreak: false,
                                  lunchBreakStart: '12:00',
                                  lunchBreakEnd: '13:30'
                                };

                                const updateSched = (fields: Partial<DaySchedule>) => {
                                  const updated = weeklySchedules.map(s => {
                                    if (s.dayIndex === day.index) {
                                      return { ...s, ...fields };
                                    }
                                    return s;
                                  });
                                  if (!weeklySchedules.some(s => s.dayIndex === day.index)) {
                                      updated.push({
                                        dayIndex: day.index,
                                        isOpen: true,
                                        openingTime: '08:00',
                                        closingTime: '18:00',
                                        hasLunchBreak: false,
                                        lunchBreakStart: '12:00',
                                        lunchBreakEnd: '14:00',
                                        ...fields
                                      });
                                  }
                                  setWeeklySchedules(updated);
                                };

                                return (
                                  <div key={day.index} className="py-4 border-b border-gray-100 last:border-b-0 flex flex-col lg:grid lg:grid-cols-[130px_110px_200px_1fr] gap-3 lg:gap-4 items-stretch lg:items-center px-1 lg:px-3 hover:bg-slate-50/40 rounded-xl transition-all duration-200">
                                    <div className="flex items-center justify-between lg:justify-start">
                                      <span className="text-xs font-black text-gray-800 uppercase tracking-wider">{day.label}</span>
                                      <span className={`lg:hidden px-2 py-0.5 rounded-full text-[10px] font-bold ${sched.isOpen ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                                        {sched.isOpen ? 'Aberto' : 'Fechado'}
                                      </span>
                                    </div>
                                    <div className="flex items-center">
                                      <AnimatedToggle 
                                        checked={sched.isOpen}
                                        onChange={(val) => updateSched({ isOpen: val })}
                                        label={sched.isOpen ? 'Ativo' : 'Inativo'}
                                      />
                                    </div>
                                    <div className="w-full lg:w-auto">
                                      {sched.isOpen ? (
                                        <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 px-2.5 rounded-xl border border-gray-200/80 w-full lg:w-fit justify-between lg:justify-start">
                                          <div className="flex items-center gap-1">
                                            <input type="time" value={sched.openingTime || '08:00'} onChange={(e) => updateSched({ openingTime: e.target.value })} className="px-2 py-1 rounded-lg text-xs font-bold w-16 text-center bg-white border border-gray-250 focus:outline-hidden focus:border-emerald-500 shadow-xs" />
                                            <span className="text-xs text-gray-400 font-bold px-1">às</span>
                                            <input type="time" value={sched.closingTime || '18:00'} onChange={(e) => updateSched({ closingTime: e.target.value })} className="px-2 py-1 rounded-lg text-xs font-bold w-16 text-center bg-white border border-gray-250 focus:outline-hidden focus:border-emerald-500 shadow-xs" />
                                          </div>
                                        </div>
                                      ) : null}
                                    </div>
                                    <div className="w-full lg:w-auto">
                                      {sched.isOpen && (
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                          <AnimatedToggle checked={sched.hasLunchBreak || false} onChange={(val) => updateSched({ hasLunchBreak: val })} label="Almoço" />
                                          {sched.hasLunchBreak && (
                                            <div className="flex items-center bg-orange-50/60 p-1 px-2.5 rounded-lg border border-orange-100">
                                              <input type="time" value={sched.lunchBreakStart || '12:00'} onChange={(e) => updateSched({ lunchBreakStart: e.target.value })} className="px-1.5 py-0.5 border border-orange-200 rounded text-xs font-bold w-14 text-center bg-white" />
                                              <span className="text-[10px] text-orange-400 font-bold px-1">às</span>
                                              <input type="time" value={sched.lunchBreakEnd || '13:30'} onChange={(e) => updateSched({ lunchBreakEnd: e.target.value })} className="px-1.5 py-0.5 border border-orange-200 rounded text-xs font-bold w-14 text-center bg-white" />
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-bold text-gray-650 mb-1">Nota Adicional / Informação (Opcional)</label>
                        <input value={openingHours} onChange={e => setOpeningHours(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-medium text-sm placeholder-gray-400" placeholder="Ex: Seg a Sex das 08h às 18h" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {settingsSubTab === 'design' && (
                <motion.div 
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="space-y-6"
                >
                  {/* TIPOGRAFIA E ESTILO */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
                        <Palette className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Design & Visual</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Estética do Cardápio</p>
                      </div>
                    </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-650 mb-1">Nome da Sua Loja</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={storeNameFirst}
                        onChange={e => setStoreNameFirst(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium"
                        placeholder="Ex: Barraca do Samuel"
                        required
                        autoComplete="off"
                      />
                      <div className="relative flex items-center">
                        <input 
                          type="color"
                          value={storeNameFirstColor}
                          onChange={e => setStoreNameFirstColor(e.target.value)}
                          className="w-9 h-9 p-0.5 border border-gray-200 rounded-lg cursor-pointer"
                          title="Escolha a cor do nome"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-650 mb-1">Slogan ou Descrição Curta (Compartilhamento)</label>
                    <input 
                      type="text"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium"
                      placeholder="Ex: As melhores frutas da região!"
                      autoComplete="off"
                    />
                    <p className="text-[10px] text-gray-400 mt-1 italic">Este texto aparecerá quando você compartilhar o link do cardápio.</p>
                  </div>
                </div>

                {/* PREVIEW DA LOGO */}
                <div className="p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> Prévia da Logomarca de Texto
                  </span>
                  <div 
                    className="font-black tracking-normal my-2"
                    style={{
                      fontSize: `${headerFontSize}px`,
                      fontFamily: fontFamily === 'space-grotesk' ? '"Space Grotesk", sans-serif' :
                                  fontFamily === 'outfit' ? '"Outfit", sans-serif' :
                                  fontFamily === 'playfair' ? '"Playfair Display", serif' :
                                  fontFamily === 'jetbrains-mono' ? '"JetBrains Mono", monospace' :
                                  '"Inter", sans-serif'
                    }}
                  >
                    <span style={{ color: storeNameFirstColor }}>{storeNameFirst || ''}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">renderizado na fonte: <strong className="text-gray-600 font-bold">{fontFamily}</strong></p>
                  
                  {/* Régua Dimensional Interativa */}
                  <div className="w-full mt-2 pt-3 border-t border-gray-200/60 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between text-[9px] text-gray-400 font-mono uppercase tracking-widest mb-1.5 font-bold">
                      <span>Régua de Limite de Layout</span>
                      <span className="text-emerald-600 font-extrabold">{(storeNameFirst || '').length} caracteres</span>
                    </div>
                    {/* Tickmarks line */}
                    <div className="h-4 flex items-end justify-between border-b border-gray-200 relative select-none px-1">
                      {[...Array(11)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <span className="text-[7px] text-gray-400 font-mono scale-90">{i * 5}</span>
                          <div className={`w-0.5 bg-gray-300 ${i % 5 === 0 ? 'h-2 bg-gray-400' : 'h-1'}`}></div>
                        </div>
                      ))}
                      {/* Pointer filling line */}
                      <div 
                        className="absolute bottom-[-1.5px] left-0 h-1 bg-green-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(10, storeNameFirst.length * 2.5))}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FONTE E CHOICES */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <h2 className="text-xs font-bold text-gray-700 tracking-wider uppercase flex items-center gap-1.5">
                  Estilo Tipográfico (Fontes)
                </h2>
                
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2.5">Família Tipográfica (Fonte Principal do Cardápio)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                    {[
                      { id: 'inter', name: 'Inter', desc: 'Sem-serifa Limpa & Moderna', preview: 'Inter Aa', style: { fontFamily: '"Inter", sans-serif' } },
                      { id: 'space-grotesk', name: 'Space Grotesk', desc: 'Geométrica & Tecnológica', preview: 'Space Aa', style: { fontFamily: '"Space Grotesk", sans-serif' } },
                      { id: 'outfit', name: 'Outfit', desc: 'Premium Futuristic Circle', preview: 'Outfit Aa', style: { fontFamily: '"Outfit", sans-serif' } },
                      { id: 'playfair', name: 'Playfair Display', desc: 'Serifada Clássica / Tradicional', preview: 'Play Aa', style: { fontFamily: '"Playfair Display", serif' } },
                      { id: 'jetbrains-mono', name: 'JetBrains Mono', desc: 'Console / Brutalista / Técnico', preview: 'Mono Aa', style: { fontFamily: '"JetBrains Mono", monospace' } },
                      { id: 'cinzel', name: 'Cinzel', desc: 'Serifada Clássica de Alto Luxo', preview: 'Cin Aa', style: { fontFamily: '"Cinzel", serif' } },
                      { id: 'montserrat', name: 'Montserrat', desc: 'Sleek Geométrica Limpa', preview: 'Mont Aa', style: { fontFamily: '"Montserrat", sans-serif' } },
                      { id: 'cormorant', name: 'Cormorant Garamond', desc: 'Editorial Realeza Sofisticada', preview: 'Corm Aa', style: { fontFamily: '"Cormorant Garamond", serif' } },
                      { id: 'sora', name: 'Sora', desc: 'Digital Moderna Arredondada', preview: 'Sora Aa', style: { fontFamily: '"Sora", sans-serif' } }
                    ].map(f => {
                      const isSelected = fontFamily === f.id;
                      return (
                        <motion.button
                          key={f.id}
                          type="button"
                          whileHover={{ scale: 1.015, y: -1 }}
                          whileTap={{ scale: 0.985 }}
                          onClick={() => setFontFamily(f.id)}
                          className={`p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all duration-300 relative overflow-hidden cursor-pointer select-none ${
                            isSelected 
                              ? 'border-emerald-600 bg-emerald-50/20 shadow-xs ring-2 ring-emerald-500/10' 
                              : 'border-gray-150 bg-white hover:border-gray-250 hover:bg-gray-50/50'
                          }`}
                        >
                          <div className="space-y-0.5 max-w-[70%]">
                            <span className="block text-xs font-black text-gray-900" style={f.style}>{f.name}</span>
                            <span className="block text-[10px] text-gray-400 font-semibold" style={f.style}>{f.desc}</span>
                          </div>
                          <span className="text-sm font-black text-emerald-600/80 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100" style={f.style}>{f.preview}</span>
                          {isSelected && (
                            <motion.div 
                              layoutId="activeFontLine"
                              className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600"
                              transition={{ type: "spring", stiffness: 350, damping: 25 }}
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-655 mb-2">Tamanho do Letreiro (Nome / Título da Loja no Topo)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" min="14" max="44" step="1"
                      value={headerFontSize} 
                      onChange={e => setHeaderFontSize(Number(e.target.value))}
                      className="flex-1 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <span className="text-sm font-bold w-12 text-center bg-gray-100 rounded py-1 border border-gray-200">{headerFontSize}px</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                    Ajuste este valor para aumentar ou diminuir o letreiro com o nome da sua loja no topo do catálogo. (Padrão: 24px)
                  </p>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-655 mb-2">Tamanho Base da Letra (Visualização do Cliente)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" min="12" max="24" step="1"
                      value={customerFontSize} 
                      onChange={e => setCustomerFontSize(Number(e.target.value))}
                      className="flex-1 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <span className="text-sm font-bold w-12 text-center bg-gray-100 rounded py-1 border border-gray-200">{customerFontSize}px</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                    Ajuste este valor se as letras estiverem muito pequenas ou muito grandes na tela dos seus clientes. (Padrão: 16px)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-655 mb-3">Ordem de Exibição no Cartão do Produto</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setProductOrder('name-first')}
                      className={`relative p-3 rounded-xl border-2 transition-all text-left group ${
                        productOrder === 'name-first' ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-150 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${productOrder === 'name-first' ? 'text-emerald-700' : 'text-gray-400'}`}>Nome Primeiro</span>
                          <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            productOrder === 'name-first' ? 'border-emerald-500 bg-emerald-500' : 'border-gray-200'
                          }`}>
                            {productOrder === 'name-first' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                        </div>
                        <div className="space-y-1 opacity-60">
                          <div className="h-2 w-20 bg-gray-300 rounded"></div>
                          <div className="h-1.5 w-12 bg-emerald-300 rounded"></div>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProductOrder('price-first')}
                      className={`relative p-3 rounded-xl border-2 transition-all text-left group ${
                        productOrder === 'price-first' ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-150 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${productOrder === 'price-first' ? 'text-emerald-700' : 'text-gray-400'}`}>Preço Primeiro</span>
                          <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            productOrder === 'price-first' ? 'border-emerald-500 bg-emerald-500' : 'border-gray-200'
                          }`}>
                            {productOrder === 'price-first' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                        </div>
                        <div className="space-y-1 opacity-60">
                          <div className="h-1.5 w-12 bg-emerald-400 rounded"></div>
                          <div className="h-2 w-20 bg-gray-300 rounded"></div>
                        </div>
                      </div>
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                    Escolha se o nome do produto ou o preço deve ter maior destaque visual no início do cartão.
                  </p>
                </div>
              </div>

              {/* PALETA DE CORES DE PRESTÍGIO */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div>
                  <h2 className="text-xs font-bold text-gray-750 tracking-wider uppercase flex items-center gap-1.5 mb-1">
                    <Palette className="w-4 h-4 text-emerald-600" />
                    Paleta de Cores de Prestígio ⚜️
                  </h2>
                  <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">Selecione um dos nossos temas refinados de alta performance que alterará todo o design do seu cardápio instantaneamente.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { name: 'Emerald Garden', hex: '#10b981', desc: 'Sabor Verde Clássico' },
                    { name: 'Royal Amethyst', hex: '#8b5cf6', desc: 'Luxúria & Inovação' },
                    { name: 'Warm Amber', hex: '#f97316', desc: 'Gourmet & Atrativo' },
                    { name: 'Midnight Ocean', hex: '#0284c7', desc: 'Moderno & Calmo' },
                    { name: 'Rose Gold Lux', hex: '#db2777', desc: 'Fashion & Doce' },
                    { name: 'Stealth Slate', hex: '#1e293b', desc: 'Minimalismo Fino' },
                    { name: 'Gold Deluxe', hex: '#b45309', desc: 'Nobreza & Ouro' },
                    { name: 'Ruby Imperial', hex: '#be123c', desc: 'Paixão Imperial de Realeza' },
                    { name: 'Forest Emerald', hex: '#0f766e', desc: 'Orgânico & Refinado Gourmet' },
                    { name: 'Rosewood Quartz', hex: '#9d174d', desc: 'Vinho Fino Vintage Velvet' },
                    { name: 'Sapphire Crown', hex: '#1e3a8a', desc: 'Confiança & Prestígio Real' },
                    { name: 'Champagne Silk', hex: '#78350f', desc: 'Bronze Quente Toasted' },
                  ].map(p => {
                    const isSelected = primaryColor.toLowerCase() === p.hex.toLowerCase();
                    return (
                      <motion.button
                        key={p.name}
                        type="button"
                        whileHover={{ scale: 1.025, y: -1 }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => setPrimaryColor(p.hex)}
                        className={`p-3.5 rounded-2xl text-left border relative overflow-hidden flex flex-col justify-between gap-2.5 transition-all duration-300 cursor-pointer select-none ${
                          isSelected 
                            ? 'border-emerald-600 bg-emerald-50/10 shadow-xs ring-2 ring-emerald-500/10' 
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <div className="w-3.5 h-3.5 rounded-full border border-black/5 flex-shrink-0 shadow-sm" style={{ backgroundColor: p.hex }} />
                          <span className="text-[10px] font-black text-gray-900 leading-tight">{p.name}</span>
                        </div>
                        <span className="text-[8px] text-gray-400 font-extrabold uppercase tracking-wide block">{p.desc}</span>
                        {isSelected && (
                          <motion.div 
                            layoutId="activeColorBorder"
                            className="absolute inset-0 border-2 border-emerald-500 rounded-2xl pointer-events-none"
                            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
              
              {/* STEPPED FOOTER ACTION BUTTONS */}
              <div className="pt-4 flex justify-between items-center gap-4">
                <button
                  type="button"
                  onClick={() => setSettingsSubTab('operation')}
                  className="px-5 py-3 bg-white border border-gray-200 text-gray-750 hover:bg-gray-50 active:scale-95 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  ← Anterior
                </button>
                <button 
                  type="button"
                  onClick={() => setSettingsSubTab('payment')}
                  className="px-5 py-3 bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Próximo →
                </button>
              </div>
            </motion.div>
          )}

          {/* CATEGORIA: PAGAMENTO */}
          {settingsSubTab === 'payment' && (
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="space-y-6"
            >
              <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Pagamento</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Opções de Recebimento</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { id: 'pix', label: 'PIX (Manual / Automático)', icon: <QrCode className="w-5 h-5" />, color: 'indigo', desc: 'Recebimento Instantâneo' },
                    { id: 'card', label: 'Crédito', icon: <CreditCard className="w-5 h-5" />, color: 'blue', desc: 'Presencial ou Online' },
                    { id: 'debit', label: 'Débito', icon: <CreditCard className="w-5 h-5" />, color: 'purple', desc: 'Cartão de Débito' },
                    { id: 'cash', label: 'Dinheiro', icon: <Banknote className="w-5 h-5" />, color: 'emerald', desc: 'Pagamento na Entrega' },
                  ].map((method) => {
                    const isSelected = acceptedPaymentMethods.includes(method.id as PaymentMethod);
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (acceptedPaymentMethods.length > 1) {
                              setAcceptedPaymentMethods(acceptedPaymentMethods.filter(m => m !== method.id));
                            } else {
                              showNotification('Você deve manter pelo menos um método de pagamento ativo.', 'warning');
                            }
                          } else {
                            setAcceptedPaymentMethods([...acceptedPaymentMethods, method.id as PaymentMethod]);
                          }
                        }}
                        className={`flex flex-col gap-4 p-5 rounded-[32px] border-2 transition-all relative overflow-hidden group ${
                          isSelected 
                            ? `border-emerald-500 bg-emerald-50/10 shadow-lg shadow-emerald-100/20` 
                            : 'border-gray-100 bg-white hover:border-gray-200'
                        }`}
                      >
                         <div className="flex items-center justify-between w-full">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                              isSelected ? `bg-emerald-600 text-white shadow-lg` : 'bg-gray-50 text-gray-400'
                            }`}>
                              {method.icon}
                            </div>
                            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-emerald-500 bg-emerald-500 shadow-sm' : 'border-gray-200 bg-white'}`}>
                               {isSelected && <Check className="w-4 h-4 text-white" />}
                            </div>
                         </div>
                         <div className="text-left mt-2">
                           <span className={`block text-xs font-black uppercase tracking-tight ${isSelected ? `text-emerald-900` : 'text-gray-400 font-bold'}`}>
                             {method.label}
                           </span>
                           <span className={`text-[10px] font-bold ${isSelected ? 'text-emerald-600/70' : 'text-gray-300'}`}>
                             {method.desc}
                           </span>
                         </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEPPED FOOTER ACTION BUTTONS */}
              <div className="pt-4 flex justify-between items-center gap-4">
                <button
                  type="button"
                  onClick={() => setSettingsSubTab('design')}
                  className="px-5 py-3 bg-white border border-gray-200 text-gray-750 hover:bg-gray-50 active:scale-95 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  ← Anterior
                </button>
                <button 
                  type="button"
                  onClick={() => setSettingsSubTab('logistics')}
                  className="px-5 py-3 bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Próximo →
                </button>
              </div>
            </motion.div>
          )}

              {/* CATEGORIA: LOGÍSTICA */}
              {settingsSubTab === 'logistics' && (
                <motion.div 
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="space-y-6"
                >
                  {/* MODELO DE ENTREGA */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Logística & Entrega</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Como seus produtos chegam</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button 
                        onClick={() => setStoreType('only_delivery')}
                        className={`p-5 rounded-3xl border-2 transition-all text-left flex flex-col gap-3 ${storeType === 'only_delivery' ? 'border-amber-500 bg-amber-50' : 'border-gray-100'}`}
                      >
                        <Truck className={`w-6 h-6 ${storeType === 'only_delivery' ? 'text-amber-600' : 'text-gray-300'}`} />
                        <div>
                          <span className="block text-xs font-black uppercase tracking-tight">Só Entrega</span>
                          <span className="text-[9px] font-bold text-gray-400 leading-tight">Envio direto ao endereço do cliente via motoboy.</span>
                        </div>
                      </button>
                      <button 
                        onClick={() => setStoreType('only_pickup')}
                        className={`p-5 rounded-3xl border-2 transition-all text-left flex flex-col gap-3 ${storeType === 'only_pickup' ? 'border-amber-500 bg-amber-50' : 'border-gray-100'}`}
                      >
                        <MapPin className={`w-6 h-6 ${storeType === 'only_pickup' ? 'text-amber-600' : 'text-gray-300'}`} />
                        <div>
                          <span className="block text-xs font-black uppercase tracking-tight">Só Retirada</span>
                          <span className="text-[9px] font-bold text-gray-400 leading-tight">O cliente vem até o seu estabelecimento retirar.</span>
                        </div>
                      </button>
                      <button 
                        onClick={() => setStoreType('delivery_and_pickup')}
                        className={`p-5 rounded-3xl border-2 transition-all text-left flex flex-col gap-3 ${storeType === 'delivery_and_pickup' ? 'border-amber-500 bg-amber-50' : 'border-gray-100'}`}
                      >
                        <Package className={`w-6 h-6 ${storeType === 'delivery_and_pickup' ? 'text-amber-600' : 'text-gray-300'}`} />
                        <div>
                          <span className="block text-xs font-black uppercase tracking-tight">Ambos</span>
                          <span className="text-[9px] font-bold text-gray-400 leading-tight">Ofereça flexibilidade total de recebimento.</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* ENDEREÇO DE RETIRADA */}
                  {(storeType === 'only_pickup' || storeType === 'delivery_and_pickup') && (
                    <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-6">
                      <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                          <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Endereço de Retirada</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Loja Física para Clientes</p>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1 md:col-span-2 space-y-1.5">
                           <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Rua, Avenida e Número</label>
                           <input 
                             type="text"
                             value={addressStreet}
                             onChange={e => setAddressStreet(e.target.value)}
                             placeholder="Ex: Av. Paulista, 1000"
                             className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-800 transition-all focus:bg-white focus:ring-4 focus:ring-rose-50 border-rose-500 outline-none"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bairro</label>
                           <input 
                             type="text"
                             value={addressNeighborhood}
                             onChange={e => setAddressNeighborhood(e.target.value)}
                             placeholder="Ex: Cerqueira César"
                             className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-800 transition-all focus:bg-white focus:ring-4 focus:ring-rose-50 border-rose-500 outline-none"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cidade - UF</label>
                           <input 
                             type="text"
                             value={addressCityState}
                             onChange={e => setAddressCityState(e.target.value)}
                             placeholder="Ex: São Paulo - SP"
                             className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-800 transition-all focus:bg-white focus:ring-4 focus:ring-rose-50 border-rose-500 outline-none"
                           />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* REGRAS DE ENTREGA E TAXAS */}
                  {(storeType === 'only_delivery' || storeType === 'delivery_and_pickup') && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-100">
                                  <Truck className="w-5 h-5" />
                                </div>
                                <div>
                                  <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Zonas de Entrega</h2>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Taxas e Regras de Frete</p>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                   <div className="space-y-1.5 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pedido Mínimo (R$)</label>
                                         <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">R$</span>
                                            <input 
                                              type="number"
                                              step="0.01"
                                              value={minimumOrderValue === 0 ? '' : minimumOrderValue}
                                              onChange={e => setMinimumOrderValue(e.target.value === '' ? 0 : Number(e.target.value))}
                                              placeholder="Ex: 25.00"
                                              className="w-full pl-10 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-black text-gray-800 transition-all focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 outline-none shadow-sm"
                                            />
                                         </div>
                                         <p className="text-[9px] text-gray-400 font-medium mt-1 ml-1 leading-tight italic">Deixe vazio para sem valor mínimo.</p>
                                   </div>

                                   <div className="space-y-1.5 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tempo de Entrega (Minutos)</label>
                                      <input 
                                        type="number"
                                        value={deliveryTime}
                                        onChange={e => setDeliveryTime(e.target.value)}
                                        placeholder="Ex: 40"
                                        className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-black text-gray-800 transition-all focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 outline-none shadow-sm"
                                      />
                                      <p className="text-[9px] text-gray-400 font-medium mt-1 ml-1 leading-tight italic">Estimativa global em minutos.</p>
                                   </div>

                                   <div className="space-y-1.5 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Impressora na Cozinha</label>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => setPrintMode('manual')}
                                          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl border ${printMode === 'manual' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-inner' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                        >
                                          Manual
                                        </button>
                                        <button
                                          onClick={() => setPrintMode('auto')}
                                          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl border ${printMode === 'auto' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-inner' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                        >
                                          Automático
                                        </button>
                                      </div>
                                      <p className="text-[9px] text-gray-400 font-medium mt-1 ml-1 leading-tight italic">Imprimir cupom apenas ao abrir ou automaticamente.</p>
                                   </div>
                                </div>

                                {/* LISTA DE ZONAS (REUTILIZADA) */}
                                <div className="pt-6 border-t border-dashed border-gray-200">
                                   <div className="flex items-center gap-2 mb-6">
                                      <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
                                         <Plus className="w-4 h-4" />
                                      </div>
                                      <h3 className="text-xs font-black text-gray-900 uppercase tracking-tight">Adicionar Nova Zona</h3>
                                   </div>

                                   <div id="delivery-zone-form" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 bg-gray-50/50 p-6 rounded-[2.5rem] border border-gray-100 shadow-inner">
                                      <div className="space-y-1.5">
                                         <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cidade</label>
                                         <input 
                                           type="text"
                                           value={newDeliveryCity}
                                           onChange={e => setNewDeliveryCity(e.target.value)}
                                           placeholder="Ex: Natal"
                                           className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 transition-all focus:ring-4 focus:ring-orange-50 focus:border-orange-500 outline-none shadow-sm"
                                         />
                                      </div>
                                      <div className="space-y-1.5 relative">
                                         <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Zona</label>
                                         <div 
                                           onClick={() => setIsZoneDropdownOpen(!isZoneDropdownOpen)}
                                           className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 cursor-pointer flex items-center justify-between shadow-sm hover:border-orange-300 transition-all"
                                         >
                                           <span className={newDeliveryZone ? 'text-gray-900 truncate' : 'text-gray-400 font-normal italic'}>
                                             {newDeliveryZone || 'Selecione'}
                                           </span>
                                           <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isZoneDropdownOpen ? 'rotate-180' : ''}`} />
                                         </div>

                                         <AnimatePresence>
                                           {isZoneDropdownOpen && (
                                             <motion.div 
                                               initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                               animate={{ opacity: 1, y: 0, scale: 1 }}
                                               exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                               className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden py-1"
                                             >
                                               {['Zona Norte', 'Zona Sul', 'Zona Leste', 'Zona Oeste', 'Centro', 'Interior', 'Grande Natal', 'Outros'].map((zone) => (
                                                 <button
                                                   key={zone}
                                                   type="button"
                                                   onClick={(e) => {
                                                     e.stopPropagation();
                                                     setNewDeliveryZone(zone);
                                                     setIsZoneDropdownOpen(false);
                                                   }}
                                                   className={`w-full px-4 py-3 text-left text-xs font-black uppercase tracking-tight transition-all border-b border-gray-50 last:border-0 hover:bg-emerald-50 ${newDeliveryZone === zone ? 'text-emerald-600 bg-emerald-50/50' : 'text-gray-600 hover:text-emerald-600'}`}
                                                 >
                                                   {zone}
                                                 </button>
                                               ))}
                                             </motion.div>
                                           )}
                                         </AnimatePresence>
                                      </div>
                                      <div className="space-y-1.5">
                                         <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bairro</label>
                                         <input 
                                           type="text"
                                           value={newNeighborhoodName}
                                           onChange={e => setNewNeighborhoodName(e.target.value)}
                                           placeholder="Ex: Capim Macio"
                                           className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 transition-all focus:ring-4 focus:ring-orange-50 focus:border-orange-500 outline-none shadow-sm"
                                         />
                                      </div>
                                      <div className="space-y-1.5">
                                         <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Frete (R$)</label>
                                         <input 
                                           type="text"
                                           value={newCityFee}
                                           onChange={e => setNewCityFee(e.target.value)}
                                           placeholder="Ex: 5,00"
                                           className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 transition-all focus:ring-4 focus:ring-orange-50 focus:border-orange-500 outline-none shadow-sm"
                                         />
                                      </div>
                                      <div className="space-y-1.5">
                                         <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tempo Est.</label>
                                         <div className="flex flex-wrap gap-1.5 mb-2">
                                            {['15-30', '30-45', '45-60', '60-90'].map(t => (
                                              <button 
                                                key={t}
                                                type="button"
                                                onClick={() => setNewDeliveryTime(`${t} min`)}
                                                className="px-2 py-1 rounded-lg bg-gray-100 text-[9px] font-black uppercase text-gray-500 hover:bg-gray-200"
                                              >
                                                {t}m
                                              </button>
                                            ))}
                                         </div>
                                         <input 
                                           type="text"
                                           value={newDeliveryTime}
                                           onChange={e => setNewDeliveryTime(e.target.value)}
                                           placeholder="Ex: 20-30 min"
                                           className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 transition-all focus:ring-4 focus:ring-orange-50 focus:border-orange-500 outline-none shadow-sm"
                                         />
                                      </div>
                                      <div className="flex items-end">
                                         <button 
                                           onClick={handleAddDeliveryZone}
                                           className="w-full py-4 bg-neutral-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black active:scale-95 transition-all shadow-xl shadow-gray-200 cursor-pointer flex items-center justify-center gap-2"
                                         >
                                            {editingDeliveryFeeId ? <RefreshCw className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                            {editingDeliveryFeeId ? 'Atualizar' : 'Cadastrar'}
                                         </button>
                                      </div>
                                   </div>

                                   <div className="mt-10 space-y-4">
                                      <div className="flex items-center justify-between px-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Minhas Zonas Ativas ({deliveryFees.length})</p>
                                        <span className="h-px flex-1 bg-gray-100 mx-4 opacity-50"></span>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        <AnimatePresence mode="popLayout" initial={false}>
                                          {deliveryFees.length === 0 ? (
                                            <motion.div 
                                              initial={{ opacity: 0, scale: 0.9 }}
                                              animate={{ opacity: 1, scale: 1 }}
                                              exit={{ opacity: 0, scale: 0.9 }}
                                              className="sm:col-span-2 lg:col-span-3 p-12 border-2 border-dashed border-gray-100 rounded-[2.5rem] text-center"
                                            >
                                               <Truck className="w-8 h-8 mx-auto mb-3 opacity-10 text-neutral-900" />
                                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nenhuma zona cadastrada ainda</p>
                                            </motion.div>
                                          ) : (
                                            [...deliveryFees]
                                              .sort((a, b) => (a.neighborhood || '').localeCompare(b.neighborhood || ''))
                                              .map((item, idx) => (
                                              <motion.div 
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
                                                transition={{ 
                                                  type: 'spring', 
                                                  damping: 25, 
                                                  stiffness: 400,
                                                  layout: { duration: 0.3 }
                                                }}
                                                className="p-5 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/[0.03] transition-all duration-300 relative overflow-hidden"
                                              >
                                                 <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                       <span className="text-[9px] font-black text-gray-300 uppercase tracking-tighter truncate">{item.zone || item.city || 'Cidade'}</span>
                                                       <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                                                    </div>
                                                    <p className="text-xs font-black text-gray-900 uppercase tracking-tight truncate mb-1.5">{item.neighborhood}</p>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                      <div className="inline-flex items-center bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-xl font-black text-[10px] border border-emerald-100 leading-none">
                                                        Taxa: R$ {Number(item.fee).toFixed(2)}
                                                      </div>
                                                      {item.deliveryTime && (
                                                        <div className="inline-flex items-center bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-xl font-black text-[10px] border border-indigo-100 leading-none">
                                                          <Clock className="w-3 h-3 mr-1" /> {item.deliveryTime}
                                                        </div>
                                                      )}
                                                    </div>
                                                 </div>
                                                 <div className="flex items-center gap-2 shrink-0">
                                                   <button 
                                                     onClick={() => handleEditCityFee(item)} 
                                                     className="p-3 text-amber-500 bg-amber-50 hover:bg-amber-500 hover:text-white rounded-2xl transition-all duration-300 cursor-pointer shadow-sm active:scale-90 flex items-center justify-center shadow-sm"
                                                     title="Editar taxa"
                                                   >
                                                      <Edit2 className="w-4.5 h-4.5" />
                                                   </button>
                                                   <button 
                                                     onClick={() => handleRemoveCityFee(item.id, item.neighborhood)} 
                                                     className="p-3 text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-2xl transition-all duration-300 cursor-pointer shadow-sm active:scale-90 flex items-center justify-center shrink-0"
                                                     title="Excluir taxa"
                                                   >
                                                      <Trash2 className="w-4.5 h-4.5" />
                                                   </button>
                                                 </div>
                                              </motion.div>
                                            ))
                                          )}
                                        </AnimatePresence>
                                      </div>
                                   </div>
                                </div>
                            </div>
                        </div>

                        {/* BLOQUEIO DE CLIENTES FORA DE ÁREA */}
                        <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-sm space-y-4">
                          <div className="flex items-center gap-2.5">
                            <ShieldCheck className="w-5 h-5 text-rose-500 shrink-0" />
                            <div>
                              <h2 className="text-xs font-black text-gray-850 tracking-wider uppercase">
                                Bloquear Pedidos fora da Área
                              </h2>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-150">
                            <AnimatedToggle 
                              checked={blockOutsideDelivery}
                              onChange={(val) => setBlockOutsideDelivery(val)}
                            />
                            <div className="flex-1">
                              <label className="text-xs font-black text-gray-800 block">Ativar Bloqueio</label>
                              <p className="text-[10px] font-medium text-gray-500">Impedir pedidos sem taxa definida.</p>
                            </div>
                          </div>
                        </div>
                    </div>
                  )}

                  {/* STEPPED FOOTER ACTION BUTTONS */}
                  <div className="pt-6 border-t border-gray-150 flex justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setSettingsSubTab('design')}
                      className="px-5 py-3 bg-white border border-gray-250 text-gray-750 hover:bg-gray-50 active:scale-95 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      ← Anterior
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsSubTab('scheduling')}
                      className="px-5 py-3 bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      Próximo →
                    </button>
                  </div>
                </motion.div>
              )}

              {settingsSubTab === 'scheduling' && (
                <motion.div 
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="space-y-6"
                >
                  <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Agendamento de Pedidos</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Configurações de reserva antecipada</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl space-y-2">
                        <div className="flex items-center gap-3">
                          <AnimatedToggle 
                            checked={allowScheduling}
                            onChange={(val) => setAllowScheduling(val)}
                            label="Permitir Agendamentos"
                          />
                        </div>
                        <p className="text-xs text-emerald-800 font-medium">Ative esta opção para permitir que os clientes agendem pedidos para um dia específico.</p>
                      </div>

                      {allowScheduling && (
                        <div className="space-y-4 pt-2">
                          <div>
                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-tight mb-3">Data do Agendamento</h3>
                            <div className="mb-6">
                              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-1">Data Específica</label>
                              <input 
                                type="date"
                                value={schedulingDate}
                                onChange={e => setSchedulingDate(e.target.value)}
                                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white outline-none"
                              />
                              <p className="text-[10px] text-gray-400 mt-2 ml-1 font-medium">Se deixar em branco, o sistema agendará automaticamente para o "Dia Seguinte" (Amanhã).</p>
                            </div>

                            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl space-y-2 mb-6">
                              <div className="flex items-center gap-3">
                                <AnimatedToggle 
                                  checked={blockTakenSlots}
                                  onChange={(val) => setBlockTakenSlots(val)}
                                  label="Bloquear horário após selecionado"
                                />
                              </div>
                              <p className="text-xs text-indigo-800 font-medium pt-1">Ative para impedir que vários clientes escolham exatamente o mesmo horário de entrega no agendamento. Use com inteligência: se você tem flexibilidade de entrega (ex: 9h até 9:20h), você pode deixar isso desativado para receber múltiplos pedidos num mesmo horário base.</p>
                            </div>

                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-tight mb-3">Horários Disponíveis</h3>
                            <div className="flex gap-2 mb-4">
                              <input 
                                type="time"
                                value={newTimeSlot}
                                onChange={e => setNewTimeSlot(e.target.value)}
                                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white outline-none"
                              />
                              <button 
                                type="button"
                                onClick={() => {
                                  if (!newTimeSlot) return;
                                  if (customTimeSlots.includes(newTimeSlot)) {
                                    showNotification('Este horário já foi adicionado.', 'warning');
                                    return;
                                  }
                                  setCustomTimeSlots([...customTimeSlots, newTimeSlot].sort());
                                  setNewTimeSlot('');
                                }}
                                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
                              >
                                Adicionar
                              </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {customTimeSlots.length === 0 ? (
                                <div className="col-span-full p-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
                                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Nenhum horário cadastrado</p>
                                  <p className="text-[10px] text-gray-400 mt-1">Os clientes poderão escolher entre horários pré-definidos para o dia seguinte.</p>
                                </div>
                              ) : (
                                customTimeSlots.map((slot, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-emerald-300 hover:shadow-sm transition-all">
                                    <span className="text-sm font-black text-gray-800 ml-1">{slot}</span>
                                    <div className="flex items-center gap-1.5">
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          setNewTimeSlot(slot);
                                          setCustomTimeSlots(customTimeSlots.filter(s => s !== slot));
                                          // Focus the input maybe? Not strictly necessary.
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                                        title="Editar"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => setCustomTimeSlots(customTimeSlots.filter(s => s !== slot))}
                                        className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                        title="Excluir"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                          
                          {customTimeSlots.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-gray-150">
                              <h3 className="text-xs font-black text-gray-900 uppercase tracking-tight mb-3">Gerenciar Reservas do Dia</h3>
                              <p className="text-[10px] text-gray-500 font-bold mb-4">Caso o cliente tenha antecipado a retirada ou você queira bloquear um horário manualmente, controle aqui.</p>
                              
                              <div className="mb-4 flex gap-2">
                                <input 
                                  type="date" 
                                  value={reservationDate}
                                  onChange={e => setReservationDate(e.target.value)}
                                  className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold w-full max-w-[200px]"
                                />
                                <button 
                                  type="button"
                                  onClick={() => setReservationDate(new Date().toISOString().split('T')[0])}
                                  className="px-3 py-2 bg-gray-100 font-bold text-xs rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                  Hoje
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const t = new Date();
                                    t.setDate(t.getDate()+1);
                                    setReservationDate(t.toISOString().split('T')[0]);
                                  }}
                                  className="px-3 py-2 bg-gray-100 font-bold text-xs rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                  Amanhã
                                </button>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {customTimeSlots.map((slot) => {
                                   const activeOrdersForSlot = orders.filter(o => 
                                     o.scheduledDate === reservationDate && 
                                     o.scheduledTime === slot && 
                                     o.status !== 'completed' && 
                                     o.status !== 'canceled'
                                   );
                                   const isSystemBooked = activeOrdersForSlot.length > 0;
                                   const isManuallyBlocked = manualBlockedSlots[reservationDate]?.includes(slot) || false;
                                   
                                   const isOccupied = isSystemBooked || isManuallyBlocked;
                                   
                                   return (
                                     <div key={slot} className={`p-4 rounded-xl border flex flex-col gap-3 transition-colors ${isOccupied ? 'bg-rose-50/50 border-rose-200' : 'bg-emerald-50/50 border-emerald-200'}`}>
                                       <div className="flex items-center justify-between">
                                         <span className="font-black text-gray-800 text-sm">{slot}</span>
                                         <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-full ${isOccupied ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                           {isOccupied ? 'Preenchido' : 'Livre'}
                                         </span>
                                       </div>
                                       
                                       {isSystemBooked && (
                                         <div className="text-[10px] text-gray-600 bg-white/60 p-2 rounded-lg border border-gray-100">
                                            Reservado por: <span className="font-bold">{activeOrdersForSlot[0].customerName}</span>
                                            <br/>Protocolo: {activeOrdersForSlot[0].protocol.slice(-6).toUpperCase()}
                                         </div>
                                       )}

                                       <div className="flex gap-2 mt-auto pt-1">
                                         {isOccupied ? (
                                            <button 
                                              type="button"
                                              onClick={() => {
                                                if (isSystemBooked) {
                                                   // Actually they need to fulfill the order or we just cancel the booking artificially by adding it to manualBlockedSlots...
                                                   // Wait, if it's booked by system, creating a manual free slot logic is hard without setting order status.
                                                   alert('Este horário está preenchido por um pedido ativo. Para liberá-lo, mude o status do pedido correspondente para "Concluído" ou "Cancelado" na aba de Pedidos do Painel.');
                                                } else {
                                                   // Remove manual block
                                                   setManualBlockedSlots(prev => ({
                                                     ...prev,
                                                     [reservationDate]: prev[reservationDate]?.filter(s => s !== slot) || []
                                                   }));
                                                }
                                              }}
                                              className="w-full py-1.5 text-[10px] font-black uppercase text-rose-700 border border-rose-200 bg-white shadow-sm rounded-lg hover:bg-rose-50"
                                            >
                                              Marcar como Livre
                                            </button>
                                         ) : (
                                            <button 
                                              type="button"
                                              onClick={() => {
                                                 setManualBlockedSlots(prev => ({
                                                   ...prev,
                                                   [reservationDate]: [...(prev[reservationDate] || []), slot]
                                                 }));
                                              }}
                                              className="w-full py-1.5 text-[10px] font-black uppercase text-emerald-700 border border-emerald-200 bg-white shadow-sm rounded-lg hover:bg-emerald-50"
                                            >
                                              Marcar como Preenchido
                                            </button>
                                         )}
                                       </div>
                                     </div>
                                   );
                                })}
                              </div>
                            </div>
                          )}

                          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3 mt-4">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 leading-relaxed font-semibold">
                              O sistema garantirá que cada horário seja selecionado por apenas <span className="font-black">um cliente</span>. Assim que um horário for ocupado, ele desaparecerá para os demais clientes.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-150 flex justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setSettingsSubTab('logistics')}
                      className="px-5 py-3 bg-white border border-gray-250 text-gray-750 hover:bg-gray-50 active:scale-95 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      ← Anterior
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsSubTab('contact')}
                      className="px-5 py-3 bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      Próximo →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* CATEGORIA: CONTATO E REDES SOCIAIS */}
              {settingsSubTab === 'categories' && (
                <motion.div 
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="space-y-6"
                >
                  <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                      <div className="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center">
                        <Hash className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Gerenciar Categorias</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Organize seu cardápio</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="text"
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        placeholder="Nova Categoria (Ex: Bebidas)"
                        className="flex-grow px-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-800 focus:bg-white focus:ring-4 focus:ring-gray-100 focus:border-gray-900 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                      />
                      <button 
                        onClick={handleAddCategory}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg active:scale-95"
                      >
                        Adicionar
                      </button>
                    </div>

                    <div className="space-y-2">
                      {categories.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                          <p className="text-xs font-bold text-gray-400 uppercase">Nenhuma categoria cadastrada</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {categories.map((cat, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                              {editingCategory?.old === cat ? (
                                <div className="flex-1 flex gap-2 mr-2">
                                  <input 
                                    autoFocus
                                    className="flex-1 px-3 py-1.5 border border-emerald-300 rounded-lg text-sm font-bold text-gray-800 focus:outline-emerald-500 bg-emerald-50"
                                    value={editingCategory.current}
                                    onChange={(e) => setEditingCategory({ ...editingCategory, current: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && saveEditCategory()}
                                  />
                                  <button onClick={saveEditCategory} className="p-1.5 text-emerald-600 hover:text-white bg-emerald-100 hover:bg-emerald-600 rounded-lg transition-all">
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => setEditingCategory(null)} className="p-1.5 text-gray-500 hover:text-white bg-gray-100 hover:bg-gray-500 rounded-lg transition-all">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-sm font-bold text-gray-700">{cat}</span>
                                  <div className="flex gap-1">
                                    <button 
                                      onClick={() => setEditingCategory({ old: cat, current: cat })}
                                      className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                                      title="Editar"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleRemoveCategory(cat)}
                                      className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                                      title="Excluir"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-6 border-t border-gray-150 flex justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => setSettingsSubTab('scheduling')}
                        className="px-5 py-3 bg-white border border-gray-250 text-gray-750 hover:bg-gray-50 active:scale-95 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        ← Anterior
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettingsSubTab('contact')}
                        className="px-5 py-3 bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        Próximo →
                      </button>
                    </div>
                  </div>
                </motion.div>
               )}

              {settingsSubTab === 'contact' && (
                <motion.div 
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="space-y-6"
                >
                  <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Canais de Contato</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">WhatsApp e Redes Sociais</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-1.5">
                        <label className="block text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-1">WhatsApp de Pedidos (DDI+DDD+Número)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">+</span>
                          <input 
                            type="text" 
                            value={whatsappNumber}
                            onChange={e => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                            className="w-full pl-8 pr-4 py-3 bg-white border border-emerald-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-4 focus:ring-emerald-50 outline-none"
                            placeholder="5511999999999"
                          />
                        </div>
                        <p className="text-[9px] text-emerald-600/70 font-semibold px-1 italic">Este número receberá as mensagens automáticas de pedidos dos clientes.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                           <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Instagram (@usuario)</label>
                           <input 
                             type="text" 
                             value={instagramUrl.replace('https://instagram.com/', '')}
                             onChange={e => setInstagramUrl(e.target.value.startsWith('http') ? e.target.value : `https://instagram.com/${e.target.value}`)}
                             placeholder="seu.usuario"
                             className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold text-gray-800 focus:bg-white focus:ring-4 focus:ring-gray-100 outline-none"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Facebook</label>
                           <input 
                             type="text" 
                             value={facebookUrl.replace('https://facebook.com/', '')}
                             onChange={e => setFacebookUrl(e.target.value.startsWith('http') ? e.target.value : `https://facebook.com/${e.target.value}`)}
                             placeholder="suapagina"
                             className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold text-gray-800 focus:bg-white focus:ring-4 focus:ring-gray-100 outline-none"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Site / Portfólio</label>
                           <input 
                             type="url" 
                             value={websiteUrl}
                             onChange={e => setWebsiteUrl(e.target.value)}
                             placeholder="https://seusite.com"
                             className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold text-gray-800 focus:bg-white focus:ring-4 focus:ring-gray-100 outline-none"
                           />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-tight mb-2">Segurança & Salvamento</h3>
                    <button 
                      onClick={handleSaveSettings}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] cursor-pointer"
                    >
                      Salvar Todas as Configurações 🏆
                    </button>
                  </div>
                </motion.div>
              )}

              {/* COMPREHENSIVE SAVING & FINALIZATION CONTROLS */}
              <div className="pt-6 border-t border-gray-150 flex items-center justify-between gap-4 mt-8 bg-gray-50/50 p-5 rounded-2xl border border-gray-200 shadow-inner">
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Status das Alterações</p>
                  <p className="text-[11px] text-emerald-600 font-extrabold flex items-center gap-1 mt-0.5">🟢 Tudo preenchido na etapa</p>
                </div>
                
                <button 
                  onClick={handleSaveSettings}
                  className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black px-8 py-3.5 rounded-xl text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Salvar Tudo Correntemente 💾
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

        {/* SHARE TAB */}
        {activeTab === 'share' && (
          <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">Compartilhar Cardápio</h1>
            <p className="text-sm text-slate-500 mb-8">Divulgue o seu cardápio digital oficial nas redes sociais e crie plaquetas com QR Code para suas mesas físicas.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* LEFT CARD: ONLINE DIVISION */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 text-emerald-600">
                    <Share2 className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Compartilhar nas Redes Sociais</h2>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    Divulgue seu link oficial na Bio do Instagram, status do WhatsApp, Facebook ou envie diretamente aos seus clientes.
                  </p>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Link Oficial do seu Cardápio:</span>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 overflow-x-auto text-left py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-bold whitespace-nowrap scrollbar-none">
                        {(() => {
                          let publicHost = window.location.origin;
                          if (publicHost.includes('ais-dev-')) {
                            publicHost = publicHost.replace('ais-dev-', 'ais-pre-');
                          }
                          return `${publicHost}/cardapp/${settings?.storeSlug || ''}`;
                        })()}
                      </div>
                      <button 
                        onClick={() => {
                          let publicHost = window.location.origin;
                          if (publicHost.includes('ais-dev-')) {
                            publicHost = publicHost.replace('ais-dev-', 'ais-pre-');
                          }
                          const customerLink = `${publicHost}/cardapp/${settings?.storeSlug || ''}`;
                          const shareText = `✨ *${settings?.storeName.toUpperCase()}* ✨\n\nNosso cardápio digital oficial no *Cardapp* já está ativo! 📱\n\nConfira nossas delícias e peça agora pelo link:\n👉 ${customerLink}\n\nPraticidade e sabor em um clique! 😋`;
                          navigator.clipboard.writeText(shareText).then(() => {
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2000);
                          }).catch(() => {});
                        }}
                        className={`px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 flex-shrink-0 cursor-pointer ${copiedLink ? 'bg-emerald-600 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'}`}
                      >
                        {copiedLink ? 'Copiado!' : 'Copiar Link'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-left mt-6 p-4 bg-sky-50 rounded-2xl border border-sky-100 text-xs">
                  <strong className="text-sky-800 block mb-1">💡 Dica de Divulgação:</strong>
                  <p className="text-sky-700 leading-relaxed">
                    Personalize o status do seu WhatsApp com o link e anuncie para todos os contatos. Você também pode cadastrá-lo como o site oficial do seu perfil comercial!
                  </p>
                </div>
              </div>

              {/* RIGHT CARD: PHYSICAL TABLES QR CODE */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-4 text-amber-600">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">QR Code para Mesas</h2>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    Gere plaquetas exclusivas para colocar nas mesas ou balcão de atendimento do seu restaurante ou lanchonete.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
                        Identificador da Mesa (Opcional):
                      </label>
                      <input 
                        type="text"
                        value={selectedTableNumber}
                        onChange={(e) => setSelectedTableNumber(e.target.value)}
                        placeholder="Ex: 5, 02, Balcão..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-emerald-500"
                        autoComplete="off"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Ao definir a mesa, o cardápio já carregará pré-definido para essa mesa.</p>
                    </div>

                    {/* QR Code Mini-Preview */}
                    <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                      <div className="w-20 h-20 bg-white border border-slate-100 rounded-xl flex items-center justify-center p-1.5 shadow-sm overflow-hidden shrink-0">
                        {(() => {
                          let publicHost = window.location.origin;
                          if (publicHost.includes('ais-dev-')) {
                            publicHost = publicHost.replace('ais-dev-', 'ais-pre-');
                          }
                          const printLink = `${publicHost}/cardapp/${settings?.storeSlug || ''}` + (selectedTableNumber ? `?mesa=${encodeURIComponent(selectedTableNumber)}` : '');
                          const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(printLink)}`;
                          return <img src={qrImgUrl} alt="Visualização QR Code" className="w-full h-full object-contain" />;
                        })()}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-xs font-black text-slate-700 truncate">QR Code {selectedTableNumber ? `Mesa: ${selectedTableNumber}` : 'Geral'}</p>
                        <p className="text-[10px] text-slate-400 truncate mb-2">
                          {(() => {
                            let publicHost = window.location.origin;
                            if (publicHost.includes('ais-dev-')) {
                              publicHost = publicHost.replace('ais-dev-', 'ais-pre-');
                            }
                            return `${publicHost}/cardapp/${settings?.storeSlug || ''}` + (selectedTableNumber ? `?mesa=${selectedTableNumber}` : '');
                          })()}
                        </p>
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => {
                              let publicHost = window.location.origin;
                              if (publicHost.includes('ais-dev-')) {
                                publicHost = publicHost.replace('ais-dev-', 'ais-pre-');
                              }
                              const printLink = `${publicHost}/cardapp/${settings?.storeSlug || ''}` + (selectedTableNumber ? `?mesa=${encodeURIComponent(selectedTableNumber)}` : '');
                              window.open(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(printLink)}`, '_blank');
                            }}
                            className="text-[10px] border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
                          >
                            Download QR
                          </button>
                          <button 
                            type="button"
                            onClick={() => setShowPrintModal(true)}
                            className="text-[10px] bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg cursor-pointer shadow-xs transition-colors flex items-center gap-1"
                          >
                            <Printer className="w-3 h-3" /> Imprimir Card
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-left mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-xs">
                  <strong className="text-amber-800 block mb-1">📥 Plaqueta de Mesa:</strong>
                  <p className="text-amber-700 leading-relaxed">
                    Clique em <strong>Imprimir Card</strong> para visualizar o display de mesa completo com logo, QR Code e instruções de uso passo-a-passo pronto para impressão!
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TUTORIAL TAB */}
        {activeTab === 'tutorial' && (
          <div className="max-w-3xl pb-16 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-6 flex items-center gap-2">
              <HelpCircle className="w-7 h-7 text-emerald-600" />
              Dicas de Uso (Tutorial Básico)
            </h1>
            
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <h2 className="text-xl font-bold mb-2">Bem-vindo(a) ao seu Painel de Vendas!</h2>
                <p className="text-emerald-50 font-medium text-sm leading-relaxed">
                  Aqui estão as 8 principais dicas para extrair o máximo do seu sistema e alavancar suas vendas de forma organizada.
                </p>
              </div>
              
              <div className="p-6 space-y-6">
                {[
                  { title: "1. Complete suas Configurações", desc: "No menu 'Configurações', escolha o nome e cores da sua loja. Isso formará sua identidade visual." },
                  { title: "2. Gerencie o Horário de Abertura", desc: "Ainda nas configurações, você definirá o horário de atendimento. Seu catálogo fica inteligente e pausa pedidos automaticamente fora do horário." },
                  { title: "3. Cadastre e Organize Produtos", desc: "Na aba 'Produtos', clique em Novo Produto. Crie boas descrições, defina o preço, e utilize as categorias para manter tudo organizado." },
                  { title: "4. Complementos para Produtos", desc: "Se vender, por exemplo, Marmitas, adicione 'Misturas' ou 'Adicionais' criando opções para o cliente incrementar o pedido dele." },
                  { title: "5. Acompanhe os Pedidos em Tempo Real", desc: "A aba 'Pedidos' é o coração do negócio. Os pedidos novos caem lá. Atente-se ao status, marque como 'Preparando' até o 'Finalizado'." },
                  { title: "6. Receba via WhatsApp", desc: "Quando o seu cliente realiza um pedido, ele clica para confirmar e a plataforma já formata tudo em uma mensagem pronta (com CEP, troco, itens) que é enviada para o seu WhatsApp." },
                  { title: "7. Compartilhe o Link", desc: "Vá ao menu 'Compartilhar Loja' e copie seu link! Coloque ele na bio do Instagram e no perfil do seu WhatsApp Business." },
                  { title: "8. Sistema de Impressão de Comanda", desc: "Na lista de Pedidos, clique no ícone da 'Impressora'. Um cupom perfeito é gerado para você imprimir e colar na sacola de entrega, mostrando todos os dados." }
                ].map((tip, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold overflow-hidden shadow-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-800 mb-1">{tip.title}</h3>
                      <p className="text-sm text-gray-600">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
    </main>

      {/* Floating Bottom Dock Navigation (Luxury) */}
      <div className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[640px] pointer-events-none">
        <nav className="flex items-center justify-between p-2 md:p-3 bg-slate-950/80 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] pointer-events-auto shadow-black/40">
          <button onClick={() => setActiveTab('orders')} className={`flex flex-col items-center justify-center flex-1 h-12 md:h-14 rounded-2xl transition-all relative ${activeTab === 'orders' ? 'bg-white/10 text-emerald-400 font-extrabold translate-y-[-4px] shadow-lg border border-white/5' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 font-bold'}`}>
            <ShoppingBag className={`w-5 h-5 md:w-6 md:h-6 mb-1 ${activeTab === 'orders' ? 'scale-110 drop-shadow-md' : ''}`} />
            <span className="text-[9px] md:text-[10px] hidden sm:block">Pedidos</span>
            {orders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'delivery').length > 0 && (
              <span className="absolute top-1 right-1/4 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm animate-pulse border border-rose-700">
                {orders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'delivery').length}
              </span>
            )}
          </button>
          
          <button onClick={() => setActiveTab('products')} className={`flex flex-col items-center justify-center flex-1 h-12 md:h-14 rounded-2xl transition-all ${activeTab === 'products' ? 'bg-white/10 text-emerald-400 font-extrabold translate-y-[-4px] shadow-lg border border-white/5' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 font-bold'}`}>
            <Package className={`w-5 h-5 md:w-6 md:h-6 mb-1 ${activeTab === 'products' ? 'scale-110 drop-shadow-md' : ''}`} />
            <span className="text-[9px] md:text-[10px] hidden sm:block">Catálogo</span>
          </button>
          
          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center justify-center flex-1 h-12 md:h-14 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-white/10 text-emerald-400 font-extrabold translate-y-[-4px] shadow-lg border border-white/5' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 font-bold'}`}>
            <Settings className={`w-5 h-5 md:w-6 md:h-6 mb-1 ${activeTab === 'settings' ? 'scale-110 drop-shadow-md' : ''}`} />
            <span className="text-[9px] md:text-[10px] hidden sm:block">Ajustes</span>
          </button>
          
          <button onClick={() => setActiveTab('share')} className={`flex flex-col items-center justify-center flex-1 h-12 md:h-14 rounded-2xl transition-all ${activeTab === 'share' ? 'bg-white/10 text-emerald-400 font-extrabold translate-y-[-4px] shadow-lg border border-white/5' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 font-bold'}`}>
            <Share2 className={`w-5 h-5 md:w-6 md:h-6 mb-1 ${activeTab === 'share' ? 'scale-110 drop-shadow-md' : ''}`} />
            <span className="text-[9px] md:text-[10px] hidden sm:block">Link</span>
          </button>
          
          <div className="w-[1px] h-8 bg-white/10 mx-1 md:mx-2 hidden sm:block"></div>
          
          <button 
            onClick={() => {
              const newMode = !isDarkMode;
              setIsDarkMode(newMode);
              localStorage.setItem('admin_dark_mode', newMode.toString());
            }} 
            className="flex flex-col items-center justify-center flex-1 h-12 md:h-14 rounded-2xl transition-all text-slate-400 hover:text-amber-300 hover:bg-white/5 font-bold"
          >
            {isDarkMode ? <Sun className="w-5 h-5 md:w-6 md:h-6 mb-1" /> : <Moon className="w-5 h-5 md:w-6 md:h-6 mb-1" />}
            <span className="text-[9px] md:text-[10px] hidden sm:block">Tema</span>
          </button>
          
          <button onClick={() => { localStorage.removeItem('admin_token'); localStorage.removeItem('store_id'); navigate('/admin/login') }} className={`flex flex-col items-center justify-center flex-1 h-12 md:h-14 rounded-2xl transition-all text-slate-500 hover:text-rose-400 hover:bg-white/5 font-bold`}>
            <LogOut className="w-5 h-5 md:w-6 md:h-6 mb-1" />
            <span className="text-[9px] md:text-[10px] hidden sm:block">Sair</span>
          </button>
        </nav>
      </div>

    </div>

    {/* MODAL DE DELEÇÃO DE PEDIDO EM 2 ETAPAS COM ANIMAÇÃO DA LIXEIRA */}
    {orderToDelete && (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-md flex items-center justify-center p-4 print:hidden animate-in fade-in duration-200">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-150 p-6 flex flex-col relative overflow-hidden"
        >
          {/* Header Close Button */}
          <button 
            onClick={() => setOrderToDelete(null)}
            className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            {/* STAGE NUMBERS INDICATOR */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className={`h-1.5 rounded-full transition-all duration-300 ${deleteConfirmationStep === 1 ? 'w-8 bg-rose-500' : 'w-2 bg-gray-200'}`} />
              <span className={`h-1.5 rounded-full transition-all duration-300 ${deleteConfirmationStep === 2 ? 'w-8 bg-rose-500' : 'w-2 bg-gray-200'}`} />
            </div>

            <p className="text-[11px] font-black uppercase tracking-wider text-rose-500/90">
              Passo {deleteConfirmationStep} de 2
            </p>
            <h3 className="font-extrabold text-xl text-gray-900 mt-1">
              {deleteConfirmationStep === 1 ? 'Iniciar Exclusão' : 'Confirmação Crítica'}
            </h3>
          </div>

          {/* ANIMAÇÃO DA LIXEIRA */}
          <div className="flex justify-center my-6 relative min-h-[110px]">
            <motion.div 
              className="relative flex flex-col items-center justify-center pointer-events-none"
              animate={deleteConfirmationStep === 1 ? { y: [0, -2, 0] } : { y: [0, -1, 1, -1, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              {/* Lid (Tampa da Lixeira) */}
              <motion.div
                className="w-16 h-3.5 bg-rose-500 rounded-t-md relative flex justify-center border-b border-rose-600 shadow-xs"
                initial={{ rotate: 0, y: 0, x: 0 }}
                animate={
                  deleteConfirmationStep === 1 
                    ? { rotate: 0, y: 0, x: 0 } 
                    : { rotate: -35, y: -12, x: 8 }
                }
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                {/* Lid Grip (Puxador) */}
                <div className="absolute -top-1.5 w-4 h-1.5 bg-rose-600 rounded-t-xs" />
              </motion.div>

              {/* Glowing Aura when opened (Efeito brilhoso de fogo/aviso quando a tampa abre) */}
              {deleteConfirmationStep === 2 && (
                <div className="absolute w-12 h-12 bg-amber-400 rounded-full blur-lg opacity-40 animate-pulse -mt-4 animate-in" />
              )}

              {/* Body (Corpo Canelado da Lixeira) */}
              <motion.div 
                className="w-14 h-14 bg-rose-100 border border-rose-500 rounded-b-xl relative overflow-hidden flex justify-around p-1 shadow-inner mt-0.5"
                animate={
                  deleteConfirmationStep === 1 
                    ? { rotate: 0 } 
                    : { rotate: [-1, 1, -1, 1, 0] }
                }
                transition={{ repeat: deleteConfirmationStep === 2 ? Infinity : 0, duration: 0.25 }}
              >
                <div className="w-0.5 bg-rose-300 rounded-full h-full opacity-70" />
                <div className="w-0.5 bg-rose-300 rounded-full h-full opacity-70" />
                <div className="w-0.5 bg-rose-300 rounded-full h-full opacity-70" />
              </motion.div>
            </motion.div>
          </div>

          {/* STEP CONTENT CONTAINER */}
          <div className="text-center text-sm text-gray-600 space-y-3.5 px-2">
            {deleteConfirmationStep === 1 ? (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-left space-y-2 animate-in fade-in duration-300">
                <p className="font-bold text-rose-800 flex items-center gap-1.5 text-[13px]">
                   Atenção Dono / Administrador:
                </p>
                <p className="text-xs text-rose-700/90 leading-relaxed font-semibold">
                  Você está prestes a excluir o pedido de <span className="font-bold underline text-rose-950">{orderToDelete.customerName}</span>.
                </p>
                <div className="space-y-1 text-xs text-rose-650 font-medium">
                  <p>• Protocolo: <span className="font-mono text-rose-950 font-bold">{orderToDelete.protocol}</span></p>
                  <p>• Total do Pedido: <span className="font-extrabold text-rose-950">R$ {orderToDelete.totalPrice.toFixed(2)}</span></p>
                  <p>• Criado em: <span className="font-bold text-rose-950">{new Date(orderToDelete.createdAt).toLocaleString('pt-BR')}</span></p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 text-left space-y-2.5 animate-in slide-in-from-bottom-2 duration-300">
                <p className="font-bold text-amber-800 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  ⚠️ Confirmação Crítica Necessária
                </p>
                <p className="text-xs text-amber-900 leading-relaxed font-bold">
                  Esta ação é permanente e removerá de todos os registros (inclusive financeiros e relatórios da loja).
                </p>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-amber-700 block mb-1">
                    Digite "APAGAR" em letras maiúsculas abaixo:
                  </label>
                  <input
                    type="text"
                    placeholder="Digite APAGAR para prosseguir"
                    value={deleteSecondStepInput}
                    onChange={(e) => setDeleteSecondStepInput(e.target.value)}
                    className="w-full bg-white text-gray-900 font-extrabold border border-amber-300 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm focus:border-amber-400 placeholder:font-semibold placeholder:text-gray-300"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-2.5 mt-6 font-semibold text-sm">
            <button
              onClick={() => {
                setOrderToDelete(null);
                setDeleteConfirmationStep(1);
                setDeleteSecondStepInput('');
              }}
              disabled={isDeletingOrderSpinner}
              className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 active:scale-98 transition-all rounded-xl cursor-pointer text-gray-500 text-center font-bold"
            >
              Cancelar
            </button>

            {deleteConfirmationStep === 1 ? (
              <button
                onClick={() => setDeleteConfirmationStep(2)}
                className="flex-grow flex items-center justify-center gap-1 py-3 bg-rose-600 hover:bg-rose-700 text-white active:scale-98 transition-all rounded-xl cursor-pointer font-bold"
              >
                Prosseguir Passo 2
              </button>
            ) : (
              <button
                onClick={() => handleDeleteOrder(orderToDelete.id)}
                disabled={deleteSecondStepInput !== 'APAGAR' || isDeletingOrderSpinner}
                className={`flex-grow flex items-center justify-center gap-2 py-3 text-white rounded-xl font-black transition-all ${
                  deleteSecondStepInput === 'APAGAR' && !isDeletingOrderSpinner
                    ? 'bg-red-600 hover:bg-red-750 cursor-pointer active:scale-98 shadow-md'
                    : 'bg-gray-300 cursor-not-allowed opacity-60'
                }`}
              >
                {isDeletingOrderSpinner ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    Apagando...
                  </>
                ) : (
                  <>
                    <Trash className="w-4 h-4" />
                    Apagar Definitivamente
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    )}

    {/* Modal Venda Manual */}
    <AnimatePresence>
    {showManualSaleModal && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 relative"
        >
          <div className="absolute top-4 right-4">
            <button 
              onClick={() => setShowManualSaleModal(false)}
              className="p-1 hover:bg-gray-100 text-gray-400 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
            <div className="flex flex-col items-center text-center mb-8 pt-4 relative">
               {/* Sketchy Circle Doodle */}
               <div className="absolute top-0 flex items-center justify-center opacity-10 pointer-events-none">
                 <svg width="120" height="120" viewBox="0 0 100 100" className="animate-[spin_20s_linear_infinite]">
                    <motion.path
                      d="M 50,10 A 40,40 0 1,1 49.9,10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="5,3"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, ease: "linear" }}
                    />
                 </svg>
               </div>

              <motion.div 
                initial={{ rotate: -15, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
                className="w-16 h-16 rounded-3xl bg-emerald-600 text-white flex items-center justify-center mb-4 shadow-xl shadow-emerald-200 rotate-[-8deg] relative z-10"
              >
                <Banknote className="w-8 h-8" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md animate-bounce ring-4 ring-emerald-50">
                   <Plus className="w-3.5 h-3.5 text-emerald-600 font-black" />
                </div>
              </motion.div>
              
              <div className="relative">
                <h2 className="text-2xl font-black text-gray-900 tracking-tighter leading-tight uppercase relative z-10">Venda Rápida</h2>
                {/* Sketchy Underline Doodle */}
                <svg className="absolute -bottom-1 left-0 w-full h-2 text-emerald-500/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                   <motion.path 
                     d="M 0,5 Q 25,0 50,5 Q 75,10 100,5" 
                     stroke="currentColor" 
                     strokeWidth="3" 
                     fill="none"
                     initial={{ pathLength: 0 }}
                     animate={{ pathLength: 1 }}
                     transition={{ duration: 1, delay: 0.5 }}
                   />
                </svg>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-2 opacity-60">Manual & Dinâmica</p>
              </div>
            </div>
          
            <div className="space-y-5">
              <motion.div 
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: 0.2 }}
                 className="space-y-1.5"
              >
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                   <Package className="w-3.5 h-3.5 inline mr-1 opacity-50" />
                   Produto de Referência
                </label>
                <div className="relative">
                  <select
                    value={manualSaleProductId}
                    onChange={e => {
                      setManualSaleProductId(e.target.value);
                      const p = products.find(prod => prod.id === e.target.value);
                      if (p && !manualSalePrice) {
                        setManualSalePrice(String(p.price || ''));
                      }
                    }}
                    className="w-full border-gray-200 border-2 rounded-2xl px-4 py-3 text-sm bg-white transition-all focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none hover:border-gray-300 cursor-pointer appearance-none font-bold text-gray-700 shadow-xs"
                  >
                    <option value="">-- Venda Avulsa / Diversos --</option>
                    {sortedProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.isAvailable === false ? '(Indisponível)' : ''} {p.stockCount !== undefined ? `(Est: ${p.stockCount})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </motion.div>
            
            <AnimatePresence mode="wait">
            {manualSaleProductId && (
              <motion.div
                key="manual-qty-field"
                initial={{ opacity: 0, scale: 0.95, height: 0 }}
                animate={{ opacity: 1, scale: 1, height: 'auto' }}
                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="overflow-hidden"
              >
                <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <label className="block text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-1.5">Qtd. Vendida</label>
                    <input 
                      type="number"
                      min="1"
                      value={manualSaleQuantity}
                      onChange={e => {
                        const qty = Number(e.target.value || 1);
                        setManualSaleQuantity(e.target.value);
                        const p = products.find(prod => prod.id === manualSaleProductId);
                        if (p) {
                          let calculatedPrice = Number(p.price || 0) * qty;
                          if (p.promoQuantity && p.promoQuantity > 0 && p.promoPrice && qty >= p.promoQuantity) {
                             const bundles = Math.floor(qty / p.promoQuantity);
                             const remainder = qty % p.promoQuantity;
                             calculatedPrice = (bundles * Number(p.promoPrice)) + (remainder * Number(p.price || 0));
                          }
                          setManualSalePrice(String(calculatedPrice.toFixed(2)));
                        }
                      }}
                      className="w-full bg-transparent border-none text-2xl font-black text-emerald-700 outline-none p-0 focus:ring-0"
                    />
                  </div>
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-emerald-100 flex flex-col items-center justify-center">
                     <TrendingUp className="w-5 h-5 text-emerald-500 mb-0.5" />
                     <span className="text-[9px] font-black text-emerald-600 uppercase">Recalc</span>
                  </div>
                </div>
              </motion.div>
            )}
            </AnimatePresence>

            <motion.div 
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.3 }}
            >
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Observação do Registro</label>
              <input 
                type="text"
                value={manualSaleDescription}
                onChange={e => setManualSaleDescription(e.target.value)}
                placeholder={manualSaleProductId ? "Ex: Cliente fiel" : "Ex: Venda de balcão..."}
                className="w-full border-gray-200 border-2 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 transition-all focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none hover:border-gray-300 shadow-xs"
              />
            </motion.div>
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.4 }}
               className="pt-2"
            >
              <div className="bg-emerald-600 rounded-3xl p-6 shadow-xl shadow-emerald-100 flex flex-col items-center relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
                
                <label className="block text-[10px] font-black text-white/70 uppercase tracking-[0.2em] mb-3">Total Recebido</label>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-white/40 tracking-tighter">R$</span>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={manualSalePrice}
                    onChange={e => setManualSalePrice(e.target.value)}
                    className="bg-transparent border-none text-4xl font-black text-white outline-none w-32 focus:ring-0 p-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                {manualSaleProductId && (
                  <motion.div 
                    layoutId="price-badge"
                    className="mt-4 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Preço do Cadastro
                  </motion.div>
                )}
              </div>
            </motion.div>
            
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02, backgroundColor: '#000' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddManualSale}
              disabled={isRefreshing}
              className="w-full bg-gray-900 text-white py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-gray-200 transition-all mt-2 flex items-center justify-center gap-3 group cursor-pointer disabled:opacity-50"
            >
              {isRefreshing ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin text-emerald-400" />
                  Registrando...
                </>
              ) : (
                <>
                  Confirmar Registro
                  <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center group-hover:animate-bounce">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    )}
    </AnimatePresence>

    {/* EXCLUSIVO EM TELA: Modal Visual do Comprovante (Oculto ao imprimir) */}
    {orderToPrint && (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-150 flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-300">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-orange-100 rounded-lg">
                <Printer className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-800 text-sm md:text-base">Visualizar para Impressão</h3>
                <p className="text-[10px] text-gray-400 font-medium">Cupom de Pedido #{orderToPrint.protocol}</p>
              </div>
            </div>
            <button 
              onClick={() => setOrderToPrint(null)}
              className="p-1.5 hover:bg-gray-200 text-gray-400 hover:text-gray-650 rounded-lg transition-colors cursor-pointer text-xl leading-none font-bold"
            >
              &times;
            </button>
          </div>

          {/* Interactive Modal Body */}
          <div className="p-6 overflow-y-auto flex-grow bg-gray-100 flex flex-col items-center">
            <div className="mb-4 text-center">
              <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-orange-50 text-[11px] font-black tracking-wide border border-orange-200 text-orange-850">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                Estilo Bobina Térmica (80mm) ✅
              </span>
              <p className="text-[10px] text-gray-500 mt-2 max-w-xs leading-normal">
                Este layout foi otimizado para rolos de termo-impressoras de delivery ou para download em formato eletrônico (PDF).
              </p>
            </div>

            {/* Simulated Ticket Paper Preview */}
            <div className="w-[80mm] bg-white text-black p-5 border border-gray-250 rounded-lg shadow-md font-mono text-[11px] leading-relaxed select-text text-left">
              {/* Logo / Header */}
              <div className="text-center mb-4 pb-3 border-b border-dashed border-gray-300">
                {settings?.logo ? (
                  <img src={settings.logo} alt="Logo" className="w-12 h-12 object-cover rounded-full mx-auto mb-2 grayscale border border-gray-200" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2 text-gray-400 border border-gray-250">
                    <Store className="w-5 h-5" />
                  </div>
                )}
                <h4 className="font-extrabold text-sm uppercase tracking-wider">{settings?.storeName || 'MINHA LOJA'}</h4>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">COMPROVANTE DE PEDIDO</p>
                
                {orderToPrint.scheduledDate && (
                  <div className="mt-2 py-1.5 px-3 bg-rose-600 text-white rounded-lg inline-block animate-pulse">
                    <p className="text-[10px] font-black uppercase tracking-tighter">⚠️ PEDIDO AGENDADO ⚠️</p>
                    <p className="text-[8px] font-bold uppercase whitespace-nowrap">ENTREGA: {new Date(orderToPrint.scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR')} ÀS {orderToPrint.scheduledTime}</p>
                  </div>
                )}
              </div>

              {/* Protocol / Meta */}
              <div className="space-y-1 mb-4 pb-3 border-b border-dashed border-gray-300">
                <div className="flex justify-between font-bold">
                  <span>PROTOCOLO:</span>
                  <span>#{orderToPrint.protocol}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATA:</span>
                  <span>{new Date(orderToPrint.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>HORA:</span>
                  <span>{new Date(orderToPrint.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>STATUS:</span>
                  <span className="font-bold uppercase">{statusMap[orderToPrint.status]}</span>
                </div>
              </div>

              {/* Customer */}
              <div className="space-y-1 mb-4 pb-3 border-b border-dashed border-gray-300">
                <div className="font-bold text-[9px] text-gray-400 uppercase tracking-wider mb-1">DADOS DE COBRANÇA / ENVIO</div>
                <div className="font-bold">
                  CLIENTE: <span className="font-black text-gray-900">{orderToPrint.customerName.toUpperCase()}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>FORMA DE ENVIO:</span>
                  <span className="font-bold uppercase">{orderToPrint.deliveryMethod === 'delivery' ? 'ENTREGA' : 'RETIRADA DE BALCÃO'}</span>
                </div>
                {orderToPrint.deliveryMethod === 'delivery' && (
                  <div className="mt-1">
                    <span className="font-bold">ENDEREÇO:</span>
                    <div className="text-[10px] leading-tight mt-0.5 whitespace-pre-wrap pl-2 border-l border-gray-300 text-gray-700">
                      {orderToPrint.address}
                    </div>
                  </div>
                )}
              </div>

              {/* Order items list */}
              <div className="mb-4 pb-3 border-b border-dashed border-gray-300">
                <div className="font-bold text-[9px] text-gray-400 uppercase tracking-wider mb-2">ITENS DO PEDIDO</div>
                <div className="grid grid-cols-12 gap-1 font-bold text-[9px] border-b border-gray-250 pb-1 mb-1.5 text-gray-500 uppercase">
                  <span className="col-span-2 text-left">QTD</span>
                  <span className="col-span-6 text-left">DESCRIÇÃO</span>
                  <span className="col-span-4 text-right">VALOR</span>
                </div>

                <div className="space-y-1.5">
                  {orderToPrint.items.map((item, idx) => {
                    const p = products.find(prod => prod.id === item.productId);
                    let itemName = p ? p.name : 'Produto Indisponível';
                    if (Array.isArray(item.flavors) && item.flavors.length > 0) {
                      itemName += ` de ${item.flavors.join(', ')}`;
                    }
                    
                    const printInfo = getPrintAnalysis(orderToPrint);
                    const groupParams = p ? printInfo.groupsInfo.get(p.promoGroup || p.id) : null;
                    const isPromoApplied = !!(groupParams && groupParams.isPromo && groupParams.promoQuantity && groupParams.promoQuantity > 1 && groupParams.promoPrice && groupParams.totalQty >= groupParams.promoQuantity);

                    const addonsPrice = item.addons ? item.addons.reduce((sum, a) => sum + (a.price || 0), 0) : 0;
                    const baseItemPrice = p ? (p.promotion && p.promoPrice && (p.promoQuantity || 1) === 1 ? p.promoPrice : p.price) : 0;
                    const unpromotedItemTotal = (baseItemPrice + addonsPrice) * item.quantity;
                    
                    return (
                      <div key={idx} className="grid grid-cols-12 gap-1 text-[10px] items-start mb-1">
                        <span className="col-span-2 font-bold text-gray-800 text-left">{item.quantity}x</span>
                        <div className="col-span-6 leading-normal flex flex-col text-gray-700 text-left">
                          <span className="font-extrabold uppercase">{itemName}</span>
                          {isPromoApplied && (
                            <span className="text-[8px] text-emerald-600 font-black block uppercase bg-emerald-50 px-1 py-0.5 rounded mr-auto mt-0.5 border border-emerald-100">
                              PROMO: {groupParams!.promoQuantity} por R$ {Number(groupParams!.promoPrice).toFixed(2)}
                            </span>
                          )}
                          {Array.isArray(item.addons) && item.addons.map((a, i) => (
                            <span key={i} className="text-[8px] text-gray-500 font-medium">+ {a.name}</span>
                          ))}
                          {!isPromoApplied && (
                            <span className="text-[8px] text-gray-500 font-normal">R$ {(baseItemPrice + addonsPrice).toFixed(2)}</span>
                          )}
                        </div>
                        <span className="col-span-4 text-right font-bold text-gray-900">
                           {isPromoApplied ? <span className="text-gray-400 line-through text-[8px]">R$ {unpromotedItemTotal.toFixed(2)}</span> : `R$ ${unpromotedItemTotal.toFixed(2)}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary / Total block */}
              <div className="space-y-1.5 mb-4 pb-3 border-b border-dashed border-gray-300 text-[11px]">
                <div className="flex justify-between">
                  <span>FORMA PAGTO:</span>
                  <span className="font-bold uppercase text-gray-850">
                    {orderToPrint.paymentMethod === 'pix' ? 'PIX' : orderToPrint.paymentMethod === 'card' ? 'CARTÃO' : 'DINHEIRO'}
                  </span>
                </div>
                {orderToPrint.paymentMethod === 'cash' && orderToPrint.changeFor && (
                  <>
                    <div className="flex justify-between text-[10px] text-gray-600">
                      <span>TROCO SOLICITADO PARA:</span>
                      <span>R$ {Number(orderToPrint.changeFor).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-rose-700">
                      <span>VALOR DO TROCO A LEVAR:</span>
                      <span>R$ {Math.max(0, Number(orderToPrint.changeFor) - orderToPrint.totalPrice).toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-[11px] text-gray-600 pt-1 mt-1">
                  <span>SUBTOTAL:</span>
                  <span>R$ {getPrintAnalysis(orderToPrint).calculatedSubtotal.toFixed(2)}</span>
                </div>
                {orderToPrint.deliveryMethod === 'delivery' && (
                  <div className="flex justify-between text-[11px] text-gray-600">
                    <span>TAXA DE ENTREGA:</span>
                    <span>R$ {getPrintAnalysis(orderToPrint).calculatedFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm border-t border-dashed border-gray-300 pt-2.5 mt-1">
                  <span>VALOR TOTAL:</span>
                  <span className="text-base text-gray-950">R$ {orderToPrint.totalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Consumer Obs */}
              {orderToPrint.observation && (
                <div className="mb-4 p-2 bg-orange-50/50 border border-orange-100 rounded text-[9px] leading-tight text-gray-600">
                  <span className="font-bold uppercase block text-orange-850 mb-0.5">OBSERVAÇÕES DO CLIENTE:</span>
                  <p className="whitespace-pre-wrap">{orderToPrint.observation}</p>
                </div>
              )}

              {/* Ticket Footer */}
              <div className="text-center mt-3 pt-3 text-[9px] text-gray-400 border-t border-dashed border-gray-300 uppercase leading-normal font-bold">
                <p>OBRIGADO PELA PREFERÊNCIA!</p>
                <p className="text-[8px] font-normal leading-normal text-gray-400 mt-0.5">CARDAPP.APP</p>
                <p className="text-[9px] font-black text-gray-600">{settings?.storeSlug ? `cardapp.app/${settings.storeSlug}` : ''}</p>
              </div>
            </div>
          </div>

          {/* Dialog Action Buttons */}
          <div className="px-6 py-4 border-t border-gray-150 flex gap-3 bg-gray-50">
            <button
              onClick={() => setOrderToPrint(null)}
              className="flex-1 py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-sm transition-all cursor-pointer text-center"
            >
              Fechar
            </button>
            <button
              onClick={() => {
                setTimeout(() => {
                  window.print();
                }, 100);
              }}
              className="flex-1 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm shadow-orange-100"
            >
              <Printer className="w-4 h-4" />
              Imprimir / PDF
            </button>
          </div>

        </div>
      </div>
    )}

    {/* EXCLUSIVO PARA IMPRESSORA FISCAL/NÃO-FISCAL: Invisível na tela, surge apenas no window.print() */}
    {(() => {
      const ord = orderToPrint || orderToAutoPrint;
      if (!ord) return null;
      return (
      <div className="hidden print:block text-black bg-white p-0 font-mono text-[11px] leading-relaxed max-w-full w-full">
        {/* Logo / Header */}
        <div className="text-center mb-4 pb-3 border-b border-dashed border-black">
          {settings?.logo ? (
            <img src={settings.logo} alt="Logo" className="w-12 h-12 object-cover rounded-full mx-auto mb-2 grayscale" referrerPolicy="no-referrer" />
          ) : null}
          <h4 className="font-extrabold text-sm uppercase tracking-wider">{settings?.storeName || 'MINHA LOJA'}</h4>
          <p className="text-[9px] text-black uppercase tracking-widest mt-0.5 font-bold">COMPROVANTE DE PEDIDO</p>
          
          {ord.scheduledDate && (
            <div className="mt-2 py-1 px-2 border-2 border-black inline-block">
              <p className="text-[12px] font-black uppercase tracking-tighter">*** PEDIDO AGENDADO ***</p>
              <p className="text-[10px] font-bold uppercase">DATA: {new Date(ord.scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
              <p className="text-[10px] font-bold uppercase">HORA PREVISTA: {ord.scheduledTime}</p>
            </div>
          )}
        </div>

        {/* Protocol / Meta */}
        <div className="space-y-1 mb-4 pb-3 border-b border-dashed border-black">
          <div className="flex justify-between font-bold">
            <span>PROTOCOLO:</span>
            <span>#{ord.protocol}</span>
          </div>
          <div className="flex justify-between">
            <span>DATA:</span>
            <span>{new Date(ord.createdAt).toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="flex justify-between">
            <span>HORA:</span>
            <span>{new Date(ord.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex justify-between">
            <span>STATUS:</span>
            <span className="font-bold uppercase">{statusMap[ord.status]}</span>
          </div>
        </div>

        {/* Customer */}
        <div className="space-y-1 mb-4 pb-3 border-b border-dashed border-black">
          <div className="font-bold text-[9px] text-black uppercase tracking-wider mb-1">DADOS DE ENVIO / ENTREGA</div>
          <div className="font-bold">
            CLIENTE: <span className="font-black text-black">{ord.customerName.toUpperCase()}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>FORMA DE ENVIO:</span>
            <span className="font-bold uppercase">{ord.deliveryMethod === 'delivery' ? 'ENTREGA' : 'RETIRADA DE BALCÃO'}</span>
          </div>
          {ord.deliveryMethod === 'delivery' && (
            <div className="mt-1">
              <span className="font-bold">ENDEREÇO:</span>
              <div className="text-[10px] leading-tight mt-0.5 whitespace-pre-wrap pl-2 border-l border-black text-black">
                {ord.address}
              </div>
            </div>
          )}
        </div>

        {/* Order items list */}
        <div className="mb-4 pb-3 border-b border-dashed border-black">
          <div className="font-bold text-[9px] text-black uppercase tracking-wider mb-2">ITENS DO PEDIDO</div>
          <div className="grid grid-cols-12 gap-1 font-bold text-[9px] border-b border-black pb-1 mb-1.5 text-black uppercase">
            <span className="col-span-2 text-left">QTD</span>
            <span className="col-span-6 text-left">DESCRIÇÃO</span>
            <span className="col-span-4 text-right">VALOR</span>
          </div>

          <div className="space-y-1.5">
            {ord.items.map((item, idx) => {
              const p = products.find(prod => prod.id === item.productId);
              let itemName = p ? p.name : 'Produto Indisponível';
              if (Array.isArray(item.flavors) && item.flavors.length > 0) {
                itemName += ` de ${item.flavors.join(', ')}`;
              }
              
              const printInfo = getPrintAnalysis(ord);
              const groupParams = p ? printInfo.groupsInfo.get(p.promoGroup || p.id) : null;
              const isPromoApplied = !!(groupParams && groupParams.isPromo && groupParams.promoQuantity && groupParams.promoQuantity > 1 && groupParams.promoPrice && groupParams.totalQty >= groupParams.promoQuantity);

              const addonsPrice = item.addons ? item.addons.reduce((sum, a) => sum + (a.price || 0), 0) : 0;
              const baseItemPrice = p ? (p.promotion && p.promoPrice && (p.promoQuantity || 1) === 1 ? p.promoPrice : p.price) : 0;
              const unpromotedItemTotal = (baseItemPrice + addonsPrice) * item.quantity;
              
              return (
                <div key={idx} className="grid grid-cols-12 gap-1 text-[10px] items-start mb-1">
                  <span className="col-span-2 font-bold text-black text-left">{item.quantity}x</span>
                  <div className="col-span-6 leading-normal flex flex-col text-black text-left">
                    <span className="font-extrabold uppercase">{itemName}</span>
                    {isPromoApplied && (
                      <span className="text-[8px] font-black block uppercase text-black">
                        PROMO: {groupParams!.promoQuantity} por R$ {Number(groupParams!.promoPrice).toFixed(2)}
                      </span>
                    )}
                    {Array.isArray(item.addons) && item.addons.map((a, i) => (
                      <span key={i} className="text-[8px] text-black font-medium">+ {a.name}</span>
                    ))}
                    {!isPromoApplied && (
                      <span className="text-[8px] text-black font-normal font-sans">R$ {(baseItemPrice + addonsPrice).toFixed(2)}</span>
                    )}
                  </div>
                  <span className="col-span-4 text-right font-bold text-black">
                     {isPromoApplied ? <span className="line-through text-[8px] mr-1">R$ {unpromotedItemTotal.toFixed(2)}</span> : `R$ ${unpromotedItemTotal.toFixed(2)}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary / Total block */}
        <div className="space-y-1.5 mb-4 pb-3 border-b border-dashed border-black text-[11px]">
          <div className="flex justify-between">
            <span>FORMA PAGTO:</span>
            <span className="font-bold uppercase text-black">
              {ord.paymentMethod === 'pix' ? 'PIX' : ord.paymentMethod === 'card' ? 'CARTÃO' : 'DINHEIRO'}
            </span>
          </div>
          {ord.paymentMethod === 'cash' && ord.changeFor && (
            <>
              <div className="flex justify-between text-[10px] text-black">
                <span>TROCO SOLICITADO PARA:</span>
                <span>R$ {Number(ord.changeFor).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-black border-t border-dashed border-black pt-0.5">
                <span>VALOR DO TROCO A LEVAR:</span>
                <span>R$ {Math.max(0, Number(ord.changeFor) - ord.totalPrice).toFixed(2)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between font-black text-sm border-t border-dashed border-black pt-2.5 mt-2">
            <span>VALOR TOTAL:</span>
            <span className="text-base text-black font-black">R$ {ord.totalPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Consumer Obs */}
        {ord.observation && (
          <div className="mb-4 p-2.5 border border-dashed border-black rounded text-[9px] leading-tight text-black">
            <span className="font-bold uppercase block text-black mb-0.5">OBSERVAÇÕES DO CLIENTE:</span>
            <p className="whitespace-pre-wrap">{ord.observation}</p>
          </div>
        )}

        {/* Ticket Footer */}
        <div className="text-center mt-3 pt-3 text-[9px] text-black border-t border-dashed border-black uppercase leading-normal font-bold">
          <p>OBRIGADO PELA PREFERÊNCIA!</p>
          <p className="text-[8px] font-normal leading-normal text-black mt-0.5 font-sans">CARDAPP.APP</p>
          <p className="text-[9px] font-black">{settings?.storeSlug ? `cardapp.app/${settings.storeSlug}` : ''}</p>
        </div>
      </div>
      );
    })()}

    {/* Order Editing Modal */}
    {orderToEdit && (
      <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white max-w-lg w-full rounded-[40px] overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]"
        >
          <div className="p-8 pb-4 flex justify-between items-start">
            <div>
               <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Ajuste de Pedido</h2>
               <p className="text-xs font-bold text-gray-500 mt-1">Modifique valores e quantidades do pedido de {orderToEdit.customerName}</p>
            </div>
            <button onClick={() => setOrderToEdit(null)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveEditedOrder} className="flex-1 overflow-y-auto p-8 pt-4 space-y-6">
            <div className="space-y-4">
              <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100/50">
                 <label className="block text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-2 ml-1">Valor Total do Pedido (R$)</label>
                 <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-400 font-black">R$</div>
                    <input 
                      type="text"
                      className="w-full pl-11 pr-4 py-4 bg-white border-2 border-emerald-100 rounded-2xl text-2xl font-black text-emerald-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all"
                      value={newOrderTotal}
                      onChange={e => setNewOrderTotal(e.target.value)}
                    />
                 </div>
                 <p className="text-[10px] text-emerald-600 font-bold mt-2 ml-1 uppercase tracking-tight">Alteração manual direta no faturamento final.</p>
              </div>

              <div className="space-y-3">
                 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Itens do Pedido (Visualização/Edição)</label>
                 <div className="space-y-2">
                    {newOrderItems.map((item, index) => {
                      const p = products.find(prod => prod.id === item.productId);
                      return (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-gray-300 transition-all">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center font-black text-gray-900 text-sm shadow-sm group-hover:scale-110 transition-transform">
                                 {item.quantity}
                              </div>
                              <div>
                                 <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{p?.name || 'Produto'}</p>
                                 <p className="text-[10px] font-bold text-gray-400">Padrão do Sistema</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              <button 
                                type="button"
                                onClick={() => {
                                  setNewOrderItems(prev => prev.map((item, i) => 
                                    i === index && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item
                                  ));
                                }}
                                className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer shadow-xs active:scale-95"
                              >
                                -
                              </button>
                              <button 
                                type="button"
                                onClick={() => {
                                  setNewOrderItems(prev => prev.map((item, i) => 
                                    i === index ? { ...item, quantity: item.quantity + 1 } : item
                                  ));
                                }}
                                className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 transition-all cursor-pointer shadow-xs active:scale-95"
                              >
                                +
                              </button>
                           </div>
                        </div>
                      );
                    })}
                 </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 sticky bottom-0 bg-white pb-2 mt-4 border-t border-gray-50">
              <button 
                type="button"
                onClick={() => setOrderToEdit(null)}
                className="flex-1 py-4 bg-gray-50 text-gray-400 hover:text-gray-900 font-black text-xs uppercase tracking-widest rounded-3xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="flex-1 py-4 bg-gray-900 text-white hover:bg-black font-black text-xs uppercase tracking-widest rounded-3xl transition-all shadow-xl shadow-gray-200 cursor-pointer"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    )}

    {/* Custom Animated Notification Toast */}
    {notification && (
      <div className="fixed bottom-6 right-6 z-[120] animate-in slide-in-from-bottom-10 fade-in duration-300">
        <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border font-extrabold text-sm max-w-sm ${
          notification.type === 'success' 
            ? 'bg-emerald-55 border-emerald-200 text-emerald-800 bg-white/95 backdrop-blur-md'
            : 'bg-amber-55 border-amber-200 text-amber-800 bg-white/95 backdrop-blur-md'
        }`}>
          {notification.type === 'success' ? (
            <div className="bg-emerald-500 text-white p-1 rounded-full animate-bounce">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            </div>
          ) : (
            <div className="bg-amber-500 text-white p-1 rounded-full animate-pulse">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
          )}
          <span>{notification.message}</span>
        </div>
      </div>
    )}

    {/* Logo Zoom Modal */}
    {isLogoZoomed && logo && (
      <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="relative max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-gray-150 animate-in zoom-in-95 duration-200 flex flex-col items-center">
          <button 
            type="button"
            onClick={() => setIsLogoZoomed(false)} 
            className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors cursor-pointer"
            title="Fechar Visualização"
          >
            ✕
          </button>
          
          <h4 className="text-gray-800 font-extrabold text-sm uppercase tracking-wider mb-4">Logotipo Ampliado</h4>
          
          <div className="w-64 h-64 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 shadow-inner p-2">
            <img src={logo} alt="Logo Ampliada" className="max-w-full max-h-full object-contain rounded-xl hover:scale-110 transition-transform duration-300 cursor-zoom-in" title="Clique duas vezes para ampliar" />
          </div>
          
          <p className="text-[10px] text-gray-500 mt-4 uppercase tracking-widest text-center">
            Esta imagem é exibida no catálogo online e comprovante impresso.
          </p>
        </div>
      </div>
    )}

    {/* On-screen Print Preview Modal */}
    {showPrintModal && (
      <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300 no-print">
        <div className="relative max-w-lg w-full bg-white rounded-3xl p-6 shadow-2xl border border-gray-150 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
          <button 
            type="button"
            onClick={() => setShowPrintModal(false)} 
            className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-755 transition-colors cursor-pointer"
            title="Fechar"
          >
            ✕
          </button>
          
          <h2 className="text-xl font-bold text-slate-800 mb-2">Impressão de Display de Mesa</h2>
          <p className="text-xs text-slate-500 mb-4">Veja a prévia da sua plaqueta antes de imprimir. Certifique-se de configurar a impressora para o tamanho desejado (A4 ou A5).</p>
          
          {/* Scrollable preview wrapper */}
          <div className="flex-1 overflow-y-auto bg-slate-100 rounded-2xl p-4 border border-slate-200 flex justify-center mb-4">
            {/* Mock Display sheet */}
            <div className="bg-white text-black w-[350px] p-6 text-center border border-dashed border-slate-400 rounded-xl shadow-sm text-xs font-sans">
              <div className="border-y-2 border-slate-900 py-1.5 px-4 w-full uppercase tracking-wider text-[8px] font-black mb-3">
                📱 PEDIDOS VIA CELULAR 📱
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight block ml-0 mb-0">
                {settings?.storeName || 'Cardápio Digital'}
              </h3>
              <p className="text-[9px] font-bold text-slate-500 mb-3 uppercase tracking-wider">Aponte e Peça Online</p>
              
              <div className="w-12 h-12 rounded-full border border-slate-950 p-[1px] flex items-center justify-center bg-white shadow-xs overflow-hidden mx-auto my-2">
                {settings?.logo ? (
                  <img src={settings.logo} className="w-full h-full object-cover rounded-full" alt="Mini Logo" />
                ) : (
                  <div className="w-full h-full bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-xs">
                    {settings?.storeName?.substring(0, 2).toUpperCase() || 'DM'}
                  </div>
                )}
              </div>

              <div className="border border-slate-900 rounded-xl p-3 bg-white w-36 h-36 flex items-center justify-center mx-auto my-3">
                {(() => {
                  let publicHost = window.location.origin;
                  if (publicHost.includes('ais-dev-')) {
                    publicHost = publicHost.replace('ais-dev-', 'ais-pre-');
                  }
                  const printLink = `${publicHost}/cardapp/${settings?.storeSlug || ''}` + (selectedTableNumber ? `?mesa=${encodeURIComponent(selectedTableNumber)}` : '');
                  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(printLink)}`;
                  return <img src={qrImgUrl} alt="Preview QR" className="w-full h-full object-contain" />;
                })()}
              </div>

              {selectedTableNumber && (
                <div className="bg-slate-900 text-white font-black text-sm uppercase px-4 py-1.5 rounded-full inline-block mb-3">
                  Mesa {selectedTableNumber}
                </div>
              )}

              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-left max-w-[240px] mx-auto text-[9px] text-slate-705">
                <p className="font-extrabold text-slate-900 uppercase block mb-1 text-center">Como pedir:</p>
                <div className="space-y-1">
                  <p>1. Abra a câmera do celular</p>
                  <p>2. Escaneie este QR Code</p>
                  <p>3. Faça seu pedido e pague online</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button 
              type="button"
              onClick={() => setShowPrintModal(false)}
              className="px-4 py-2 border border-slate-200 text-slate-755 font-bold rounded-xl text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="button"
              onClick={() => {
                setTimeout(() => {
                  window.print();
                }, 150);
              }}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl text-xs transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Confirmar e Imprimir
            </button>
          </div>
        </div>
      </div>
    )}

    {/* PRINT ONLY STYLED CARDAPIO MESA STAND */}
    <div className="print-only hidden w-full max-w-lg mx-auto bg-white text-black p-12 text-center border-4 border-double border-slate-950 rounded-[32px] font-sans box-border" style={{ minHeight: '280mm' }}>
      <div className="flex flex-col items-center justify-between h-full py-8">
        
        {/* Header decoration */}
        <div className="w-full flex flex-col items-center">
          <div className="border-t-4 border-b-4 border-slate-950 py-3 px-8 w-full uppercase tracking-widest text-sm font-black mb-6">
            📱 PEDIDOS VIA CELULAR 📱
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-955 mb-2 uppercase">
            {settings?.storeName || 'CARDÁPIO DIGITAL'}
          </h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">
            Peça sem fila, faça seu pedido online!
          </p>
        </div>

        {/* Logo block */}
        <div className="my-8 flex justify-center">
          <div className="w-24 h-24 rounded-full border-2 border-slate-950 p-1 flex items-center justify-center bg-white shadow-sm overflow-hidden">
            {settings?.logo ? (
              <img src={settings.logo} className="w-full h-full object-cover rounded-full" alt="Logo" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-slate-950 text-white rounded-full flex items-center justify-center font-black text-xl">
                {settings?.storeName?.substring(0, 2).toUpperCase() || 'DM'}
              </div>
            )}
          </div>
        </div>

        {/* QR Code and table info */}
        <div className="flex flex-col items-center my-6">
          <div className="border-4 border-slate-950 rounded-[24px] p-6 bg-white shadow-md w-72 h-72 flex items-center justify-center">
            {(() => {
              let publicHost = window.location.origin;
              if (publicHost.includes('ais-dev-')) {
                publicHost = publicHost.replace('ais-dev-', 'ais-pre-');
              }
              const printLink = `${publicHost}/cardapp/${settings?.storeSlug || ''}` + (selectedTableNumber ? `?mesa=${encodeURIComponent(selectedTableNumber)}` : '');
              const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(printLink)}`;
              return <img src={qrImgUrl} alt="QR Code Oficial" className="w-full h-full object-contain" />;
            })()}
          </div>
          
          {selectedTableNumber && (
            <div className="mt-6 bg-slate-950 text-white font-black text-2xl uppercase tracking-widest px-8 py-3 rounded-full shadow-lg">
              Mesa {selectedTableNumber}
            </div>
          )}
        </div>

        {/* Dynamic description/footer instructions */}
        <div className="w-full mt-6">
          <div className="bg-slate-50 border border-slate-205 rounded-2xl p-6 text-left max-w-sm mx-auto">
            <h3 className="font-extrabold text-slate-950 text-sm uppercase tracking-wide mb-3 text-center">COMO FAZER O PEDIDO:</h3>
            <ul className="space-y-2 text-xs font-bold text-slate-705">
              <li className="flex gap-2 items-center">
                <span className="w-5 h-5 bg-slate-950 text-white rounded-full flex items-center justify-center text-[10px]">1</span>
                Abra a câmera do seu celular
              </li>
              <li className="flex gap-2 items-center">
                <span className="w-5 h-5 bg-slate-950 text-white rounded-full flex items-center justify-center text-[10px]">2</span>
                Aponte para o código em destaque
              </li>
              <li className="flex gap-2 items-center">
                <span className="w-5 h-5 bg-slate-950 text-white rounded-full flex items-center justify-center text-[10px]">3</span>
                Navegue pelo cardápio e peça diretamente!
              </li>
            </ul>
          </div>

          <div className="text-[10px] text-slate-500 font-mono mt-8 uppercase tracking-widest">
            Acesse também pelo navegador:<br/>
            {(() => {
              let publicHost = window.location.origin;
              if (publicHost.includes('ais-dev-')) {
                publicHost = publicHost.replace('ais-dev-', 'ais-pre-');
              }
              return `${publicHost}/cardapp/${settings?.storeSlug || ''}`;
            })()}
          </div>
        </div>

      </div>
    </div>
      </>
  );
}
