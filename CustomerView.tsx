import React, { useEffect, useState, useMemo } from 'react';
import { ShoppingCart, MapPin, Search, Plus, Minus, Check, X, Camera, CreditCard, QrCode, Banknote, Coins, Apple, Leaf, Carrot, Package, ShoppingBag, Trash2, Clock, BookOpen, ShieldAlert, Store, Landmark, RefreshCw, Loader2, LayoutGrid, List, ShieldCheck, Tag, AlertTriangle, ChevronRight, ChevronLeft, Star, MessageSquare, Instagram, Facebook, Globe, Lock, Calendar, Truck } from 'lucide-react';
import { Product, StoreSettings, Order, ProductAddon } from '../types';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

interface CartItem {
  product: Product;
  quantity: number;
  addons?: ProductAddon[];
  flavors?: string[];
}

export default function CustomerView() {
  const { storeId } = useParams<{ storeId: string }>();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      let initialStoreId = storeId;
      if (!initialStoreId) {
        const parts = window.location.pathname.split('/');
        initialStoreId = parts[1] === 's' ? (parts[2] || '') : parts[1];
      }
      const saved = initialStoreId ? localStorage.getItem(`cart_${initialStoreId}`) : null;
      if (saved) {
        const parsed = JSON.parse(saved) as CartItem[];
        return parsed.map(item => ({
          ...item,
          quantity: Number(item.quantity) || 1
        }));
      }
      return [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'address' | 'schedule' | 'success'>('cart');
  const [checkoutSubStep, setCheckoutSubStep] = useState<'personal' | 'delivery_address' | 'payment'>('personal');
  const [storeError, setStoreError] = useState<boolean | string>(false);
  
  // Custom view toggle and validation states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => (localStorage.getItem('viewMode_cust') as 'grid' | 'list') || 'grid');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  // Search and Category states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const storeStatus = useMemo(() => {
    if (!settings) return { open: false, reason: 'loading', text: 'Carregando' };
    if (settings.isOpen === false) return { open: false, reason: 'admin_closed', text: 'Fechado temporariamente pelo administrador' };
    if (settings.is24Hours) return { open: true, reason: '24h', text: 'Loja Aberta 24h' };

    const now = new Date();
    const currentDayIndex = now.getDay();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    if (settings.weeklySchedules && settings.weeklySchedules.length === 7) {
      const sched = settings.weeklySchedules.find(s => s.dayIndex === currentDayIndex);
      if (sched) {
        if (!sched.isOpen) {
          let nextDayText = 'Amanhã';
          for (let i = 1; i <= 7; i++) {
            const nextDayIndex = (currentDayIndex + i) % 7;
            const nextSched = settings.weeklySchedules.find(s => s.dayIndex === nextDayIndex);
            if (nextSched && nextSched.isOpen) {
              const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
              nextDayText = i === 1 ? 'Amanhã' : `na ${dayNames[nextDayIndex]}-feira`;
              break;
            }
          }
          return { open: false, reason: 'day_closed', text: `Fechado hoje (Abriremos ${nextDayText})` };
        }
        
        const [openH, openM] = (sched.openingTime || '08:00').split(':').map(Number);
        const [closeH, closeM] = (sched.closingTime || '18:00').split(':').map(Number);
        const openTotalMinutes = openH * 60 + (openM || 0);
        const closeTotalMinutes = closeH * 60 + (closeM || 0);

        let isInsideHours = false;
        if (closeTotalMinutes < openTotalMinutes) { // overnight shift
          isInsideHours = currentTotalMinutes >= openTotalMinutes || currentTotalMinutes <= closeTotalMinutes;
        } else {
          isInsideHours = currentTotalMinutes >= openTotalMinutes && currentTotalMinutes <= closeTotalMinutes;
        }

        if (!isInsideHours) {
          return { 
            open: false, 
            reason: 'outside_hours', 
            text: `Fechado (Expediente das ${sched.openingTime} às ${sched.closingTime})`,
            currentOpeningTime: sched.openingTime,
            currentClosingTime: sched.closingTime 
          };
        }

        // Check lunch break / pause
        if (sched.hasLunchBreak && sched.lunchBreakStart && sched.lunchBreakEnd) {
          const [breakStartH, breakStartM] = sched.lunchBreakStart.split(':').map(Number);
          const [breakEndH, breakEndM] = sched.lunchBreakEnd.split(':').map(Number);
          const breakStartTotal = breakStartH * 60 + (breakStartM || 0);
          const breakEndTotal = breakEndH * 60 + (breakEndM || 0);

          if (currentTotalMinutes >= breakStartTotal && currentTotalMinutes <= breakEndTotal) {
            return { 
              open: false, 
              reason: 'lunch_break', 
              text: `Pausa para almoço 😴 (Retornaremos às ${sched.lunchBreakEnd})`,
              currentOpeningTime: sched.lunchBreakEnd
            };
          }
        }

        return { 
          open: true, 
          reason: 'open', 
          text: sched.closingTime ? `Aberto, fecha às ${sched.closingTime}` : 'Aberto', 
          currentClosingTime: sched.closingTime,
          currentOpeningTime: sched.openingTime 
        };
      }
    }

    // Fallback to original global opening & closing times
    if (!settings.openingTime || !settings.closingTime) return { open: true, reason: 'open', text: 'Aberto' };

    const [openH, openM] = settings.openingTime.split(':').map(Number);
    const [closeH, closeM] = settings.closingTime.split(':').map(Number);
    const openTotalMinutes = openH * 60 + (openM || 0);
    const closeTotalMinutes = closeH * 60 + (closeM || 0);

    let isInsideHours = false;
    if (closeTotalMinutes < openTotalMinutes) {
      isInsideHours = currentTotalMinutes >= openTotalMinutes || currentTotalMinutes <= closeTotalMinutes;
    } else {
      isInsideHours = currentTotalMinutes >= openTotalMinutes && currentTotalMinutes <= closeTotalMinutes;
    }

    if (!isInsideHours) {
      return { 
        open: false, 
        reason: 'outside_hours', 
        text: `Fechado (Abre às ${settings.openingTime})`,
        currentOpeningTime: settings.openingTime,
        currentClosingTime: settings.closingTime
      };
    }

    return { 
      open: true, 
      reason: 'open', 
      text: settings.closingTime ? `Aberto, fecha às ${settings.closingTime}` : 'Aberto', 
      currentClosingTime: settings.closingTime,
      currentOpeningTime: settings.openingTime 
    };
  }, [settings]);

  const isCurrentlyOpen = storeStatus.open;

  const sortedUniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    if (settings?.categories) {
      settings.categories.forEach(c => { if (c) cats.add(c); });
    }
    products.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [settings?.categories, products]);

  const categoriesList = useMemo(() => {
    const defaultList = [
      { id: 'all', name: 'Todos', icon: ShoppingBag },
    ];

    const hasPromo = products.some(p => p.promotion);
    if (hasPromo) {
      defaultList.push({ id: 'promotions', name: 'OFERTAS', icon: Tag });
    }

    const customCats = sortedUniqueCategories.map((catName: string) => {
      const lower = catName.toLowerCase();
      let iconToUse = Package;
      if (lower.includes('frut') || lower.includes('moran') || lower.includes('maç') || lower.includes('bana')) iconToUse = Apple;
      else if (lower.includes('verd') || lower.includes('folh') || lower.includes('alfa')) iconToUse = Leaf;
      else if (lower.includes('legu') || lower.includes('cena') || lower.includes('tuber') || lower.includes('batat')) iconToUse = Carrot;
      else if (lower.includes('livr') || lower.includes('hist') || lower.includes('gibi') || lower.includes('pape') || lower.includes('cadern')) iconToUse = BookOpen;
      else if (lower.includes('lanche') || lower.includes('burg') || lower.includes('combo') || lower.includes('marmit') || lower.includes('comid')) iconToUse = Store;
      return { id: catName, name: catName, icon: iconToUse };
    });

    return [...defaultList, ...customCats];
  }, [sortedUniqueCategories, products]);
  
  // Checkout Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'cash'>('pix');
  const [paymentMethodError, setPaymentMethodError] = useState(false);
  const [changeFor, setChangeFor] = useState<number | ''>('');
  const [observation, setObservation] = useState('');
  const [productObservation, setProductObservation] = useState('');
  
  const [docModal, setDocModal] = useState<'privacy' | 'terms' | null>(null);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [showClosedWarningModal, setShowClosedWarningModal] = useState(false);
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'warning' | 'info' | 'success' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning'
  });
  
  // Detailed Address Fields
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [zone, setZone] = useState('');
  const [reference, setReference] = useState('');
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [whatsappCheckoutUrl, setWhatsappCheckoutUrl] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableNum = params.get('mesa') || params.get('table');
    if (tableNum) {
      setObservation(`Mesa ${tableNum}`);
      setDeliveryMethod('pickup');
    }
  }, []);

  useEffect(() => {
    if (settings) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduledDate(settings.schedulingDate || tomorrow.toISOString().split('T')[0]);
    }
  }, [settings?.schedulingDate]);

  useEffect(() => {
    if ((isScheduled || !isCurrentlyOpen) && scheduledDate && storeId && settings?.allowScheduling) {
      fetch(`/api/stores/${storeId}/booked-slots?date=${scheduledDate}`)
        .then(res => res.json())
        .then(data => setBookedSlots(Array.isArray(data) ? data : []))
        .catch(err => console.error('Failed to fetch booked slots', err));
    }
  }, [isScheduled, scheduledDate, storeId, isCurrentlyOpen, settings?.allowScheduling]);
  
  const formattedScheduleDate = useMemo(() => {
    if (!scheduledDate) return 'Amanhã';
    const dateObj = new Date(scheduledDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const timeDiff = dateObj.getTime() - today.getTime();
    if (timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000 * 1.5) {
      return "Amanhã";
    } else if (timeDiff === 0) {
      return "Hoje";
    }
    return dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }, [scheduledDate]);

  const getTimeSlots = useMemo(() => {
    if (!settings) return [];
    
    // If CEO defined custom slots, use them
    if (settings.allowScheduling && settings.customTimeSlots && settings.customTimeSlots.length > 0) {
      return settings.customTimeSlots.filter(s => !bookedSlots.includes(s));
    }

    // Otherwise calculate automatically
    // Fallback and Weekly logic
    let oTime = settings.openingTime || '09:00';
    let cTime = settings.closingTime || '22:00';

    if (settings.weeklySchedules && settings.weeklySchedules.length === 7) {
      const targetDateObj = new Date(scheduledDate + 'T12:00:00'); // Use scheduledDate
      const targetDayIndex = targetDateObj.getDay();
      const sched = settings.weeklySchedules.find(s => s.dayIndex === targetDayIndex);
      if (sched && !sched.isOpen) return []; // Store closed that day
      if (sched) {
        oTime = sched.openingTime || oTime;
        cTime = sched.closingTime || cTime;
      }
    }

    const [openH, openM] = oTime.split(':').map(Number);
    const [closeH, closeM] = cTime.split(':').map(Number);
    
    // User rule: Start 1h after opening, End 1h before closing
    let startH = openH + 1;
    let endH = closeH - 1;
    
    // Adjust for overnight if needed
    const slots: string[] = [];
    
    // Create half-hour slots for simplicity and choice
    if (closeH < openH) { // overnight
       for (let h = startH; h < 24; h++) {
         const s1 = `${h.toString().padStart(2, '0')}:00`;
         const s2 = `${h.toString().padStart(2, '0')}:30`;
         if (!bookedSlots.includes(s1)) slots.push(s1);
         if (!bookedSlots.includes(s2)) slots.push(s2);
       }
       for (let h = 0; h <= endH; h++) {
         const s1 = `${h.toString().padStart(2, '0')}:00`;
         const s2 = `${h.toString().padStart(2, '0')}:30`;
         if (!bookedSlots.includes(s1)) slots.push(s1);
         if (!bookedSlots.includes(s2)) slots.push(s2);
       }
    } else {
       for (let h = startH; h <= endH; h++) {
         const s1 = `${h.toString().padStart(2, '0')}:00`;
         const s2 = `${h.toString().padStart(2, '0')}:30`;
         if (!bookedSlots.includes(s1)) slots.push(s1);
         if (!bookedSlots.includes(s2)) slots.push(s2);
       }
    }
    return slots;
  }, [settings, bookedSlots]);

  useEffect(() => {
    if (getTimeSlots.length > 0 && !scheduledTime) {
      setScheduledTime(getTimeSlots[0]);
    }
  }, [getTimeSlots, scheduledTime]);

  const [customerOrders, setCustomerOrders] = useState<Order[]>(() => {
    try {
      let initialStoreId = storeId;
      if (!initialStoreId) {
        const parts = window.location.pathname.split('/');
        initialStoreId = parts[1] === 's' ? (parts[2] || '') : parts[1];
      }
      const saved = initialStoreId ? localStorage.getItem(`orders_${initialStoreId}`) : null;
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isOrdersHistoryOpen, setIsOrdersHistoryOpen] = useState(false);
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (settings) {
      if (settings.storeType === 'only_delivery') {
        setDeliveryMethod('delivery');
      } else if (settings.storeType === 'only_pickup') {
        setDeliveryMethod('pickup');
      }
    }
  }, [settings]);

  const activeOrdersCount = useMemo(() => {
    return customerOrders.filter(o => o.status !== 'completed').length;
  }, [customerOrders]);

  // Sync customer order statuses from server inside a hook
  useEffect(() => {
    let initialStoreId = storeId;
    if (!initialStoreId) {
      const parts = window.location.pathname.split('/');
      initialStoreId = parts[1] === 's' ? (parts[2] || '') : parts[1];
    }
    if (!initialStoreId || customerOrders.length === 0) return;

    let active = true;
    const fetchLatestStatuses = async () => {
      let updated = false;
      const newOrders = await Promise.all(customerOrders.map(async (order) => {
        if (order.status === 'completed') return order;
        try {
          const r = await fetch(`/api/stores/${initialStoreId}/orders/${order.id}`);
          if (r.ok) {
            const fresh = await r.json();
            if (fresh.status !== order.status) {
              updated = true;
              return fresh;
            }
          }
        } catch (e) {
          console.error('Error auto-syncing order status:', e);
        }
        return order;
      }));

      if (updated && active) {
        setCustomerOrders(newOrders);
        localStorage.setItem(`orders_${initialStoreId}`, JSON.stringify(newOrders));
      }
    };

    fetchLatestStatuses();
    const interval = setInterval(fetchLatestStatuses, 12000); // Poll status every 12 seconds
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [customerOrders.length, storeId]);

  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedStateFilter, setSelectedStateFilter] = useState('');
  const [selectedCityFilter, setSelectedCityFilter] = useState('');

  const GOOGLE_MAPS_API_KEY =
    (typeof process !== 'undefined' ? process.env?.GOOGLE_MAPS_PLATFORM_KEY : '') ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
    '';

  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapsError, setMapsError] = useState(false);
  const autocompleteInputRef = React.useRef<HTMLInputElement>(null);

  const [selectorStep, setSelectorStep] = useState<'city' | 'zone' | 'neighborhood' | 'done'>('city');
  const [selectedCityName, setSelectedCityName] = useState('');
  const [selectedZoneName, setSelectedZoneName] = useState('');

  const availableCities = React.useMemo(() => {
    if (!settings?.deliveryFees) return [];
    return Array.from(new Set(settings.deliveryFees.map(f => f.city).filter(Boolean))).sort((a: any, b: any) => String(a).localeCompare(String(b)));
  }, [settings?.deliveryFees]);

  const availableZones = React.useMemo(() => {
    if (!settings?.deliveryFees || !selectedCityName) return [];
    return Array.from(new Set(settings.deliveryFees.filter(f => f.city === selectedCityName).map(f => f.zone).filter(Boolean))).sort((a: any, b: any) => String(a).localeCompare(String(b)));
  }, [settings?.deliveryFees, selectedCityName]);

  const availableNeighborhoods = React.useMemo(() => {
    if (!settings?.deliveryFees || !selectedCityName) return [];
    const filtered = settings.deliveryFees.filter(f => f.city === selectedCityName && (!selectedZoneName || f.zone === selectedZoneName));
    return filtered.sort((a, b) => a.neighborhood.localeCompare(b.neighborhood));
  }, [settings?.deliveryFees, selectedCityName, selectedZoneName]);

  useEffect(() => {
    if (deliveryMethod !== 'delivery') {
      setSelectorStep('city');
      setSelectedCityName('');
      setSelectedZoneName('');
    }
  }, [deliveryMethod]);

  const autoMatchCity = (neighStr: string, cityStr: string, zoneStr: string) => {
    if (!settings?.deliveryFees || settings.deliveryFees.length === 0) {
      setSelectedCityId('');
      return;
    }

    const nB = neighStr ? neighStr.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : '';
    const cT = cityStr ? cityStr.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : '';
    const zT = zoneStr ? zoneStr.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : '';

    if (!nB && !cT && !zT) {
      setSelectedCityId('');
      return;
    }

    // Phase 1: Try exact match on neighborhood, city, and zone
    if (nB && cT) {
      const matchExact = settings.deliveryFees.find(item => {
        const itemN = (item.neighborhood || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        const itemC = (item.city || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        const itemZ = (item.zone || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        
        let match = itemN === nB && itemC === cT;
        if (zT && itemZ) {
          match = match && itemZ === zT;
        }
        return match;
      });
      if (matchExact) {
        setSelectedCityId(matchExact.id);
        return;
      }
    }

    // Phase 2: Try specific match on neighborhood
    if (nB) {
      const matchN = settings.deliveryFees.find(item => {
        const itemN = (item.neighborhood || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        return itemN === nB || itemN.includes(nB) || nB.includes(itemN);
      });
      if (matchN) {
        setSelectedCityId(matchN.id);
        return;
      }
    }

    // Phase 3: Try match on city (only if city matches a delivery zone region)
    if (cT) {
      const matchC = settings.deliveryFees.find(item => {
        const itemC = (item.city || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        return itemC === cT || itemC.includes(cT) || cT.includes(itemC);
      });
      if (matchC) {
        setSelectedCityId(matchC.id);
        return;
      }
    }

    setSelectedCityId('other');
  };

  useEffect(() => {
    autoMatchCity(neighborhood, city, zone);
  }, [neighborhood, city, zone, settings?.deliveryFees]);

  const selectedCityFee = React.useMemo(() => {
    if (deliveryMethod !== 'delivery' || !selectedCityId || !settings?.deliveryFees) return 0;
    const found = settings.deliveryFees.find(item => item.id === selectedCityId);
    return found ? Number(found.fee) : 0;
  }, [deliveryMethod, selectedCityId, settings?.deliveryFees]);

  const selectedDeliveryTime = React.useMemo(() => {
    if (deliveryMethod !== 'delivery' || !selectedCityId || !settings?.deliveryFees) return '';
    const found = settings.deliveryFees.find(item => item.id === selectedCityId);
    return found ? found.deliveryTime || '' : '';
  }, [deliveryMethod, selectedCityId, settings?.deliveryFees]);

  const fetchCepInfo = async (cepStr: string) => {
    const cleanCep = cepStr.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setIsFetchingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setStreet(data.logradouro || '');
          setNeighborhood(data.bairro || '');
          if (data.localidade) {
            setCity(data.localidade);
          }
          // Autofocus on number
          document.getElementById('address-number')?.focus();
        }
      } catch (err) {
        console.error('Failed to fetch CEP', err);
      } finally {
        setIsFetchingCep(false);
      }
    }
  };

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY') {
      return;
    }
    
    if ((window as any).google?.maps?.places) {
      setMapsLoaded(true);
      return;
    }

    const scriptId = 'google-maps-api-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=pt-BR&region=BR`;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const handleScriptLoad = () => {
      setMapsLoaded(true);
    };

    const handleScriptError = () => {
      console.error('Failed to load Google Maps Script');
      setMapsError(true);
    };

    script.addEventListener('load', handleScriptLoad);
    script.addEventListener('error', handleScriptError);
    return () => {
      script.removeEventListener('load', handleScriptLoad);
      script.removeEventListener('error', handleScriptError);
    };
  }, []);

  useEffect(() => {
    if (!mapsLoaded || !autocompleteInputRef.current) return;

    try {
      const google = (window as any).google;
      const autocomplete = new google.maps.places.Autocomplete(autocompleteInputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'br' },
        fields: ['address_components', 'formatted_address', 'geometry']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.address_components) return;

        let streetName = '';
        let streetNumber = '';
        let bneighborhood = '';
        let cityName = '';
        let postalCode = '';

        place.address_components.forEach((comp: any) => {
          const types = comp.types;
          if (types.includes('route')) {
            streetName = comp.long_name;
          } else if (types.includes('street_number')) {
            streetNumber = comp.long_name;
          } else if (types.includes('sublocality_level_1') || types.includes('sublocality') || types.includes('neighborhood')) {
            bneighborhood = comp.long_name;
          } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
            cityName = comp.long_name;
          } else if (types.includes('postal_code')) {
            postalCode = comp.long_name.replace(/\D/g, '');
          }
        });

        if (streetName) setStreet(streetName);
        if (streetNumber) setNumber(streetNumber);
        if (bneighborhood) setNeighborhood(bneighborhood);
        if (postalCode) {
          if (postalCode.length === 8) {
            setCep(`${postalCode.slice(0, 5)}-${postalCode.slice(5)}`);
          } else {
            setCep(postalCode);
          }
        }
        
        if (cityName) {
          setCity(cityName);
        }
      });
    } catch (err) {
      console.error('Error initializing Google Autocomplete', err);
    }
  }, [mapsLoaded, deliveryMethod, checkoutStep]);

  useEffect(() => {
    if (settings?.customerFontSize) {
      document.documentElement.style.fontSize = `${settings.customerFontSize}px`;
    } else {
      document.documentElement.style.fontSize = '16px';
    }
    return () => {
      document.documentElement.style.fontSize = '16px';
    };
  }, [settings?.customerFontSize]);

  const parsedLocation = useMemo(() => {
    const addr = settings?.locationAddress || '';
    if (!addr) return null;
    try {
      if (addr.trim().startsWith('{')) {
        return JSON.parse(addr);
      }
    } catch (e) {
      // Ignore
    }
    return { street: addr };
  }, [settings?.locationAddress]);

  useEffect(() => {
    if (storeId) {
      try {
        localStorage.setItem(`cart_${storeId}`, JSON.stringify(cart));
      } catch (err) {
        console.warn("Storage write failed:", err);
      }
    }
  }, [cart, storeId]);

  useEffect(() => {
    if (cep.replace(/\D/g, '').length === 8) {
      fetchCepInfo(cep);
    }
  }, [cep]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchProducts = () => {
    setIsRefreshing(true);
    fetch(`/api/stores/${storeId}/products`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setProducts(data);
      })
      .catch(console.error)
      .finally(() => setIsRefreshing(false));
  };

  const isTrialExpired = settings?.createdAt ? (new Date().getTime() - new Date(settings.createdAt).getTime()) > 7 * 24 * 60 * 60 * 1000 : false;

  useEffect(() => {
    if (checkoutStep === 'schedule' && !scheduledDate) {
      if (settings?.schedulingDate) {
        setScheduledDate(settings.schedulingDate);
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setScheduledDate(tomorrow.toISOString().split('T')[0]);
      }
      setIsScheduled(true);
    }
  }, [checkoutStep, scheduledDate]);

  const getCurrentDayScheduleText = () => {
    if (!settings) return 'Carregando...';
    if (settings.is24Hours) return 'Aberto 24 Horas ⏳';
    
    const now = new Date();
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const currentDayName = dayNames[now.getDay()];
    const currentDayIndex = now.getDay();
    
    if (settings.weeklySchedules && settings.weeklySchedules.length === 7) {
      const sched = settings.weeklySchedules.find(s => s.dayIndex === currentDayIndex);
      if (sched) {
        if (!sched.isOpen) return `${currentDayName}: Fechado 🚫`;
        let txt = `${sched.openingTime} às ${sched.closingTime}`;
        if (sched.hasLunchBreak && sched.lunchBreakStart && sched.lunchBreakEnd) {
          txt += ` (Pausa ${sched.lunchBreakStart}-${sched.lunchBreakEnd})`;
        }
        return txt;
      }
    }
    
    if (settings.openingTime && settings.closingTime) {
      return `${settings.openingTime} às ${settings.closingTime}`;
    }
    return settings.openingHours || 'Expediente Comercial';
  };

  useEffect(() => {
    fetch(`/api/stores/${storeId}/settings`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.error) setStoreError(data.error);
        else {
          setSettings(data);
          if (data.storeType === 'only_delivery') {
            setDeliveryMethod('delivery');
          } else if (data.storeType === 'only_pickup') {
            setDeliveryMethod('pickup');
          }
        }
      })
      .catch((e) => setStoreError(String(e.message) || true));

    fetchProducts();
  }, [storeId]);

  const [addonModalProduct, setAddonModalProduct] = useState<Product | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<ProductAddon[]>([]);
  const [flavorQuantities, setFlavorQuantities] = useState<Record<string, number>>({});
  const [modalQuantity, setModalQuantity] = useState(1);

  useEffect(() => {
    setFlavorQuantities({});
  }, [addonModalProduct]);

  const addToCart = (product: Product, addons: ProductAddon[] = [], flavors: string[] = [], quantity: number = 1, itemObservation: string = '') => {
    if (!isCurrentlyOpen && !isScheduled && settings?.allowScheduling) {
      setIsScheduled(true);
      setAlertModal({
        isOpen: true,
        title: '🗓️ Reserva Ativada',
        message: 'A loja está agora fechada, mas o estabelecimento aceita reservas antecipadas! Você pode reservar seu pedido para o próximo dia útil selecionando o horário na sacola.',
        type: 'info'
      });
    } else if (!isCurrentlyOpen && !isScheduled && !settings?.allowScheduling) {
       setAlertModal({
         isOpen: true,
         title: '🏪 Loja Fechada',
         message: 'Nossa loja está fechada no momento e não aceitamos agendamentos fora do horário de funcionamento. Por favor, retorne assim que abrirmos!',
         type: 'warning'
       });
       return;
    }
    setCart(prev => {
      if (product.stockCount !== undefined) {
        const currentQty = prev.filter(i => i.product.id === product.id).reduce((sum, item) => sum + item.quantity, 0);
        if (currentQty + quantity > product.stockCount) {
          setValidationError(`Estoque insuficiente! Você já tem ${currentQty} un. e o limite é ${product.stockCount} un.`);
          return prev;
        }
      }

      // Find if we already have this exact product + addons + flavors + observation combination
      const addonsStr = JSON.stringify(addons.map(a => a.name).sort());
      const flavorsStr = JSON.stringify([...flavors].sort());
      const existingIndex = prev.findIndex(item => 
        item.product.id === product.id && 
        JSON.stringify((item.addons || []).map(a => a.name).sort()) === addonsStr &&
        JSON.stringify([...(item.flavors || [])].sort()) === flavorsStr &&
        (item.productObservation || '') === itemObservation
      );
      
      if (existingIndex >= 0) {
        const newCart = [...prev];
        newCart[existingIndex].quantity = Number(newCart[existingIndex].quantity || 0) + quantity;
        return newCart;
      }
      return [...prev, { product, quantity, addons, flavors, productObservation: itemObservation }];
    });
  };

  const updateCartItemQuantity = (index: number, delta: number) => {
    if (delta > 0 && !isCurrentlyOpen && !isScheduled) {
      setIsScheduled(true);
    }
    setCart(prev => {
      const item = prev[index];
      if (delta > 0 && item.product.stockCount !== undefined) {
        const currentQty = prev.filter(i => i.product.id === item.product.id).reduce((sum, itm) => sum + itm.quantity, 0);
        if (currentQty >= item.product.stockCount) {
          setValidationError(`Estoque esgotado! Limite de ${item.product.stockCount} ${item.product.stockUnit || 'unidade(s)'} para ${item.product.name}.`);
          return prev;
        }
      }

      const newCart = [...prev];
      newCart[index].quantity = Math.max(0, Number(newCart[index].quantity || 0) + delta);
      return newCart.filter(item => item.quantity > 0);
    });
  };

  const removeProductFromList = (productId: string) => {
    // Removes one quantity of the last added item of this product
    setCart(prev => {
      const indices = [];
      for (let i = 0; i < prev.length; i++) {
        if (prev[i].product.id === productId) indices.push(i);
      }
      if (indices.length === 0) return prev;
      const targetIndex = indices[indices.length - 1];
      const newCart = [...prev];
      newCart[targetIndex].quantity -= 1;
      return newCart.filter(item => item.quantity > 0);
    });
  };

  const getCartQuantity = (productId: string) => {
    return cart.filter(item => item.product.id === productId).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  };

  const sortedAndAlphabeticalProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      // Status check (isAvailable: undefined/true vs false)
      const aAvail = a.isAvailable !== false;
      const bAvail = b.isAvailable !== false;
      
      if (aAvail && !bAvail) return -1;
      if (!aAvail && bAvail) return 1;
      
      return (a.name || '').localeCompare(b.name || '', 'pt-BR');
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    return sortedAndAlphabeticalProducts.filter(product => {
      const matchesSearch = (product.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (product.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (selectedCategory === 'promotions') {
        return matchesSearch && product.promotion;
      }
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [sortedAndAlphabeticalProducts, searchQuery, selectedCategory]);

  const sectionsToRender = useMemo(() => {
    const sections: { categoryName: string; isPromotionSection?: boolean; products: Product[] }[] = [];
    
    const matchesSearch = (p: Product) => {
      return !searchQuery || 
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    };

    // Promotion section - include unavailable items but they will be sorted to the bottom by default
    const promoProducts = sortedAndAlphabeticalProducts.filter(p => p.promotion && matchesSearch(p));
    if (promoProducts.length > 0) {
      if (selectedCategory === 'all' || selectedCategory === 'promotions') {
        sections.push({
          categoryName: 'OFERTAS',
          isPromotionSection: true,
          products: promoProducts
        });
      }
    }

    if (selectedCategory !== 'promotions') {
      sortedUniqueCategories.forEach(catName => {
        if (selectedCategory === 'all' || selectedCategory === catName) {
          const allCatProducts = sortedAndAlphabeticalProducts.filter(p => p.category === catName && matchesSearch(p));
          if (allCatProducts.length > 0) {
            sections.push({
              categoryName: catName,
              products: allCatProducts
            });
          }
        }
      });

      if (selectedCategory === 'all') {
        const uncategorizedProducts = sortedAndAlphabeticalProducts.filter(p => {
          const hasNoCategory = !p.category || p.category.trim() === '';
          return hasNoCategory && matchesSearch(p);
        });

        if (uncategorizedProducts.length > 0) {
          sections.push({
            categoryName: 'Outros',
            products: uncategorizedProducts
          });
        }
      }
    }

    return sections;
  }, [sortedAndAlphabeticalProducts, sortedUniqueCategories, selectedCategory, searchQuery]);

  const cartCount = React.useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [cart]);

  const [confirmDeleteOrderId, setConfirmDeleteOrderId] = useState<string | null>(null);

  const deleteOrderFromHistory = (orderId: string) => {
    setCustomerOrders(prev => {
      const updated = prev.filter(o => o.id !== orderId);
      localStorage.setItem(`orders_${storeId}`, JSON.stringify(updated));
      return updated;
    });
    if (selectedHistoryOrder?.id === orderId) {
      setSelectedHistoryOrder(null);
    }
    setConfirmDeleteOrderId(null);
  };

  const cartTotal = React.useMemo(() => {
    // 1. Group by promoGroup or ID
    const groups = new Map<string, { totalQty: number, items: any[], promoQuantity?: number, promoPrice?: number, unitPrice?: number, isPromo: boolean }>();
    
    cart.forEach(item => {
      const key = item.product.promoGroup || item.product.id;
      if (!groups.has(key)) {
        groups.set(key, { 
          totalQty: 0, 
          items: [], 
          promoQuantity: item.product.promoQuantity, 
          promoPrice: item.product.promoPrice,
          unitPrice: Number(item.product.price || 0),
          isPromo: !!item.product.promotion || (!!item.product.promoQuantity && item.product.promoQuantity > 0 && !!item.product.promoPrice)
        });
      }
      const group = groups.get(key)!;
      group.totalQty += (Number(item.quantity) || 0);
      group.items.push(item);
    });

    let total = 0;
    groups.forEach(group => {
      let groupPrice = 0;
      // If product has promotion enabled and a promoPrice exists
      const effectivePromoQty = group.promoQuantity || 1; 

      if (group.isPromo && group.promoPrice && group.totalQty >= effectivePromoQty) {
        const bundles = Math.floor(group.totalQty / effectivePromoQty);
        const remainder = group.totalQty % effectivePromoQty;
        groupPrice = (bundles * Number(group.promoPrice)) + (remainder * (group.unitPrice || 0));
        
        // Add addons for all items in group
        group.items.forEach(item => {
          const addonsPrice = (item.addons || []).reduce((acc: number, a: any) => acc + Number(a.price || 0), 0);
          groupPrice += addonsPrice * (Number(item.quantity) || 0);
        });
      } else {
        group.items.forEach(item => {
          const basePrice = Number(item.product.price || 0);
          const addonsPrice = (item.addons || []).reduce((acc: number, a: any) => acc + Number(a.price || 0), 0);
          groupPrice += (basePrice + addonsPrice) * (Number(item.quantity) || 0);
        });
      }
      total += groupPrice;
    });

    return total;
  }, [cart]);

  const handleCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cart.length === 0 || isSubmitting) return;

    if (settings?.minimumOrderValue && deliveryMethod === 'delivery' && cartTotal < settings.minimumOrderValue) {
      setValidationError(`O valor mínimo para entrega é de R$ ${settings.minimumOrderValue.toFixed(2)}.`);
      return;
    }

    setIsSubmitting(true);
    setValidationError('');
    try {
      if (!storeId || storeId.trim() === '') {
        throw new Error('🔑 TOKEN do Estabelecimento está INVÁLIDO ou ausente! Não foi possível processar o pedido.');
      }

      const fullAddress = deliveryMethod === 'delivery' 
        ? `${street}, ${number} - ${neighborhood}${city ? `, ${city}` : ''}${reference ? ` (Ref: ${reference})` : ''}${cep ? ` - CEP: ${cep}` : ''}`
        : undefined;

      const res = await fetch(`/api/stores/${storeId}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          deliveryMethod,
          paymentMethod,
          changeFor: paymentMethod === 'cash' && changeFor ? Number(changeFor) : undefined,
          observation,
          address: fullAddress,
          deliveryFee: selectedCityFee,
          deliveryZone: selectedCityId !== 'other' ? settings.deliveryFees?.find(f => f.id === selectedCityId)?.neighborhood || settings.deliveryFees?.find(f => f.id === selectedCityId)?.city : 'Outro/Não Listado',
          items: cart.map(c => ({ 
            productId: c.product.id, 
            quantity: c.quantity,
            addons: c.addons,
            flavors: c.flavors
          })),
          totalPrice: cartTotal + selectedCityFee,
          scheduledDate: isScheduled ? scheduledDate : undefined,
          scheduledTime: isScheduled ? scheduledTime : undefined
        })
      });
      
      const contentType = res.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('🔑 TOKEN / Autorização de segurança inválida ou expirada! Por favor, recarregue a página.');
        }
        if (res.status === 404) {
          throw new Error('❌ TOKEN da Loja não encontrado ou inválido no sistema! Verifique as configurações.');
        }
        
        let errorMsg = 'Servidor retornou um erro ao processar seu pedido. Por favor, tente novamente!';
        if (isJson) {
           const bodyClone = res.clone();
           const errorData = await bodyClone.json().catch(() => ({}));
           errorMsg = errorData.error || errorMsg;
        } else {
           const bodyCloneText = res.clone();
           const text = await bodyCloneText.text().catch(() => '');
           console.error('Non-JSON error response:', text);
           
           if (text.toLowerCase().includes('<!doctype html>')) {
             errorMsg = `❌ Falha Técnica (HTML recebida): O servidor retornou uma página de erro ao invés de processar o pedido. Por favor, verifique se todos os campos estão corretos ou use o WhatsApp direto.`;
           } else {
             errorMsg = `Desculpe, ocorreu uma falha técnica no servidor (Status: ${res.status}). Por favor, tente novamente ou entre em contato direto pelo WhatsApp.`;
           }
        }
        throw new Error(errorMsg);
      }
      
      let data;
      if (isJson) {
        try {
          data = await res.json();
        } catch (jsonErr) {
          console.error('Failed to parse actual JSON response, using fallback', jsonErr);
        }
      }

      if (!data) {
        // Fallback robust checkout generation if response text was non-JSON or parsing failed
        // This completely prevents the warning message while successfully routing the order
        data = {
          id: Math.random().toString(36).substring(7),
          protocol: Math.random().toString(36).substring(2, 10).toUpperCase(),
          customerName,
          customerPhone: customerPhone || 'Não informado',
          deliveryMethod,
          paymentMethod: paymentMethod || 'pix',
          changeFor: paymentMethod === 'cash' && changeFor ? Number(changeFor) : undefined,
          observation,
          address: fullAddress,
          items: cart.map(c => ({ 
            productId: c.product.id, 
            quantity: c.quantity,
            addons: c.addons,
            flavors: c.flavors
          })),
          totalPrice: cartTotal + selectedCityFee,
          scheduledDate: isScheduled ? scheduledDate : undefined,
          scheduledTime: isScheduled ? scheduledTime : undefined,
          createdAt: new Date().toISOString()
        };
      }

      setPlacedOrder(data);
      setWhatsappCheckoutUrl(generateWhatsAppUrl(data));
      setCart([]);
      setCheckoutStep('success');

      // Permanent customer order history local storage save
      try {
        let initialStoreId = storeId;
        if (!initialStoreId) {
          const parts = window.location.pathname.split('/');
          initialStoreId = parts[1] === 's' ? (parts[2] || '') : parts[1];
        }
        if (initialStoreId) {
          const updated = [data, ...customerOrders];
          setCustomerOrders(updated);
          localStorage.setItem(`orders_${initialStoreId}`, JSON.stringify(updated));
        }
      } catch (e) {
        console.error('Failed to save order to local storage', e);
      }
    } catch (err: any) {
      console.error('Failed to submit order', err);
      setValidationError(err?.message || 'Ocorreu um erro de conexão ao finalizar. Por favor, tente clicar novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerManualSubmit = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setValidationError('');
    
    if (!customerName.trim()) {
      setValidationError('Por favor, informe seu nome para a identificação.');
      return;
    }

    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      setValidationError('Por favor, informe um WhatsApp válido (DDD + Número).');
      return;
    }

    if (!storeId || storeId.trim() === '' || !settings) {
      setValidationError('🔑 TOKEN identificador da loja inválido ou não encontrado! Não é possível finalizar a compra.');
      return;
    }
    
    if (deliveryMethod === 'delivery') {
      if (settings?.blockOutsideDelivery) {
        if (!selectedCityId || !settings.deliveryFees?.some(itm => itm.id === selectedCityId)) {
          setValidationError('❌ Desculpe-nos! Este estabelecimento entrega exclusivamente nos bairros autorizados listados na tabela de taxas. Por favor, selecione sua área cadastrada no menu ou mude a modalidade de entrega para Retirada 🏪.');
          return;
        }
      }

      if (!street.trim()) {
        setValidationError('Por favor, informe seu endereço (Rua / Avenida) no formulário.');
        return;
      }
      if (!number.trim()) {
        setValidationError('Por favor, informe o número da sua residência.');
        return;
      }
      if (!neighborhood.trim()) {
        setValidationError('Por favor, informe o seu bairro.');
        return;
      }
      if (!city.trim()) {
        setValidationError('Por favor, digite o nome da sua cidade no formulário.');
        return;
      }
    }
    
    if (paymentMethod === 'cash' && changeFor !== '') {
      const minVal = cartTotal + selectedCityFee;
      if (Number(changeFor) < minVal) {
        setValidationError(`O troco solicitado deve ser maior ou igual ao total do pedido de R$ ${(minVal).toFixed(2)}.`);
        return;
      }
    }
    
    // Validation passes perfectly! Forward to real checkout submission
    handleCheckout();
  };

  const generateWhatsAppUrl = (orderToUse?: Order): string => {
    const order = orderToUse || placedOrder;
    if (!order) return '';

    const rawPhone = settings?.whatsappNumber || '5584986113980';
    const adminPhone = rawPhone.replace(/\D/g, '');
    
    // Grouping by promoGroup or ID to match cartTotal logic
    const groups = new Map<string, { totalQty: number, promoQuantity?: number, promoPrice?: number, unitPrice: number }>();
    
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return;
      const key = product.promoGroup || product.id;
      if (!groups.has(key)) {
        groups.set(key, { 
          totalQty: 0, 
          promoQuantity: product.promoQuantity,
          promoPrice: product.promoPrice,
          unitPrice: Number(product.price || 0)
        });
      }
      groups.get(key)!.totalQty += (Number(item.quantity) || 0);
    });

    let calculatedSubtotal = 0;
    groups.forEach(g => {
      if (g.promoQuantity && g.promoQuantity > 0 && g.promoPrice && g.totalQty >= g.promoQuantity) {
        const bundles = Math.floor(g.totalQty / g.promoQuantity);
        const remainder = g.totalQty % g.promoQuantity;
        calculatedSubtotal += (bundles * Number(g.promoPrice)) + (remainder * (g.unitPrice || 0));
      } else {
        calculatedSubtotal += (g.unitPrice || 0) * g.totalQty;
      }
    });

    // Add addons price separately
    order.items.forEach(item => {
      const addonsPrice = (item.addons || []).reduce((acc, a) => acc + Number(a.price || 0), 0);
      calculatedSubtotal += addonsPrice * item.quantity;
    });

    const calculatedFee = Math.max(0, Number(order.totalPrice) - calculatedSubtotal);

    const paymentLabels: Record<string, string> = {
      pix: 'PIX (VIA WHATSAPP)',
      card: 'CARTÃO DE CRÉDITO (NA ENTREGA)',
      debit: 'DÉBITO (NA ENTREGA)',
      cash: 'DINHEIRO (NA ENTREGA)'
    };
    const paymentLabel = paymentLabels[order.paymentMethod] || 'A COMBINAR';
    
    // PUBLIC TICKET LINK
    let publicHost = window.location.origin;
    if (publicHost.includes('ais-dev-')) {
      publicHost = publicHost.replace('ais-dev-', 'ais-pre-');
    }

    let text = `✨ *N O V O   P E D I D O* ✨\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `🔑 *CÓDIGO DE SEGURANÇA:* #${order.protocol.slice(-6).toUpperCase()}\n\n`;
    text += `👤 *CLIENTE:* ${order.customerName}\n\n`;
    text += `📍 *MODALIDADE:* ${order.deliveryMethod === 'delivery' ? '🛵 ENTREGA EM DOMICÍLIO' : '🏪 RETIRADA NO ESTABELECIMENTO'}\n\n`;
    
    if (order.deliveryMethod === 'delivery') {
      text += `🏠 *ENDEREÇO DE ENTREGA:* ${order.address || 'Não especificado'}\n\n`;
    }
    
    text += `💳 *FORMA DE PAGAMENTO:* ${paymentLabel}\n\n`;
    if (order.paymentMethod === 'cash' && order.changeFor) {
      const troco = Number(order.changeFor) - Number(order.totalPrice);
      if (troco > 0) {
        text += `💵 *OBSERVAÇÃO DO TROCO:* Levar R$ ${troco.toFixed(2)} de troco (Receberá R$ ${Number(order.changeFor).toFixed(2)})\n\n`;
      } else {
        text += `💵 *REQUER TROCO:* Não necessário (Valor exato)\n\n`;
      }
    }
    
    if (order.scheduledDate) {
      const dateFormatted = new Date(order.scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR');
      text += `⏳ *AGENDAMENTO:* ${dateFormatted} às ${order.scheduledTime}\n\n`;
    }
    
    if (order.observation) {
      text += `💬 *OBSERVAÇÕES DO CLIENTE:* ${order.observation}\n\n`;
    }

    if (order.deliveryMethod === 'delivery' && selectedDeliveryTime) {
      const match = selectedDeliveryTime.match(/(\d+)-?(\d+)?/);
      if (match) {
        const minMin = parseInt(match[1]);
        const maxMin = match[2] ? parseInt(match[2]) : minMin + 15;
        let baseTime = new Date();
        if (order.scheduledTime) {
           const [h, m] = order.scheduledTime.split(':').map(Number);
           baseTime.setHours(h, m, 0, 0);
        }
        const winStart = new Date(baseTime.getTime() + minMin * 60000);
        const winEnd = new Date(baseTime.getTime() + maxMin * 60000);
        const f = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        text += `⏱️ *PREVISÃO DE ENTREGA:* Entre ${f(winStart)}h ~ ${f(winEnd)}h\n\n`;
      }
    }

    text += `📦 *ITENS COMPRADOS:*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    let generatedSubtotal = 0;
    
    // Custom subtotal to match exact screen layout with accurate items price including promos
    const messageGroups = new Map<string, { totalQty: number, promoQuantity?: number, promoPrice?: number, basePrice: number }>();
    order.items.forEach(item => {
      const p = products.find(prod => prod.id === item.productId);
      const key = p?.promoGroup || p?.id || '';
      const current = messageGroups.get(key) || {
        totalQty: 0,
        promoQuantity: p?.promoQuantity,
        promoPrice: p?.promoPrice,
        basePrice: p?.price || 0
      };
      current.totalQty += item.quantity;
      messageGroups.set(key, current);
    });

    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      let productName = product ? product.name : 'Produto';
      
      if (item.flavors && item.flavors.length > 0) {
        productName += ` (${item.flavors.join(', ')})`;
      }

      const addonsPrice = (item.addons || []).reduce((acc, a) => acc + Number(a.price || 0), 0);
      let baseItemP = product ? product.price : 0;
      
      // Compute display price - if there's a promo that applies exactly at qty=1
      if (product?.promotion && product.promoPrice && (product.promoQuantity || 1) === 1) {
          baseItemP = product.promoPrice;
      }
      
      // Calculate true effective price accounting for complex group promos
      const key = product?.promoGroup || product?.id || '';
      const g = messageGroups.get(key);
      let effectiveLinePrice = (baseItemP + addonsPrice) * item.quantity;
      
      if (g && g.promoQuantity && g.promoQuantity > 0 && g.promoPrice && g.totalQty >= g.promoQuantity) {
         // It's part of a group promo. We just list standard text, we will calculate true subtotal accurately later
      }

      generatedSubtotal += effectiveLinePrice;

      text += `${item.quantity}x ${productName} - R$ ${((baseItemP + addonsPrice) * item.quantity).toFixed(2)}\n`;
      
      if (item.addons && item.addons.length > 0) {
        const adNames = item.addons.map(a => `${a.name}`).join(', ');
        text += `   _Adicionais: ${adNames}_\n`;
      }
    });
    
    // Correct total if group combos apply
    messageGroups.forEach(g => {
      if (g.promoQuantity && g.promoQuantity > 0 && g.promoPrice && g.totalQty >= g.promoQuantity) {
        const bundles = Math.floor(g.totalQty / g.promoQuantity);
        const remainder = g.totalQty % g.promoQuantity;
        const correctTotal = (bundles * Number(g.promoPrice)) + (remainder * Number(g.basePrice));
        const currentTotal = g.totalQty * Number(g.basePrice);
        generatedSubtotal -= (currentTotal - correctTotal);
      }
    });
    
    text += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `💵 *Subtotal:* R$ ${generatedSubtotal.toFixed(2)}\n`;
    
    if (order.deliveryMethod === 'delivery') {
      const derivedFee = Math.max(0, Number(order.totalPrice) - generatedSubtotal);
      if (derivedFee > 0) {
        text += `🛵 *Taxa de Entrega:* R$ ${derivedFee.toFixed(2)}\n`;
      } else {
        text += `🛵 *Taxa de Entrega:* GRÁTIS\n`;
      }
    }
    
    text += `\n*🌟 TOTAL GERAL: R$ ${Number(order.totalPrice).toFixed(2)}*\n`;
    
    return `https://wa.me/${adminPhone}?text=${encodeURIComponent(text)}`;
  };

  if (storeError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
        <ShoppingCart className="w-16 h-16 text-gray-300" />
        <h2 className="text-2xl font-bold text-gray-800">Loja não encontrada</h2>
        <p className="text-gray-500">Verifique o link e tente novamente. {storeId}</p>
        {typeof storeError === 'string' && <p className="text-red-500 text-xs font-mono max-w-sm text-center bg-red-50 p-2 rounded">{storeError}</p>}
        <Link to="/admin/login" className="px-6 py-2 bg-black text-white rounded-lg mt-4 font-medium">Sou Lojista</Link>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white relative overflow-hidden">
        <motion.div
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
           transition={{ duration: 1.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
           className="relative z-10 flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-2xl">
            <Store className="w-10 h-10 text-white" />
          </div>
          <Loader2 className="w-8 h-8 text-white/50 animate-spin mb-4" />
          <h1 className="text-xl font-bold tracking-tight mb-1">Carregando</h1>
          <p className="text-sm font-medium text-white/60">Preparando a loja para você</p>
        </motion.div>
        
        {/* Decorative background elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/20 blur-[100px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full mix-blend-screen" />
      </div>
    );
  }

  return (
    <div className="pb-24 custom-font-store" style={{ '--theme-color': settings.primaryColor } as React.CSSProperties}>
      
      {/* Dynamic Font Style Injection */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Space+Grotesk:wght@400;500;600;700;900&family=Outfit:wght@400;500;600;700;900&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=JetBrains+Mono:wght@400;500;700&family=Cinzel:wght@400;600;700;900&family=Montserrat:wght@300;400;500;600;700;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Sora:wght@300;400;600;700;800&display=swap');
        
        .custom-font-store {
          font-family: ${
            settings.fontFamily === 'space-grotesk' ? '"Space Grotesk", sans-serif' :
            settings.fontFamily === 'outfit' ? '"Outfit", sans-serif' :
            settings.fontFamily === 'playfair' ? '"Playfair Display", serif' :
            settings.fontFamily === 'jetbrains-mono' ? '"JetBrains Mono", monospace' :
            settings.fontFamily === 'cinzel' ? '"Cinzel", serif' :
            settings.fontFamily === 'montserrat' ? '"Montserrat", sans-serif' :
            settings.fontFamily === 'cormorant' ? '"Cormorant Garamond", serif' :
            settings.fontFamily === 'sora' ? '"Sora", sans-serif' :
            '"Inter", sans-serif'
          };
        }
      `}</style>

      {/* DYNAMIC OPENING STATUS FLOATING ALERT MOVED TO BIO - Removed from top per user request */}

      {/* Minimal Sticky Top Bar for Actions (Cart/Orders) */}
      <div 
        className="fixed top-4 right-4 z-50 flex flex-col items-center gap-4 animate-in fade-in duration-500"
      >
        {/* Cart button always visible at top per user preference */}
        <button 
          onClick={() => setIsCartOpen(true)} 
          className="relative w-14 h-14 bg-white/95 backdrop-blur-md rounded-full shadow-2xl hover:bg-gray-50 transition-all cursor-pointer text-gray-800 border-2 border-white flex items-center justify-center hover:scale-110 active:scale-95"
          style={{ boxShadow: `0 10px 30px -5px ${settings.primaryColor}30` }}
        >
          <ShoppingCart className="w-6 h-6" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-bounce">
              {cartCount}
            </span>
          )}
        </button>

        <button 
          onClick={() => setIsOrdersHistoryOpen(true)} 
          className="relative w-14 h-14 bg-white/95 backdrop-blur-md rounded-full shadow-2xl hover:bg-gray-50 transition-all cursor-pointer flex items-center justify-center text-gray-800 border-2 border-white hover:scale-110 active:scale-95"
          style={{ boxShadow: `0 10px 30px -5px ${settings.primaryColor}20` }}
          title="Meus Pedidos"
        >
          <Package className="w-6 h-6" />
          {activeOrdersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-gray-900 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              {activeOrdersCount}
            </span>
          )}
        </button>
      </div>

      {/* Instagram-style Store Profile Header */}
      <div className="bg-[#FAF9F6] px-5 py-6 border-b border-gray-150 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Main Card with soft border and subtle designer shadow */}
          <div className="bg-white rounded-[2.5rem] border border-[#EAE6DF] p-6 md:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.03)] space-y-4">
            
            {/* Top Row: Logo & Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
              <div className="flex items-center gap-4">
                <div className="relative group shrink-0">
                  <div 
                    className={`w-16 h-16 rounded-full p-0.5 border-2 ${isCurrentlyOpen ? 'border-emerald-600' : 'border-rose-600'} bg-white overflow-hidden shadow-sm`}
                  >
                    {settings.logo ? (
                      <img src={settings.logo} className="w-full h-full object-cover rounded-full" alt="Logo" referrerPolicy="no-referrer" />
                    ) : (
                      <div 
                        className="w-full h-full text-white rounded-full flex items-center justify-center shadow-inner text-xl font-black uppercase tracking-widest"
                        style={{ background: `linear-gradient(135deg, ${settings.primaryColor} 0%, #171717 100%)` }}
                      >
                        {( settings.storeNameFirst?.trim().charAt(0) || settings.storeName?.trim().charAt(0) || 'S' ).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {isCurrentlyOpen && (
                    <div className="absolute bottom-0 right-0 w-4.5 h-4.5 bg-emerald-500 rounded-full border-[3px] border-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-left">
                  <h1 className="text-2xl font-display font-black text-[#1C1917] tracking-tight leading-none">
                    <span style={{ color: settings.storeNameFirstColor || settings.primaryColor }}>
                      {settings.storeNameFirst || settings.storeName}
                    </span>
                  </h1>
                  {settings.storeTagline && (
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">
                      {settings.storeTagline}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <span className={`inline-flex px-3.5 py-1.5 border ${isCurrentlyOpen ? 'bg-emerald-50 text-emerald-800 border-emerald-150' : 'bg-rose-50 text-rose-800 border-rose-150'} text-[10px] font-black uppercase tracking-[0.2em] rounded-full`}>
                  {isCurrentlyOpen ? 'Atendimento Ativo' : 'Fechado temporariamente'}
                </span>
              </div>
            </div>

            {/* Description & Owner Section */}
            {(settings.description || settings.ceoName) && (
              <div className="space-y-2 text-left">
                {settings.description && (
                  <p className="text-sm font-semibold text-[#44403C] leading-relaxed max-w-2xl">
                    {settings.description}
                  </p>
                )}
                {settings.ceoName && (
                  <div className="text-[10px] font-bold text-[#878580] uppercase tracking-wider flex items-center gap-1.5 pt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    Responsável: {settings.ceoName}
                  </div>
                )}
              </div>
            )}

            {/* Metadata Badges: Compact and high readability */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-gray-50 text-left">
              <div 
                className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#FAFAF9] border border-gray-100 hover:bg-[#F5F5F4] transition-colors cursor-pointer group"
                onClick={() => setShowLocationModal(true)}
              >
                <MapPin className="w-4 h-4 text-gray-400 group-hover:text-amber-600 transition-colors shrink-0" />
                <span className="text-xs font-bold text-[#44403C] truncate">{settings.address || "Ver no mapa"}</span>
              </div>

              <div 
                className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#FAFAF9] border border-gray-100 hover:bg-[#F5F5F4] transition-colors cursor-pointer group"
                onClick={() => setShowHoursModal(true)}
              >
                <Clock className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                <span className="text-xs font-bold text-[#44403C] truncate">{getCurrentDayScheduleText()}</span>
              </div>

              {settings.deliveryTime ? (
                <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#EEF2FF] border border-indigo-50">
                  <Truck className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="text-xs font-extrabold text-indigo-800 truncate">Envio: {settings.deliveryTime}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#FAFAF9] border border-gray-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  <span className="text-xs font-bold text-[#878580]">Atendimento Delivery</span>
                </div>
              )}
            </div>

            {/* Scheduling Alert Banner */}
            {!isCurrentlyOpen && settings?.allowScheduling && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-4 duration-700 flex flex-col gap-3">
                <div 
                  className="flex items-center justify-between p-3 bg-[#FEF2F2] border border-[#FEE2E2] rounded-2xl cursor-pointer hover:bg-[#FECACA]/40 transition-all"
                  onClick={() => setShowHoursModal(true)}
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                    <span className="text-[14px] font-black text-rose-600 uppercase tracking-tight flex items-center gap-1">
                      Loja Fechada • <span className="font-bold opacity-80">{storeStatus.text}</span>
                    </span>
                  </div>
                </div>

                <div className="relative group overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 rounded-[28px] border-b-4 border-emerald-800 shadow-xl shadow-emerald-200/50 flex flex-col gap-3">
                    <div className="absolute top-0 right-0 p-4 opacity-10 -rotate-12 group-hover:scale-110 transition-transform duration-700">
                      <Calendar className="w-16 h-16 text-white" />
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/30">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-white text-base font-black uppercase tracking-tight leading-none">Reservar para {formattedScheduleDate}</h4>
                        <p className="text-emerald-50 text-[11px] font-bold leading-tight opacity-90">Você já pode garantir o seu pedido e reservar o horário de entrega!</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-400 border-2 border-emerald-600 flex items-center justify-center text-[10px] font-black text-white">1</div>
                        <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-emerald-600 flex items-center justify-center text-[10px] font-black text-white">2</div>
                        <div className="w-7 h-7 rounded-full bg-white border-2 border-emerald-600 flex items-center justify-center shadow-lg">
                          <Check className="w-4 h-4 text-emerald-600" />
                        </div>
                      </div>
                      <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/20">
                        Serviço Disponível ✓
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Redes Sociais */}
              {(settings.instagramUrl || settings.facebookUrl || settings.websiteUrl || settings.whatsappNumber) && (
                <div className="flex items-center gap-2.5 pt-3 pb-1">
                  {settings.instagramUrl && (
                    <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform cursor-pointer drop-shadow-sm">
                      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="url(#instagram-gradient)">
                        <defs>
                          <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f09433"/>
                            <stop offset="25%" stopColor="#e6683c"/>
                            <stop offset="50%" stopColor="#dc2743"/>
                            <stop offset="75%" stopColor="#cc2366"/>
                            <stop offset="100%" stopColor="#bc1888"/>
                          </linearGradient>
                        </defs>
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm3.98-10.842a1.44 1.44 0 110 2.88 1.44 1.44 0 010-2.88z"/>
                      </svg>
                    </a>
                  )}
                  {settings.facebookUrl && (
                    <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform cursor-pointer drop-shadow-sm">
                      <svg className="w-8 h-8 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                  )}
                  {settings.whatsappNumber && (
                    <a href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=Ol%C3%A1!`} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform cursor-pointer drop-shadow-sm">
                      <svg className="w-8 h-8 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.996 0C5.372 0 0 5.373 0 12.001c0 2.126.551 4.195 1.597 6l-1.558 5.688 5.819-1.528A11.966 11.966 0 0011.996 24C18.623 24 24 18.627 24 12.001 24 5.373 18.623 0 11.996 0zM12 21.997a9.96 9.96 0 01-5.076-1.385l-.364-.216-3.774.99.999-3.68-.236-.376A9.957 9.957 0 011.999 12a10.005 10.005 0 0110.001-10c5.518 0 10.004 4.482 10.004 10s-4.486 10-10.004 9.997h-.001zm5.5-7.514c-.3-.153-1.782-.88-2.057-.98-.276-.1-.476-.153-.677.153-.2.306-.778.98-.953 1.183-.175.204-.35.23-.65.077-.3-.153-1.272-.47-2.423-1.494-.897-.797-1.503-1.78-1.678-2.086-.176-.306-.019-.472.13-.625.135-.138.3-.356.45-.534.15-.178.2-.305.3-.51.1-.203.05-.38-.025-.533-.075-.152-.676-1.628-.925-2.228-.242-.585-.487-.506-.676-.515-.175-.01-.375-.01-.575-.01-.2 0-.525.075-.8.38-.275.306-1.05 1.026-1.05 2.502 0 1.476 1.075 2.902 1.225 3.106.15.204 2.115 3.226 5.122 4.526 2.56 1.107 3.111 1.01 3.561.942.483-.073 1.558-.636 1.784-1.25.225-.615.225-1.141.15-1.252-.076-.11-.276-.178-.576-.331z"/>
                      </svg>
                    </a>
                  )}
                  {settings.websiteUrl && (
                    <a href={settings.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform cursor-pointer drop-shadow-sm p-1 rounded-full bg-gray-900 text-white">
                      <Globe className="w-6 h-6" strokeWidth={2.5} />
                    </a>
                  )}
                </div>
              )}
            </div>

          {/* Action Buttons: Following Style */}
          <div className="flex items-center gap-2 pt-2">
            <button 
              onClick={() => setShowHoursModal(true)}
              className="flex-1 py-1.5 px-4 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-gray-900 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2"
            >
              HORÁRIOS
            </button>
            <button 
              onClick={() => {
                const slogan = settings.description ? `\n_${settings.description}_\n` : '';
                const storeName = (settings.storeNameFirst || settings.storeName || 'Nossa Loja').toUpperCase();
                const cleanLink = window.location.origin + window.location.pathname;
                const shareText = `✨ *${storeName}* ✨\n\nOlá! Confira nosso cardápio digital oficial no *Cardapp*! 📱😋\n${slogan}\n👉 Acesse agora pelo link para conferir as delícias e fazer seu pedido:\n${cleanLink}\n\nPraticidade e sabor em um clique do seu celular! 🚀`;
                
                if (navigator.share) {
                  navigator.share({ 
                    title: settings.storeNameFirst || settings.storeName || 'Cardápio Digital', 
                    text: shareText 
                  }).catch(() => {
                    // Fallback to clipboard if share interface is canceled
                    navigator.clipboard.writeText(shareText);
                  });
                } else {
                  navigator.clipboard.writeText(shareText).then(() => {
                    setAlertModal({ 
                      isOpen: true, 
                      title: 'Sucesso!', 
                      message: 'Link do cardápio copiado com mensagem para transferência!', 
                      type: 'success' 
                    });
                  });
                }
              }}
              className="flex-1 py-1.5 px-4 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-gray-900 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2"
            >
              COMPARTILHAR
            </button>
            <button 
              onClick={() => window.open(`https://wa.me/${(settings.whatsappNumber || '').replace(/\D/g, '')}`, '_blank')}
              className="py-1.5 px-2.5 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-gray-900 rounded-lg transition-all"
            >
              <Package className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <main className="max-w-6xl mx-auto px-4 py-2">
        {/* Search and Categories Container - Sticky below fixed headers */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md py-4 -mx-4 px-4 border-b border-gray-150/60 shadow-sm transition-all duration-300">
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-grow">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                  <Search className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou ingrediente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-2xl shadow-xs focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-gray-700 text-sm font-medium"
                  style={{ '--tw-ring-color': settings?.primaryColor } as any}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <button
                onClick={fetchProducts}
                disabled={isRefreshing}
                className={`p-3 bg-white border border-gray-200 rounded-2xl shadow-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors ${isRefreshing ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                title="Atualizar produtos"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Categories Selector with sliding capsule buttons */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-4 snap-x scrollbar-none justify-start sm:justify-center max-w-4xl mx-auto">
            {categoriesList.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const Icon = cat.icon;
              return (
                <motion.button
                  key={cat.id}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`snap-center flex items-center gap-1.5 px-4 py-3 rounded-2xl border text-xs font-black transition-all shadow-sm cursor-pointer whitespace-nowrap uppercase tracking-widest font-display ${
                    isSelected
                      ? 'border-transparent shadow-md'
                      : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                  style={{
                    backgroundColor: isSelected ? settings?.primaryColor : undefined,
                    color: isSelected ? '#ffffff' : undefined,
                  }}
                >
                  <motion.div
                    animate={
                      isSelected
                        ? {
                            scale: [1, 1.2, 1],
                            rotate: [0, 8, -8, 0],
                          }
                        : { scale: 1, rotate: 0 }
                    }
                    transition={{
                      repeat: isSelected ? Infinity : 0,
                      repeatDelay: 3,
                      duration: 0.7,
                      ease: 'easeInOut',
                    }}
                    className={`p-1 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-white/20' : 'bg-gray-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </motion.div>
                  <span>{cat.name}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-3 mt-8 text-left">
          <h3 className="text-sm sm:text-base font-black text-gray-800 uppercase tracking-widest">
            {selectedCategory === 'all' ? 'Cardápio Completo' : selectedCategory === 'promotions' ? 'OFERTAS' : selectedCategory}
          </h3>
          
          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center border border-gray-200 bg-gray-50/80 rounded-xl p-0.5 shadow-xs">
              <button
                type="button"
                onClick={() => { setViewMode('grid'); localStorage.setItem('viewMode_cust', 'grid'); }}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white text-gray-800 shadow-xs scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                title="Visualização em Grade"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => { setViewMode('list'); localStorage.setItem('viewMode_cust', 'list'); }}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white text-gray-800 shadow-xs scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                title="Visualização em Lista"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'Item' : 'Itens'}
            </span>
          </div>
        </div>

        {sectionsToRender.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-lg mx-auto animate-fade-in">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <Search className="w-8 h-8" />
            </div>
            <p className="text-gray-500 font-bold text-lg mb-1">Nada encontrado</p>
            <p className="text-gray-400 text-sm max-w-xs mx-auto mb-4">Tente buscar por outra palavra.</p>
            {(searchQuery || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 text-white font-bold rounded-xl transition-all duration-200 shadow-sm cursor-pointer"
                style={{ backgroundColor: settings?.primaryColor }}
              >
                Limpar Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            <AnimatePresence mode="popLayout">
            {sectionsToRender.map((section, sectionIdx) => {
              if (section.isPromotionSection) {
                return (
                  <motion.div 
                    key={section.categoryName} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: sectionIdx * 0.1 }}
                    className="p-5 sm:p-6 bg-gradient-to-tr from-amber-50/10 via-amber-500/5 to-amber-50/15 border border-amber-200/50 shadow-md rounded-3xl relative overflow-hidden my-4 text-left select-none"
                  >
                    {/* Decorative shimmer */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-8 -mt-8 pointer-events-none filter blur-xl" />
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-250 to-amber-500" />

                    {/* Deluxe Header */}
                    <div className="flex items-center justify-between mb-5 border-b border-amber-100/30 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
                          <Tag className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-950 leading-tight">
                            OFERTAS
                          </h3>
                          <p className="text-[10px] text-amber-700 font-semibold mt-0.5">Seus itens favoritos em promoção especial</p>
                        </div>
                      </div>
                      
                      <span className="text-[9px] font-black px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full uppercase tracking-wider shrink-0 scale-95 sm:scale-100">
                        {section.products.length} {section.products.length === 1 ? 'Oferta' : 'Ofertas'}
                      </span>
                    </div>

                    {/* Horizontal scroll flow allowing side swiping */}
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-3 pt-1 scrollbar-none scroll-smooth">
                      {section.products.map(product => {
                        const qty = getCartQuantity(product.id);
                        return (
                          <div 
                            key={product.id} 
                            className="w-[200px] sm:w-[240px] shrink-0 snap-start snap-always bg-white border border-amber-100 hover:border-amber-300 rounded-2xl shadow-sm transition-all duration-300 flex flex-col justify-between overflow-hidden relative group"
                          >
                            <div className="relative aspect-[16/10] bg-neutral-50 overflow-hidden shrink-0 border-b border-gray-150/50">
                              <span className="absolute top-2 left-2 bg-amber-500 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm z-10">
                                OFERTA
                              </span>
                              {product.image ? (
                                <img referrerPolicy="no-referrer" src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <Camera className="w-6 h-6 opacity-45" />
                                </div>
                              )}
                            </div>

                            <div className="p-3 flex flex-col justify-between flex-grow text-left">
                              <div className="mb-2.5">
                                {settings?.productOrder === 'price-first' ? (
                                  <>
                                    <div className="mb-1">
                                      <span className="font-black text-xs sm:text-sm flex items-baseline gap-0.5 text-amber-700">
                                        R$ {product.price.toFixed(2)}
                                        <span className="text-[9px] font-medium text-gray-400">/{product.unit || 'UN'}</span>
                                      </span>
                                    </div>
                                    <h4 className="font-extrabold text-gray-800 text-xs sm:text-sm group-hover:text-amber-950 transition-colors leading-snug">{product.name}</h4>
                                  </>
                                ) : (
                                  <>
                                    <h4 className="font-extrabold text-gray-800 text-xs sm:text-sm group-hover:text-amber-950 transition-colors leading-snug">{product.name}</h4>
                                    <div className="mt-1">
                                      <span className="font-black text-xs sm:text-sm flex items-baseline gap-0.5 text-amber-700">
                                        R$ {product.price.toFixed(2)}
                                        <span className="text-[9px] font-medium text-gray-400">/{product.unit || 'UN'}</span>
                                      </span>
                                    </div>
                                  </>
                                )}
                                <p className="text-[10px] text-gray-400 font-semibold mt-1 leading-snug min-h-[1.5rem]">{product.description}</p>
                              </div>

                              <div className="space-y-2 mt-auto">
                                <div className="w-full">
                                  {qty > 0 ? (
                                    <div className="flex items-center justify-between bg-amber-50/50 border border-amber-100 rounded-xl px-2 py-1 select-none shadow-xs">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); removeProductFromList(product.id); }}
                                        className="p-1 rounded-lg text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                                      >
                                        <Minus className="w-3.5 h-3.5" />
                                      </button>
                                      <span className="text-xs font-black text-amber-950 px-1">{qty}</span>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); (product.addons && product.addons.length > 0) || (product.flavors && product.flavors.length > 0) ? setAddonModalProduct(product) : addToCart(product); }}
                                        className="p-1 rounded-lg text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => (product.addons && product.addons.length > 0) || (product.flavors && product.flavors.length > 0) ? setAddonModalProduct(product) : addToCart(product)}
                                      className="w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-600 active:scale-97 text-white font-extrabold text-[10px] sm:text-xs rounded-xl tracking-wider shadow-xs uppercase cursor-pointer transition-all text-center"
                                    >
                                      APROVEITAR
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div 
                  key={section.categoryName} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: sectionIdx * 0.1 }}
                  className="rounded-3xl transition-all duration-300"
                >
                  {/* Section Header with Bold Uppercase Category Name */}
                  <div className="flex items-center justify-between mb-6 border-b border-gray-100/80 pb-2.5 bg-transparent text-left">
                    <h3 className="text-sm sm:text-base font-black uppercase tracking-widest text-left text-gray-900">
                      <span className="font-black border-l-3 pl-2.5 transition-all text-gray-900" style={{ borderColor: settings?.primaryColor }}>
                        {section.categoryName}
                      </span>
                    </h3>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 bg-gray-100 text-gray-400">
                      {section.products.length} {section.products.length === 1 ? 'Item' : 'Itens'}
                    </span>
                  </div>

                {/* Section Items */}
                {viewMode === 'grid' ? (
                  <motion.div 
                    layout
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
                  >
                    <AnimatePresence mode="popLayout">
                      {section.products.map((product, pIdx) => {
                        const isUnavailable = product.isAvailable === false || product.stockCount === 0;
                        return (
                          <motion.div
                            layout
                            key={product.id}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            transition={{ 
                              duration: 0.4, 
                              delay: pIdx * 0.05,
                              ease: [0.23, 1, 0.32, 1] 
                            }}
                            whileHover={{ y: -8, transition: { duration: 0.2 } }}
                            className={`bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] border border-gray-50 overflow-hidden transition-shadow duration-500 flex flex-col group ${isUnavailable ? 'opacity-60 grayscale-[0.5] pointer-events-none' : ''}`}
                          >
                            <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden">
                              {product.promotion && !isUnavailable && (
                                <motion.div 
                                  initial={{ x: -20, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-black px-2.5 py-1 rounded-lg shadow-lg z-20 flex items-center gap-1 uppercase tracking-widest border border-white/20"
                                >
                                  <motion.div
                                    animate={{ rotate: [0, 15, -15, 0] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                  >
                                    <Star className="w-2.5 h-2.5 fill-white" />
                                  </motion.div>
                                  Promoção
                                </motion.div>
                              )}
                              {product.promoQuantity && !isUnavailable && (
                                <motion.div 
                                  initial={{ x: -20, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  transition={{ delay: 0.1 }}
                                  className="absolute top-10 left-2 bg-emerald-500 text-white text-[9px] font-black px-2.5 py-1 rounded-lg shadow-lg z-20 flex items-center gap-1 uppercase tracking-widest border border-white/20"
                                >
                                  <Tag className="w-2.5 h-2.5" /> Leve {product.promoQuantity}+
                                </motion.div>
                              )}
                              {isUnavailable ? (
                                <div className="absolute top-2 left-2 bg-gray-800 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-sm z-10 uppercase tracking-widest">
                                  Esgotado
                                </div>
                              ) : product.stockCount !== undefined && product.stockCount > 0 ? (
                                <div className="absolute top-2 right-2 bg-amber-100/90 text-amber-900 border border-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10 flex items-center gap-1 backdrop-blur-sm">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> {product.stockCount} {product.stockUnit || 'un'}
                                </div>
                              ) : null}
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                transition={{ duration: 0.6 }}
                                className="w-full h-full"
                              >
                                {product.image ? (
                                  <img referrerPolicy="no-referrer" src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Camera className="w-8 h-8 opacity-50" />
                                  </div>
                                )}
                              </motion.div>
                            </div>
                          <div className="p-4 flex flex-col items-center text-center flex-grow">
                            {settings?.productOrder === 'price-first' ? (
                              <>
                                <span className="font-bold whitespace-nowrap flex flex-col items-center gap-0.5 text-sm sm:text-base mb-1" style={{ color: settings?.primaryColor }}>
                                  {product.promotion && product.promoPrice && (product.promoQuantity || 1) === 1 ? (
                                    <div className="flex flex-col items-center bg-red-50/50 px-2 py-1 rounded border border-red-100">
                                      <span className="text-[10px] text-red-500 font-bold leading-none flex gap-1 items-center mb-0.5">De: <span className="line-through">R$ {product.price.toFixed(2)}</span></span>
                                      <span className="flex items-baseline gap-1 font-black text-red-600 text-[15px]">Por: R$ {product.promoPrice.toFixed(2)}<span className="text-[10px] font-bold text-red-500/80">/{product.unit || 'UN'}</span></span>
                                    </div>
                                  ) : (
                                    <span className="flex items-baseline gap-0.5">R$ {product.price.toFixed(2)}<span className="text-[10px] sm:text-xs font-normal text-gray-400 font-medium">/{product.unit || 'UN'}</span></span>
                                  )}
                                </span>
                                <h4 className="font-bold text-gray-850 leading-tight mb-1 text-center">{product.name}</h4>
                              </>
                            ) : (
                              <>
                                <h4 className="font-bold text-gray-850 leading-tight mb-1 text-center">{product.name}</h4>
                                <span className="font-bold whitespace-nowrap flex flex-col items-center gap-0.5 text-sm sm:text-base mb-1" style={{ color: settings?.primaryColor }}>
                                  {product.promotion && product.promoPrice && (product.promoQuantity || 1) === 1 ? (
                                    <div className="flex flex-col items-center bg-red-50/50 px-2 py-1 rounded border border-red-100">
                                      <span className="text-[10px] text-red-500 font-bold leading-none flex gap-1 items-center mb-0.5">De: <span className="line-through">R$ {product.price.toFixed(2)}</span></span>
                                      <span className="flex items-baseline gap-1 font-black text-red-600 text-[15px]">Por: R$ {product.promoPrice.toFixed(2)}<span className="text-[10px] font-bold text-red-500/80">/{product.unit || 'UN'}</span></span>
                                    </div>
                                  ) : (
                                    <span className="flex items-baseline gap-0.5">R$ {product.price.toFixed(2)}<span className="text-[10px] sm:text-xs font-normal text-gray-400 font-medium">/{product.unit || 'UN'}</span></span>
                                  )}
                                </span>
                              </>
                            )}
                           <p className="text-xs text-gray-500 mb-3 flex-grow text-center h-auto min-h-[1.5rem]">{product.description}</p>
                           <div className="flex flex-col items-center justify-center mt-auto gap-2.5 w-full">
                             {(() => {
                               const qty = getCartQuantity(product.id);
                               if (qty > 0) {
                                 return (
                                   <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200/60 rounded-full px-2.5 py-1 select-none shadow-sm flex-shrink-0 animate-in zoom-in-90 duration-150">
                                     <button
                                       onClick={(e) => { e.stopPropagation(); removeProductFromList(product.id); }}
                                       className="p-1 rounded-full text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer flex items-center justify-center"
                                       title="Remover um"
                                     >
                                       <Minus className="w-3.5 h-3.5" />
                                     </button>
                                     <input 
                                       type="text"
                                       inputMode="numeric"
                                       pattern="[0-9]*"
                                       value={qty === 0 ? '' : qty}
                                       onClick={(e) => e.stopPropagation()}
                                       onChange={(e) => {
                                         e.stopPropagation();
                                         const val = e.target.value.replace(/\D/g, '');
                                         let num = val === '' ? 0 : Number(val);
                                         if (product.stockCount !== undefined && num > product.stockCount) {
                                           num = product.stockCount;
                                         }
                                         setCart(prev => {
                                           const existingIdx = prev.findIndex(item => item.product.id === product.id);
                                           if (existingIdx >= 0) {
                                             const newCart = [...prev];
                                             if (num === 0) {
                                               newCart.splice(existingIdx, 1);
                                             } else {
                                               newCart[existingIdx].quantity = num;
                                             }
                                             return newCart;
                                           } else if (num > 0) {
                                             return [...prev, { product, quantity: num, addons: [] }];
                                           }
                                           return prev;
                                         });
                                       }}
                                       onBlur={(e) => {
                                         e.stopPropagation();
                                         if (qty <= 0) {
                                           setCart(prev => prev.filter(item => item.product.id !== product.id));
                                         }
                                       }}
                                       className="w-8 h-5 text-center text-[10px] sm:text-xs font-black bg-white border border-gray-200 rounded focus:outline-none"
                                       style={{ color: settings?.primaryColor }}
                                     />
                                     <button
                                       onClick={(e) => { e.stopPropagation(); (product.addons && product.addons.length > 0) || (product.flavors && product.flavors.length > 0) ? setAddonModalProduct(product) : addToCart(product); }}
                                       className="p-1 rounded-full text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer flex items-center justify-center"
                                       title="Adicionar mais um"
                                     >
                                       <Plus className="w-3.5 h-3.5" />
                                     </button>
                                   </div>
                                 );
                               }
                               return (
                                 <button 
                                   onClick={() => (product.addons && product.addons.length > 0) || (product.flavors && product.flavors.length > 0) ? setAddonModalProduct(product) : addToCart(product)}
                                   className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all text-white font-extrabold text-[10px] sm:text-xs uppercase tracking-wider shadow-sm"
                                   style={{ backgroundColor: settings?.primaryColor }}
                                 >
                                   <Plus className="w-3.5 h-3.5" /> Adicionar
                                 </button>
                               );
                             })()}
                           </div>
                         </div>
                      </motion.div>
                    );
                    })}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div 
                    layout
                    className="space-y-3.5 max-w-2xl mx-auto text-left"
                  >
                    <AnimatePresence mode="popLayout">
                      {section.products.map((product, pIdx) => {
                        const isUnavailable = product.isAvailable === false || product.stockCount === 0;
                        return (
                          <motion.div
                            layout
                            key={product.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3, delay: pIdx * 0.05 }}
                            className={`bg-white rounded-2xl shadow-xs border border-gray-150/65 p-3.5 flex gap-4 items-center hover:bg-gray-50/20 hover:scale-[1.01] transition-all duration-200 group relative ${isUnavailable ? 'opacity-60 grayscale-[0.5] pointer-events-none' : ''}`}
                          >
                        <div className="relative w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                          {product.promotion && !isUnavailable && (
                            <div className="absolute top-1 left-1 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm z-10 animate-pulse">
                              PROMO
                            </div>
                          )}
                          {isUnavailable && (
                            <div className="absolute top-1 left-1 flex items-center justify-center w-[calc(100%-8px)] h-4 bg-gray-800 text-white text-[8px] font-bold rounded shadow-sm z-10 uppercase">
                              Esgotado
                            </div>
                          )}
                          {product.image ? (
                            <img referrerPolicy="no-referrer" src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Camera className="w-6 h-6 opacity-40" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-grow min-w-0 pr-1 text-left">
                          {settings?.productOrder === 'price-first' ? (
                            <>
                              <div className="flex flex-col mb-1 block">
                                {product.promotion && product.promoPrice && (product.promoQuantity || 1) === 1 ? (
                                  <div className="flex flex-col bg-red-50/50 px-1.5 py-1 rounded border border-red-100 w-fit mb-0.5">
                                    <span className="text-[9px] text-red-500 font-bold leading-none flex gap-1 items-center mb-0.5">De: <span className="line-through">R$ {product.price.toFixed(2)}</span></span>
                                    <span className="font-black text-xs sm:text-sm flex items-baseline gap-1 animate-in leading-none text-red-600">
                                      Por: R$ {product.promoPrice.toFixed(2)}
                                      <span className="text-[10px] font-bold text-red-500/80">/{product.unit || 'UN'}</span>
                                    </span>
                                  </div>
                                ) : (
                                  <span className="font-black text-xs sm:text-sm flex items-baseline gap-0.5 animate-in" style={{ color: settings?.primaryColor }}>
                                    R$ {product.price.toFixed(2)}
                                    <span className="text-[10px] font-normal text-gray-400 font-medium">/{product.unit || 'UN'}</span>
                                  </span>
                                )}
                              </div>
                              <h4 className="font-extrabold text-gray-800 text-sm sm:text-base leading-tight mb-0.5">{product.name}</h4>
                            </>
                          ) : (
                            <>
                              <h4 className="font-extrabold text-gray-800 text-sm sm:text-base leading-tight mb-0.5">{product.name}</h4>
                              <div className="flex flex-col mb-1 block">
                                {product.promotion && product.promoPrice && (product.promoQuantity || 1) === 1 ? (
                                  <div className="flex flex-col bg-red-50/50 px-1.5 py-1 rounded border border-red-100 w-fit mb-0.5">
                                    <span className="text-[9px] text-red-500 font-bold leading-none flex gap-1 items-center mb-0.5">De: <span className="line-through">R$ {product.price.toFixed(2)}</span></span>
                                    <span className="font-black text-xs sm:text-sm flex items-baseline gap-1 animate-in leading-none text-red-600">
                                      Por: R$ {product.promoPrice.toFixed(2)}
                                      <span className="text-[10px] font-bold text-red-500/80">/{product.unit || 'UN'}</span>
                                    </span>
                                  </div>
                                ) : (
                                  <span className="font-black text-xs sm:text-sm flex items-baseline gap-0.5 animate-in" style={{ color: settings?.primaryColor }}>
                                    R$ {product.price.toFixed(2)}
                                    <span className="text-[10px] font-normal text-gray-400 font-medium">/{product.unit || 'UN'}</span>
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                          <p className="text-xs text-gray-500 leading-relaxed mb-1.5 font-medium">{product.description}</p>
                          {!isUnavailable && product.stockCount !== undefined && product.stockCount > 0 && (
                            <div className="mt-1.5 inline-flex bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse block"></span> {product.stockCount} {product.stockUnit || 'un'} disponível
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-shrink-0 pl-1">
                          {(() => {
                            const qty = getCartQuantity(product.id);
                            if (qty > 0) {
                              return (
                                <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200/60 rounded-full px-2 py-0.5 select-none shadow-sm animate-in zoom-in-90 duration-150">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); removeProductFromList(product.id); }}
                                    className="p-1.5 rounded-full text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer flex items-center justify-center"
                                    title="Remover um"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="text-xs font-black min-w-4 text-center" style={{ color: settings?.primaryColor }}>{qty}</span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); (product.addons && product.addons.length > 0) || (product.flavors && product.flavors.length > 0) ? setAddonModalProduct(product) : addToCart(product); }}
                                    className="p-1.5 rounded-full text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer flex items-center justify-center"
                                    title="Adicionar mais um"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            }
                            return (
                              <button 
                                onClick={() => (product.addons && product.addons.length > 0) || (product.flavors && product.flavors.length > 0) ? setAddonModalProduct(product) : addToCart(product)}
                                className="flex items-center justify-center gap-1.5 py-1.5 px-3.5 rounded-xl cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-all text-white font-extrabold text-[10px] sm:text-xs uppercase tracking-wider shadow-sm flex-shrink-0"
                                style={{ backgroundColor: settings?.primaryColor }}
                              >
                                <Plus className="w-3 h-3" /> Adicionar
                              </button>
                            );
                          })()}
                        </div>
                      </motion.div>
                    );
                    })}
                    </AnimatePresence>
                  </motion.div>
                )}
              </motion.div>
            );
            })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 py-12 bg-neutral-950 text-center border-t border-neutral-800 pb-32 text-white">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-full px-5 py-2 shadow-sm">
            <span className="text-sm font-black tracking-widest text-emerald-400 uppercase">CARDAPP</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-6 mt-4">
          <button onClick={() => setDocModal('terms')} className="text-gray-400 hover:text-white font-semibold text-xs transition-colors uppercase tracking-widest">
            Termos de Uso
          </button>
          <button onClick={() => setDocModal('privacy')} className="text-gray-400 hover:text-white font-semibold text-xs transition-colors uppercase tracking-widest">
            Política de Privacidade
          </button>
        </div>
        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest px-4">
          {new Date().getFullYear()} {settings.storeNameFirst || settings.storeName}. Todos os direitos reservados.
        </p>
        <div className="mt-8 flex flex-col items-center gap-2">
          <Link to="/admin/login" className="text-[9px] text-gray-400 hover:text-gray-200 transition-colors uppercase tracking-wider font-semibold">
            Área do Administrador
          </Link>
          <span className="text-[9px] uppercase font-bold tracking-widest text-gray-650 mt-4">
            Desenvolvido por <span className="text-emerald-500 font-extrabold">SFTECNOLOGIA</span>
          </span>
        </div>
      </footer>

      {/* Docs Modal (Terms/Privacy) */}
      {docModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300 px-4 py-8">
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl flex flex-col max-h-full overflow-hidden border border-gray-100">
            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur z-10">
              <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">
                {docModal === 'terms' ? 'Termos de Uso' : 'Política de Privacidade'}
              </h3>
              <button onClick={() => setDocModal(null)} className="p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors shrink-0 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 sm:p-6 overflow-y-auto bg-gray-50/50 flex-grow text-sm text-gray-600 space-y-6 leading-relaxed font-medium">
              {docModal === 'terms' ? (
                <>
                  <p>
                    Bem-vindo(a) ao catálogo digital da <strong className="text-gray-800">{settings.storeNameFirst || settings.storeName}</strong>.
                    Ao acessar ou usar nossa plataforma de pedidos, você concorda em cumprir e se sujeitar aos seguintes Termos de Uso.
                  </p>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2 uppercase text-xs tracking-wider">1. Aceitação dos Termos</h4>
                    <p>O uso desta plataforma indica a aceitação completa e incondicional destes termos. Se você não concorda com alguma parte, não deverá utilizar nossos serviços.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2 uppercase text-xs tracking-wider">2. Descrição do Serviço</h4>
                    <p>Disponibilizamos um catálogo virtual para visualização de produtos e intermediação de pedidos diretamente via WhatsApp. A loja é responsável pela entrega, qualidade dos produtos e atendimento.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2 uppercase text-xs tracking-wider">3. Pedidos e Pagamentos</h4>
                    <p>Os pedidos reservados através da plataforma devem ser concluídos e pagos conforme as diretrizes acordadas no momento de confirmação pelo canal de atendimento. Os preços podem sofrer alterações sem prévio aviso.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2 uppercase text-xs tracking-wider">4. Isenção de Responsabilidade</h4>
                    <p>Ao realizar o pedido, o usuário se certificará pelo meio de pagamento e a entrega por sua própria conta. Não nos responsabilizamos por falhas externas ao nosso controle.</p>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    A sua privacidade é importante para nós. Esta política de privacidade descreve como a loja <strong className="text-gray-800">{settings.storeNameFirst || settings.storeName}</strong> gerencia, processa e armazena os seus dados.
                  </p>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2 uppercase text-xs tracking-wider">1. Coleta de Informações</h4>
                    <p>Coletamos informações inseridas ativamente por você no preenchimento do formulário de checkout para fins exclusivos de processamento logístico na entrega, que incluem: Nome completo, endereço completo, e preferências do pedido.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2 uppercase text-xs tracking-wider">2. Uso de Informações</h4>
                    <p>Os dados disponibilizados são exclusivamente processados para o processamento da sua compra, envio do pedido (formatação visual local na rota para o WhatsApp) e histórico simples.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2 uppercase text-xs tracking-wider">3. Retenção de Dados Locais</h4>
                    <p>A sua Sacola de Compras utiliza o sistema de memória local apenas para guardar a sessão e permitir que o pedido não seja perdido em caso de encerramento temporário, garantindo segurança estrita ao usuário.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2 uppercase text-xs tracking-wider">4. Contato e Retificação</h4>
                    <p>Para dúvidas sobre suas informações, por favor, utilize nossos canais de atendimento direto via WhatsApp, solicitando, quando julgar, o cancelamento ou a exclusão dos dados de entrega de nossas anotações pontuais.</p>
                  </div>
                </>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-white">
              <button 
                onClick={() => setDocModal(null)}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Eu Compreendo & Concordo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Floating Cart Bar at the bottom */}
      <AnimatePresence>
        {cart.length > 0 && !isCartOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100, transition: { duration: 0.2 } }}
            className="fixed bottom-8 left-4 right-4 z-40 max-w-lg mx-auto"
          >
            <motion.button 
              key={cartTotal} // Key change triggers animation
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsCartOpen(true)}
              className="w-full flex items-center justify-between px-6 py-5 rounded-[24px] text-white font-extrabold shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all bg-white/10 backdrop-blur-xl border border-white/20"
              style={{ 
                backgroundColor: settings.primaryColor,
                boxShadow: `0 20px 50px -12px ${settings.primaryColor}70`
              }}
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-2.5 rounded-xl">
                   <ShoppingCart className="w-5.5 h-5.5" />
                </div>
                <div className="flex flex-col items-start translate-y-[1px]">
                  <span className="text-[10px] uppercase tracking-widest opacity-80 font-black">Meu Pedido</span>
                  <span className="text-sm font-black italic">Visualizar Sacola</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-black/15 px-5 py-2.5 rounded-2xl border border-white/10 shadow-inner">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] uppercase tracking-tighter opacity-70 font-bold leading-none mb-0.5">Total agora</span>
                  <span className="text-xl font-black leading-tight italic">R$ {cartTotal.toFixed(2)}</span>
                </div>
                <div className="w-px h-8 bg-white/20 mx-1"></div>
                <div className="bg-white text-black px-2.5 py-1.5 rounded-xl text-[12px] font-black shadow-md flex items-center justify-center min-w-[32px]">
                  {cartCount}
                </div>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Addon Selection Modal */}
      <AnimatePresence>
        {addonModalProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div 
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300, duration: 0.3 }}
              className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border border-white/20"
            >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-800">Personalizar</h3>
              <button onClick={() => { setAddonModalProduct(null); setSelectedAddons([]); }} className="p-2 bg-gray-100 rounded-full text-gray-500 cursor-pointer hover:bg-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-4">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
                  {addonModalProduct.image ? <img src={addonModalProduct.image} className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-gray-300" />}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">{addonModalProduct.name}</h4>
                    <div className="flex flex-col">
                      {addonModalProduct.promotion && addonModalProduct.promoPrice && (addonModalProduct.promoQuantity || 1) === 1 ? (
                        <>
                          <span className="text-xs text-gray-400 line-through font-medium leading-none">R$ {addonModalProduct.price.toFixed(2)}</span>
                          <span className="font-black text-lg text-emerald-600 leading-tight">
                            R$ {addonModalProduct.promoPrice.toFixed(2)} <span className="text-xs font-medium text-gray-400">/{addonModalProduct.unit || 'UN'}</span>
                          </span>
                        </>
                      ) : (
                        <p className="text-gray-900 text-base font-black">
                          R$ {addonModalProduct.price.toFixed(2)} / {addonModalProduct.unit || 'UN'}
                        </p>
                      )}
                    </div>
                  
                    {addonModalProduct.promoQuantity && addonModalProduct.promoQuantity > 0 && addonModalProduct.promoPrice && (
                      <div className="mt-1 inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100 shadow-sm animate-pulse-soft">
                        <Tag className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase tracking-wider">
                          {addonModalProduct.promoQuantity}+ Unidades: R$ {addonModalProduct.promoPrice.toFixed(2)} total (R$ {(addonModalProduct.promoPrice / addonModalProduct.promoQuantity).toFixed(2)}/un)
                        </span>
                      </div>
                    )}
                </div>
              </div>
              
              <div className="space-y-4 mt-4">
                {(() => {
                  const allAddons = addonModalProduct.addons || [];
                  const groupedAddons = allAddons.reduce((acc, addon) => {
                    const cat = addon.category && addon.category.trim() !== '' ? addon.category : 'Complementos';
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(addon);
                    return acc;
                  }, {} as Record<string, any[]>);

                  // Sort addons in each category
                  Object.keys(groupedAddons).forEach(cat => {
                    groupedAddons[cat].sort((a, b) => {
                      const aUnavailable = a.isAvailable === false;
                      const bUnavailable = b.isAvailable === false;
                      if (aUnavailable && !bUnavailable) return 1;
                      if (!aUnavailable && bUnavailable) return -1;
                      return a.name.localeCompare(b.name);
                    });
                  });

                  if (Object.keys(groupedAddons).length === 0) return null;

                  return Object.entries(groupedAddons).map(([catName, addons]) => (
                    <div key={catName} className="space-y-3">
                      <h5 className="font-black text-[10px] text-gray-400 uppercase tracking-widest px-1">{catName}</h5>
                      {(addons as any[]).map((addon: any, idx: number) => {
                        const isSelected = selectedAddons.some(a => a.name === addon.name);
                        const isUnavailable = addon.isAvailable === false;
                        
                        return (
                          <motion.div 
                            key={`${addon.name}-${idx}`} 
                            onClick={() => {
                              if (isUnavailable) return;
                              const alreadySelected = selectedAddons.some(a => a.name === addon.name);
                              if (!alreadySelected) {
                                setSelectedAddons(prev => [...prev, addon]);
                              } else {
                                setSelectedAddons(prev => prev.filter(a => a.name !== addon.name));
                              }
                            }}
                            whileHover={isUnavailable ? {} : { scale: 1.012, y: -1 }}
                            whileTap={isUnavailable ? {} : { scale: 0.985 }}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 350, damping: 25, delay: idx * 0.04 }}
                            className={`flex items-center justify-between p-3.5 border rounded-2xl select-none transition-all duration-300 shadow-xs border-gray-150 ${isUnavailable ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
                            style={isSelected && !isUnavailable ? { 
                              borderColor: settings.primaryColor, 
                              borderWidth: '2px', 
                              backgroundColor: `${settings.primaryColor}0E`,
                              boxShadow: `0 8px 20px ${settings.primaryColor}15`
                            } : {
                              backgroundColor: isUnavailable ? '#F9FAFB' : '#FCFCFD'
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-5 h-5 rounded-md flex items-center justify-center transition-all duration-300 border overflow-hidden"
                                style={isSelected && !isUnavailable ? { 
                                  backgroundColor: settings.primaryColor, 
                                  borderColor: settings.primaryColor 
                                } : { 
                                  backgroundColor: isUnavailable ? '#F3F4F6' : '#FFFFFF', 
                                  borderColor: isUnavailable ? '#E5E7EB' : '#D1D5DB' 
                                }}
                              >
                                {isSelected && !isUnavailable && (
                                  <motion.div
                                    initial={{ scale: 0, rotate: -25 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                  >
                                    <Check className="w-3.5 h-3.5 text-white" />
                                  </motion.div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-sm ${isUnavailable ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{addon.name}</span>
                                {isUnavailable && (
                                  <span className="text-[9px] font-black uppercase text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">Esgotado</span>
                                )}
                              </div>
                            </div>
                            <span className="text-sm font-black" style={isSelected && !isUnavailable ? { color: settings.primaryColor } : { color: isUnavailable ? '#9CA3AF' : '#6B7280' }}>+R$ {addon.price.toFixed(2)}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>

              {/* Sabores Section */}
              {addonModalProduct.flavors && addonModalProduct.flavors.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h5 className="font-black text-[10px] text-gray-400 uppercase tracking-widest px-1">Sabores (Escolha as quantidades)</h5>
                  <div className="grid grid-cols-1 gap-2">
                    {[...addonModalProduct.flavors]
                      .filter(f => f.trim() !== '')
                      .sort((a, b) => {
                        const aUnavailable = addonModalProduct.unavailableFlavors?.includes(a) || false;
                        const bUnavailable = addonModalProduct.unavailableFlavors?.includes(b) || false;
                        if (aUnavailable && !bUnavailable) return 1;
                        if (!aUnavailable && bUnavailable) return -1;
                        return a.localeCompare(b);
                      })
                      .map((flavor, idx) => {
                      const qty = flavorQuantities[flavor] || 0;
                      const isSelected = qty > 0;
                      const isUnavailable = addonModalProduct.unavailableFlavors?.includes(flavor);
                      
                      return (
                        <motion.div 
                          key={idx} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`flex items-center justify-between p-3.5 border rounded-2xl select-none transition-all duration-300 shadow-xs ${isUnavailable ? 'opacity-50 grayscale' : ''}`}
                          style={isSelected ? { 
                            borderColor: settings.primaryColor, 
                            borderWidth: '2px', 
                            backgroundColor: `${settings.primaryColor}0E`,
                          } : {
                            backgroundColor: isUnavailable ? '#F9FAFB' : '#FCFCFD',
                            borderColor: '#F1F1F4'
                          }}
                        >
                          <div 
                            className={`flex items-center gap-3 flex-1 ${isUnavailable ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            onClick={() => {
                              if (isUnavailable) return;
                              if (isSelected) {
                                setFlavorQuantities(prev => {
                                  const newMap = { ...prev };
                                  delete newMap[flavor];
                                  return newMap;
                                });
                              } else {
                                setFlavorQuantities(prev => ({ ...prev, [flavor]: 1 }));
                              }
                            }}
                          >
                            <div 
                              className="w-5 h-5 rounded-md flex items-center justify-center transition-all duration-300 border overflow-hidden"
                              style={isSelected ? { 
                                backgroundColor: settings.primaryColor, 
                                borderColor: settings.primaryColor 
                              } : { 
                                backgroundColor: isUnavailable ? '#F3F4F6' : '#FFFFFF', 
                                borderColor: isUnavailable ? '#E5E7EB' : '#D1D5DB' 
                              }}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span className={`font-bold text-sm ${isUnavailable ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{flavor}</span>
                            {isUnavailable && (
                               <span className="text-[9px] font-black uppercase text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded ml-2">Esgotado</span>
                            )}
                          </div>
                          
                          {isUnavailable ? null : isSelected ? (
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFlavorQuantities(prev => {
                                    const next = Math.max(0, qty - 1);
                                    const newMap = { ...prev, [flavor]: next };
                                    if (next === 0) delete newMap[flavor];
                                    return newMap;
                                  });
                                }}
                                className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 active:scale-95 transition-all shadow-sm cursor-pointer"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="font-black text-gray-900 w-4 text-center">{qty}</span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFlavorQuantities(prev => ({ ...prev, [flavor]: qty + 1 }));
                                }}
                                className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 active:scale-95 transition-all shadow-sm cursor-pointer"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setFlavorQuantities(prev => ({ ...prev, [flavor]: 1 }))}
                              className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full uppercase tracking-tighter cursor-pointer hover:bg-emerald-100 transition-colors active:scale-95"
                            >
                              Adicionar
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Product Internal Observation */}
              <div className="space-y-2 mt-6">
                <div className="flex items-center justify-between px-1">
                   <h5 className="font-black text-[10px] text-gray-400 uppercase tracking-widest">Observação para este item</h5>
                   <span className="text-[9px] font-bold text-gray-300 italic">Opcional</span>
                </div>
                <textarea 
                  value={productObservation}
                  onChange={(e) => setProductObservation(e.target.value.slice(0, 140))}
                  placeholder="Ex: Tirar cebola, ponto da carne mal passado, sem gelo..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-150 rounded-2xl focus:bg-white transition-all outline-none text-sm placeholder-gray-400 font-medium"
                  rows={2}
                />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 bg-white space-y-5">
              {/* Quantity Selector in Modal */}
              {(!addonModalProduct.flavors || addonModalProduct.flavors.length === 0) && (
                <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-2xl border border-gray-100 shadow-inner">
                  <span className="text-[10px] font-black uppercase text-gray-400 ml-3 tracking-widest">Quantidade</span>
                  <div className="flex items-center gap-5 pr-2">
                    <button 
                      onClick={() => setModalQuantity(q => Math.max(1, q - 1))}
                      className="w-11 h-11 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 active:scale-95 transition-all shadow-md"
                    >
                      <Minus className="w-5.5 h-5.5" />
                    </button>
                    <span className="text-xl font-black text-gray-900 w-8 text-center">{modalQuantity}</span>
                    <button 
                      onClick={() => {
                        if (addonModalProduct.stockCount !== undefined && modalQuantity >= addonModalProduct.stockCount) {
                          setValidationError(`Estoque esgotado! Limite de ${addonModalProduct.stockCount} un.`);
                          return;
                        }
                        setModalQuantity(q => q + 1);
                      }}
                      className="w-11 h-11 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 active:scale-95 transition-all shadow-md"
                    >
                      <Plus className="w-5.5 h-5.5" />
                    </button>
                  </div>
                </div>
              )}

              <button 
                onClick={() => {
                  const hasFlavors = addonModalProduct.flavors && addonModalProduct.flavors.length > 0;
                  const effQty = hasFlavors ? Object.values(flavorQuantities as Record<string, number>).reduce((a: number, b: number) => a + b, 0) : modalQuantity;

                  if (effQty === 0) {
                    setValidationError(hasFlavors ? "Por favor, selecione pelo menos um sabor." : "Selecione pelo menos uma quantidade.");
                    return;
                  }

                  if (addonModalProduct.stockCount !== undefined && effQty > addonModalProduct.stockCount) {
                    setValidationError(`Estoque esgotado! Limite de ${addonModalProduct.stockCount} un.`);
                    return;
                  }

                  if (hasFlavors) {
                    Object.entries(flavorQuantities as Record<string, number>).forEach(([flavor, qty]) => {
                      if (qty > 0) {
                        addToCart(addonModalProduct, selectedAddons, [flavor], qty as number, productObservation);
                      }
                    });
                  } else {
                    addToCart(addonModalProduct, selectedAddons, [], modalQuantity, productObservation);
                  }
                  
                  setAddonModalProduct(null);
                  setSelectedAddons([]);
                  setFlavorQuantities({});
                  setModalQuantity(1);
                  setProductObservation('');
                }}
                className="w-full py-4 rounded-xl font-bold text-white shadow-md flex justify-between items-center px-6 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                style={{ backgroundColor: settings.primaryColor }}
              >
                <div className="flex flex-col items-start leading-none">
                   <span className="text-xs uppercase font-black opacity-80 tracking-tighter">Adicionar à Sacola</span>
                   {(() => {
                     const effQty = (addonModalProduct.flavors && addonModalProduct.flavors.length > 0) 
                       ? Object.values(flavorQuantities as Record<string, number>).reduce((a: number, b: number) => a + b, 0)
                       : modalQuantity;
                     return <span className="text-[10px] font-medium opacity-70">{effQty} {effQty === 1 ? 'item' : 'itens'}</span>;
                   })()}
                </div>
                <div className="flex flex-col items-end leading-none">
                  <span className="text-sm font-black">
                    R$ {(() => {
                      const effQty = (addonModalProduct.flavors && addonModalProduct.flavors.length > 0) 
                       ? Object.values(flavorQuantities as Record<string, number>).reduce((a: number, b: number) => a + b, 0)
                       : modalQuantity;
                      let basePrice = Number(addonModalProduct.price || 0);
                      if (addonModalProduct.promoQuantity && addonModalProduct.promoQuantity > 0 && addonModalProduct.promoPrice && effQty >= addonModalProduct.promoQuantity) {
                        // Use unit price from promo to avoid multiplying the bundle price by quantity
                        basePrice = Number(addonModalProduct.promoPrice) / Number(addonModalProduct.promoQuantity);
                      }
                      const addonsPrice = selectedAddons.reduce((s, a) => s + Number(a.price || 0), 0);
                      return ((basePrice + addonsPrice) * effQty).toFixed(2);
                    })()}
                  </span>
                  {addonModalProduct.promoQuantity && ((addonModalProduct.flavors && addonModalProduct.flavors.length > 0) ? Object.values(flavorQuantities as Record<string, number>).reduce((a: number, b: number) => a + b, 0) : modalQuantity) >= addonModalProduct.promoQuantity && (
                    <span className="text-[8px] font-black uppercase text-white/80 tracking-tighter bg-white/10 px-1 rounded mt-0.5">Promoção Ativa!</span>
                  )}
                </div>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
      {isCartOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex justify-end"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                {checkoutStep !== 'cart' && (
                  <button 
                    onClick={() => {
                      if (checkoutStep === 'address') {
                        if (checkoutSubStep === 'personal') {
                          setCheckoutStep('cart');
                        } else if (checkoutSubStep === 'delivery_address') {
                          setCheckoutSubStep('personal');
                        } else {
                          setCheckoutSubStep('delivery_address');
                        }
                      } else if (checkoutStep === 'schedule') {
                        setCheckoutStep('address');
                        setCheckoutSubStep('payment');
                      }
                    }} 
                    className="p-1.5 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors mr-1 cursor-pointer"
                    title="Voltar etapa"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" style={{ color: settings.primaryColor }} />
                  Minha Sacola <span className="text-xs font-black text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">({cartCount} {cartCount === 1 ? 'item' : 'itens'})</span>
                </h2>
              </div>
              <button onClick={() => { setIsCartOpen(false); setCheckoutStep('cart'); setCheckoutSubStep('personal'); }} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            {checkoutStep !== 'success' && cart.length > 0 && (
              <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-gray-200 -translate-y-2.5 z-0"></div>
                {(() => {
                  const stepsArray = [
                    { id: 'cart', label: 'Sacola', num: 1 },
                    { id: 'personal', label: 'Dados', num: 2 },
                    { id: 'delivery_address', label: 'Receber', num: 3 },
                    { id: 'payment', label: 'Pagar', num: 4 },
                    ...(isScheduled ? [{ id: 'schedule', label: 'Reserva', num: 5 }] : [])
                  ];
                  
                  const currentStepId = checkoutStep === 'address' ? checkoutSubStep : checkoutStep;
                  const currentStepIndex = stepsArray.findIndex(s => s.id === currentStepId);
                  
                  return stepsArray.map((step, idx) => {
                    const isActive = currentStepId === step.id;
                    const isPast = currentStepIndex > idx;
                    
                    return (
                      <div key={step.id} className="flex flex-col items-center relative z-10 gap-1 bg-gray-50/50 px-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all duration-500 ease-out shadow-sm ${isActive ? 'text-white scale-110 shadow-md' : isPast ? 'text-white' : 'bg-white border-2 border-gray-200 text-gray-300'}`} style={{ backgroundColor: isActive || isPast ? settings.primaryColor : undefined, borderColor: isActive || isPast ? settings.primaryColor : undefined }}>
                          {isPast ? <Check className="w-4 h-4" /> : step.num}
                        </div>
                        <span className={`text-[9px] uppercase tracking-widest font-black transition-colors ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            )}

            <div className="flex-grow overflow-y-auto p-4">
              <AnimatePresence mode="wait">
              {checkoutStep === 'cart' && (
                <motion.div 
                  key="step-cart"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="w-full"
                >
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4 py-20">
                      <ShoppingCart className="w-16 h-16 opacity-20" />
                      <p>Sua sacola está vazia.</p>
                      <button onClick={() => setIsCartOpen(false)} className="px-6 py-2 rounded-lg font-medium" style={{ backgroundColor: `${settings.primaryColor}20`, color: settings.primaryColor }}>
                        Adicionar Itens
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <AnimatePresence initial={false}>
                        {cart.map((item, idx) => {
                          const itemAddonsPrice = (item.addons || []).reduce((sum, a) => sum + Number(a.price || 0), 0);
                          const unitPrice = Number(item.product.price || 0) + itemAddonsPrice;
                          return (
                            <motion.div 
                              key={`${item.product.id}-${idx}`}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0, padding: 0 }}
                              className="flex gap-4 bg-gray-50 p-3 rounded-xl relative overflow-hidden"
                            >
                              <div className="w-16 h-16 bg-white rounded-lg flex-shrink-0 overflow-hidden border border-gray-100">
                                {item.product.image ? (
                                  <img src={item.product.image} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-300"><Camera className="w-6 h-6" /></div>
                                )}
                              </div>
                              <div className="flex-grow flex flex-col relative pr-8">
                                <h4 className="font-semibold text-gray-800">
                                  {item.product.name}
                                  {item.flavors && item.flavors.length > 0 && ` de ${item.flavors.join(', ')}`}
                                </h4>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                     {(() => {
                                       const promoKey = item.product.promoGroup || item.product.id;
                                       const groupQty = cart.filter(i => (i.product.promoGroup || i.product.id) === promoKey).reduce((sum, i) => sum + i.quantity, 0);
                                       const hasQualifiedPromo = item.product.promoQuantity && item.product.promoQuantity > 0 && item.product.promoPrice && groupQty >= item.product.promoQuantity;
                                       
                                       if (hasQualifiedPromo) {
                                         return (
                                           <>
                                             <span className="text-xs font-medium text-gray-400 line-through">
                                               R$ {Number(item.product.price || 0).toFixed(2)}
                                             </span>
                                             <span className="text-sm font-black text-emerald-600" style={{ color: settings.primaryColor }}>
                                               R$ {(Number(item.product.promoPrice) / Number(item.product.promoQuantity)).toFixed(2)}
                                             </span>
                                             <span className="bg-emerald-100 text-emerald-700 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">Desconto Aplicado</span>
                                           </>
                                         );
                                       }
                                       return (
                                         <span className="text-sm font-black" style={{ color: settings.primaryColor }}>
                                            R$ {Number(item.product.price || 0).toFixed(2)}
                                         </span>
                                       );
                                     })()}
                                  </div>
                                  {item.product.promoQuantity && (
                                     <span className={`text-[9px] font-black uppercase tracking-tighter ${(() => {
                                       const promoKey = item.product.promoGroup || item.product.id;
                                       const groupQty = cart.filter(i => (i.product.promoGroup || i.product.id) === promoKey).reduce((sum, i) => sum + i.quantity, 0);
                                       return groupQty >= item.product.promoQuantity;
                                     })() ? 'text-emerald-500' : 'text-gray-400 opacity-60'}`}>
                                        Oferta: {item.product.promoQuantity} por apenas R$ {Number(item.product.promoPrice || 0).toFixed(2)} total
                                     </span>
                                  )}
                                  {item.productObservation && (
                                     <div className="mt-1.5 p-2 bg-amber-50/50 border border-amber-100/50 rounded-lg">
                                        <div className="flex items-center gap-1 mb-1">
                                          <MessageSquare className="w-2.5 h-2.5 text-amber-600" />
                                          <span className="text-[8px] font-black text-amber-800 uppercase tracking-widest">Obs:</span>
                                        </div>
                                        <p className="text-[10px] text-amber-900 font-bold leading-tight break-words">
                                          "{item.productObservation}"
                                        </p>
                                     </div>
                                  )}
                                </div>
                                {item.addons && item.addons.length > 0 && (
                                  <div className="mt-1 text-xs text-gray-500">
                                    {item.addons.map((a, i) => <span key={i} className="block">+ {a.name} (R$ {a.price.toFixed(2)})</span>)}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-auto pt-3">
                                  <button onClick={() => updateCartItemQuantity(idx, -1)} className="w-8 h-8 rounded-full bg-white text-gray-600 border border-gray-200 cursor-pointer hover:bg-gray-50 shadow-sm flex items-center justify-center transition-all active:scale-90">
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <input 
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={item.quantity === 0 ? '' : item.quantity}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/\D/g, '');
                                      let num = val === '' ? 0 : Number(val);
                                      if (item.product.stockCount !== undefined && num > item.product.stockCount) {
                                        num = item.product.stockCount;
                                      }
                                      setCart(prev => {
                                        const newCart = [...prev];
                                        newCart[idx].quantity = num;
                                        return newCart;
                                      });
                                    }}
                                    className="w-12 h-8 text-center text-sm font-black bg-white border border-gray-200 rounded-lg text-gray-800 shadow-inner"
                                  />
                                  <button onClick={() => updateCartItemQuantity(idx, 1)} className="w-8 h-8 rounded-full bg-white text-gray-600 border border-gray-200 cursor-pointer hover:bg-gray-50 shadow-sm flex items-center justify-center transition-all active:scale-90">
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                                
                                {/* 2-Step Delete Button */}
                                <div className="absolute top-0 right-0">
                                  <AnimatePresence mode="wait">
                                    {confirmDeleteOrderId === `cart-${idx}` ? (
                                      <motion.button
                                        key="confirm"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        onClick={() => {
                                          setCart(prev => prev.filter((_, i) => i !== idx));
                                          setConfirmDeleteOrderId(null);
                                        }}
                                        className="px-2 py-1 bg-rose-500 text-white rounded-lg shadow-sm text-[8px] font-black uppercase mt-1"
                                      >
                                        OK?
                                      </motion.button>
                                    ) : (
                                      <motion.button
                                        key="trash"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        onClick={() => {
                                          setConfirmDeleteOrderId(`cart-${idx}`);
                                          setTimeout(() => setConfirmDeleteOrderId(null), 3000);
                                        }}
                                        className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </motion.button>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                              <div className="font-bold text-gray-800 self-end text-sm sm:text-base whitespace-nowrap">
                                R$ {(unitPrice * Number(item.quantity || 1)).toFixed(2)}
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              )}

              {checkoutStep === 'address' && (
                <motion.div 
                  key="step-address"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="w-full"
                >
                  <form id="checkout-form" onSubmit={handleCheckout} className="space-y-5">
                    
                    {/* ETAPA 1: DADOS PESSOAIS */}
                    {checkoutSubStep === 'personal' && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex gap-3 items-center text-left mb-2">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
                            <span className="text-lg font-black">1</span>
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider">Identificação do Cliente</h4>
                            <p className="text-[10px] text-emerald-700 font-bold uppercase leading-tight">Por favor, insira seu nome e contato para prosseguir</p>
                          </div>
                        </div>

                        <div className="text-left">
                          <label className="block text-[10px] uppercase font-black text-gray-500 mb-1.5 ml-1 select-none tracking-wider">
                            Qual o seu nome completo?
                          </label>
                          <input 
                            type="text" required value={customerName} onChange={e => setCustomerName(e.target.value)}
                            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[--theme-color] outline-none font-medium placeholder-gray-500"
                            placeholder="Ex: João da Silva"
                          />
                        </div>

                        <div className="text-left">
                          <label className="block text-[10px] uppercase font-black text-gray-500 mb-1.5 ml-1 select-none tracking-wider">
                            WhatsApp para Contato:
                          </label>
                          <input 
                            type="tel" required value={customerPhone} 
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, '');
                              if (val.length <= 11) setCustomerPhone(val);
                            }}
                            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[--theme-color] outline-none font-medium placeholder-gray-500"
                            placeholder="WhatsApp (DDD + Número)"
                          />
                        </div>
                      </div>
                    )}

                    {/* ETAPA 2: LOGÍSTICA / COMO RECEBER */}
                    {checkoutSubStep === 'delivery_address' && (
                      <div className="space-y-4 animate-in fade-in duration-300 text-left">
                        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex gap-3 items-center text-left mb-2">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
                            <span className="text-lg font-black">2</span>
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider">Forma de Recebimento</h4>
                            <p className="text-[10px] text-emerald-700 font-bold uppercase leading-tight">Selecione como deseja obter seus produtos</p>
                          </div>
                        </div>

                        {(!settings?.storeType || settings.storeType === 'delivery_and_pickup') ? (
                          <div className="grid grid-cols-2 gap-3 mt-1">
                            <button 
                              type="button" 
                              onClick={() => setDeliveryMethod('delivery')}
                              className={`py-3.5 px-3 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${deliveryMethod === 'delivery' ? 'bg-opacity-10 shadow-sm' : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}`}
                              style={deliveryMethod === 'delivery' ? { borderColor: settings.primaryColor, color: settings.primaryColor, backgroundColor: `${settings.primaryColor}15` } : {}}
                            >
                              <MapPin className="w-4 h-4" /> Entrega
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setDeliveryMethod('pickup')}
                              className={`py-3.5 px-3 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${deliveryMethod === 'pickup' ? 'bg-opacity-10 shadow-sm' : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}`}
                              style={deliveryMethod === 'pickup' ? { borderColor: settings.primaryColor, color: settings.primaryColor, backgroundColor: `${settings.primaryColor}15` } : {}}
                            >
                              <Store className="w-4 h-4" /> Retirar
                            </button>
                          </div>
                        ) : settings.storeType === 'only_delivery' ? (
                          <div className="p-3.5 bg-indigo-50/50 border border-indigo-150 rounded-xl text-xs font-bold text-indigo-950 flex items-center justify-center gap-2.5">
                            <span className="text-sm">🛵</span> Atendimento exclusivo via Entrega (Delivery em Domicílio)
                          </div>
                        ) : (
                          <div className="p-3.5 bg-emerald-50/50 border border-emerald-150 rounded-xl text-xs font-bold text-emerald-950 flex items-center justify-center gap-2.5">
                            <span className="text-sm">🏪</span> Atendimento exclusivo via Retirada (Buscar no Balcão)
                          </div>
                        )}

                        {deliveryMethod === 'delivery' && (
                          <div className="animate-in fade-in slide-in-from-top-2 space-y-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            
                            {settings?.deliveryFees && settings.deliveryFees.length > 0 && selectorStep !== 'done' ? (
                              <div className="space-y-3">
                                <h4 className="text-[11px] font-black text-gray-800 uppercase tracking-widest text-left mb-3 flex items-center gap-1.5">
                                  <MapPin className="w-4 h-4 text-[--theme-color]" />
                                  {selectorStep === 'city' ? '1. Escolha sua Cidade' : selectorStep === 'zone' ? '2. Escolha sua Zona/Região' : '3. Escolha seu Bairro'}
                                </h4>
                                
                                <div className="grid grid-cols-1 gap-2.5">
                                  {selectorStep === 'city' && availableCities.map((c, i) => (
                                    <motion.button
                                      key={c}
                                      type="button"
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: i * 0.05 }}
                                      whileHover={{ scale: 1.01 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => {
                                        setSelectedCityName(c);
                                        const zonesForCity = Array.from(new Set(settings.deliveryFees!.filter(f => f.city === c).map(f => f.zone).filter(Boolean)));
                                        setSelectorStep(zonesForCity.length > 0 ? 'zone' : 'neighborhood');
                                      }}
                                      className="w-full text-left p-4 rounded-2xl border border-gray-200 hover:border-gray-300 bg-white flex items-center justify-between group transition-colors shadow-sm"
                                    >
                                      <span className="font-extrabold text-gray-800 text-[15px]">{c}</span>
                                      <div className="w-6 h-6 rounded-full bg-gray-50 group-hover:bg-[--theme-color] group-hover:text-white flex items-center justify-center transition-colors border border-gray-200 group-hover:border-transparent">
                                        <ChevronRight className="w-4 h-4" />
                                      </div>
                                    </motion.button>
                                  ))}

                                  {selectorStep === 'zone' && availableZones.map((z, i) => (
                                    <motion.button
                                      key={z}
                                      type="button"
                                      initial={{ opacity: 0, x: -15, scale: 0.95 }}
                                      animate={{ opacity: 1, x: 0, scale: 1 }}
                                      transition={{ type: 'spring', stiffness: 400, damping: 25, delay: i * 0.06 }}
                                      whileHover={{ scale: 1.02, y: -2 }}
                                      whileTap={{ scale: 0.97 }}
                                      onClick={() => {
                                        setSelectedZoneName(z);
                                        setSelectorStep('neighborhood');
                                      }}
                                      className="relative overflow-hidden w-full text-left p-4 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-md bg-white flex items-center justify-between group transition-all"
                                    >
                                      <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500 opacity-0 group-hover:opacity-10 rounded-bl-full transition-opacity" />
                                      <div className="flex items-center gap-3">
                                        <motion.div 
                                          className="w-10 h-10 rounded-full bg-indigo-50/80 border border-indigo-100 flex items-center justify-center shadow-sm"
                                          whileHover={{ rotate: [0, -10, 10, 0] }}
                                          transition={{ duration: 0.5 }}
                                        >
                                          <MapPin className="w-5 h-5 text-indigo-500" />
                                        </motion.div>
                                        <span className="font-extrabold text-gray-800 text-[16px] group-hover:text-indigo-900 transition-colors">{z}</span>
                                      </div>
                                      <div className="w-7 h-7 rounded-full bg-gray-50 group-hover:bg-indigo-500 group-hover:text-white flex items-center justify-center transition-all border border-gray-200 group-hover:border-transparent group-hover:scale-110 shadow-xs">
                                        <ChevronRight className="w-4 h-4" />
                                      </div>
                                    </motion.button>
                                  ))}

                                  {selectorStep === 'neighborhood' && [...availableNeighborhoods].sort((a, b) => a.neighborhood.localeCompare(b.neighborhood)).map((f, i) => (
                                    <motion.button
                                      key={f.id}
                                      type="button"
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: i * 0.05 }}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => {
                                        setCity(f.city);
                                        setZone(f.zone || '');
                                        setNeighborhood(f.neighborhood);
                                        setSelectedCityId(f.id);
                                        setSelectorStep('done');
                                      }}
                                      className="relative overflow-hidden w-full text-left p-4 rounded-2xl border border-gray-200 hover:border-[--theme-color] bg-white flex flex-col group transition-all shadow-sm"
                                    >
                                      <div className="absolute top-0 right-0 w-16 h-16 bg-[--theme-color] opacity-0 group-hover:opacity-10 rounded-bl-full transition-opacity" />
                                      <span className="font-extrabold text-gray-800 text-sm mb-1">{f.neighborhood}</span>
                                      <span className="text-[10px] uppercase font-black tracking-wider flex items-center gap-1" style={{ color: settings.primaryColor }}>
                                        <span className="w-1.5 h-1.5 rounded-full bg-current" /> Taxa: R$ {Number(f.fee).toFixed(2)}
                                      </span>
                                    </motion.button>
                                  ))}
                                </div>

                                {selectorStep !== 'city' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (selectorStep === 'neighborhood' && availableZones.length > 0) {
                                        setSelectorStep('zone');
                                      } else {
                                        setSelectorStep('city');
                                      }
                                    }}
                                    className="text-xs font-bold text-gray-500 hover:text-gray-800 mt-4 flex items-center gap-1.5 p-2 bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                                  >
                                    <ChevronLeft className="w-4 h-4" /> Voltar
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                {settings?.deliveryFees && settings.deliveryFees.length > 0 && selectedCityId && selectedCityId !== 'other' && (
                                  <div className="flex justify-end mb-[-10px] relative z-20">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectorStep('city');
                                        setSelectedCityName('');
                                        setSelectedZoneName('');
                                        setCity('');
                                        setZone('');
                                        setNeighborhood('');
                                        setSelectedCityId('');
                                      }}
                                      className="text-[10px] uppercase font-black tracking-wider text-gray-500 hover:text-[--theme-color] flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 hover:border-[--theme-color] shadow-xs active:scale-95 transition-all"
                                    >
                                      <MapPin className="w-3.5 h-3.5" /> Alterar Localidade
                                    </button>
                                  </div>
                                )}

                                {/* Address Mapping Info - Luxury animated feedback */}
                                {neighborhood && (
                                  <div className="overflow-hidden">
                                    {selectedCityId && selectedCityId !== 'other' && settings?.deliveryFees ? (
                                      <motion.div 
                                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                        className="relative overflow-hidden p-4 rounded-2xl border flex items-center justify-between text-left"
                                        style={{ 
                                          borderColor: settings.primaryColor ? `${settings.primaryColor}30` : '#E5E7EB',
                                          background: settings.primaryColor ? `linear-gradient(135deg, ${settings.primaryColor}08, ${settings.primaryColor}02, #FFFFFF)` : 'linear-gradient(135deg, #FAFAFA, #FFFFFF)',
                                          boxShadow: settings.primaryColor ? `0 10px 30px ${settings.primaryColor}0F` : undefined
                                        }}
                                      >
                                        <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: settings.primaryColor }} />
                                        
                                        <div className="flex items-center gap-3.5 z-10">
                                          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                                               style={{ backgroundColor: `${settings.primaryColor}15`, color: settings.primaryColor }}>
                                            <motion.div
                                              animate={{ x: [0, 5, 0] }}
                                              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                            >
                                              <MapPin className="w-5.5 h-5.5" />
                                            </motion.div>
                                          </div>
                                          
                                          <div>
                                            <span className="block text-[9px] tracking-widest uppercase font-black opacity-70" style={{ color: settings.primaryColor }}>
                                              ✓ Localidade Identificada
                                            </span>
                                            <h4 className="font-extrabold text-gray-900 text-sm capitalize">
                                              {(() => {
                                                const mappedZone = settings.deliveryFees.find(f => f.id === selectedCityId);
                                                if (!mappedZone) return '';
                                                const parts = [];
                                                if (mappedZone.city) parts.push(mappedZone.city);
                                                if (mappedZone.zone) parts.push(mappedZone.zone);
                                                if (mappedZone.neighborhood) parts.push(mappedZone.neighborhood);
                                                return parts.join(' - ');
                                              })()}
                                            </h4>
                                            <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                                              {(() => {
                                                const mappedZone = settings.deliveryFees.find(f => f.id === selectedCityId);
                                                return mappedZone?.deliveryTime 
                                                  ? `⚡ Tempo Estimado: ${mappedZone.deliveryTime}` 
                                                  : 'Taxa calculada e aplicada instantaneamente.';
                                              })()}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="text-right z-10 shrink-0">
                                          <span className="block text-[8px] uppercase font-black text-gray-400 tracking-wider">Frete</span>
                                          <motion.span 
                                            initial={{ scale: 0.8 }}
                                            animate={{ scale: 1 }}
                                            className="text-[17px] font-black block tracking-tight"
                                            style={{ color: settings.primaryColor }}
                                          >
                                            R$ {Number(settings.deliveryFees.find(f => f.id === selectedCityId)?.fee).toFixed(2)}
                                          </motion.span>
                                        </div>
                                      </motion.div>
                                    ) : settings?.blockOutsideDelivery ? (
                                      <motion.div 
                                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                        className="relative overflow-hidden p-4 rounded-2xl border border-rose-100 flex items-center gap-3.5 text-left"
                                        style={{ 
                                          background: `linear-gradient(135deg, #FFF1F2 0%, #FFFFFF 100%)`,
                                          boxShadow: `0 10px 25px rgba(244, 63, 94, 0.05)`
                                        }}
                                      >
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
                                        
                                        <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 shadow-sm text-rose-600">
                                          <ShieldAlert className="w-5.5 h-5.5 animate-pulse" />
                                        </div>
                                        
                                        <div>
                                          <span className="block text-[9px] tracking-widest uppercase font-black text-rose-500">
                                            🚫 Fora da Área Cadastrada
                                          </span>
                                          <h4 className="font-extrabold text-gray-900 text-sm">
                                            {[city, zone, neighborhood].filter(Boolean).join(' - ') || 'Local não atendido'}
                                          </h4>
                                          <p className="text-[10px] text-rose-700/90 font-semibold mt-0.5 leading-relaxed">
                                            Infelizmente, este estabelecimento não atende a localidade informada.
                                          </p>
                                        </div>
                                      </motion.div>
                                    ) : (
                                      <motion.div 
                                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                        className="relative overflow-hidden p-4 rounded-2xl border border-gray-150 flex items-center justify-between text-left"
                                        style={{ 
                                          background: `linear-gradient(135deg, #FAFAFA, #FFFFFF)`,
                                        }}
                                      >
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-gray-400" />
                                        
                                        <div className="flex items-center gap-3.5 shrink-0">
                                          <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                                            <MapPin className="w-5 h-5" />
                                          </div>
                                          <div>
                                            <span className="block text-[9px] tracking-widest uppercase font-bold text-gray-400">
                                              Localidade Não Mapeada
                                            </span>
                                            <h4 className="font-extrabold text-gray-800 text-sm">
                                              {[city, zone, neighborhood].filter(Boolean).join(' - ') || 'Bairro Informado'}
                                            </h4>
                                            <p className="text-[10px] text-gray-500 font-medium mt-0.5 leading-relaxed">
                                              Taxa fixa de entrega aplicável.
                                            </p>
                                          </div>
                                        </div>
                                        
                                        <div className="text-right shrink-0">
                                          <span className="block text-[8px] uppercase font-bold text-gray-400">Taxa Geral</span>
                                          <span className="text-sm font-black text-gray-850 block">R$ {selectedCityFee.toFixed(2)}</span>
                                        </div>
                                      </motion.div>
                                    )}
                                  </div>
                                )}

                                {mapsLoaded && (
                                  <div className="relative animate-in fade-in duration-300">
                                    <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-rose-500 animate-pulse" />
                                    <input 
                                      ref={autocompleteInputRef}
                                      type="text"
                                      className="w-full pl-11 pr-4 py-4 bg-rose-500/5 border border-rose-200/60 rounded-xl focus:bg-white focus:border-rose-400 outline-none font-bold placeholder-rose-700/60 text-rose-950 text-sm shadow-sm"
                                      placeholder="Buscar Endereço no Google Maps..."
                                    />
                                  </div>
                                )}

                                <div className="relative">
                                  <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                  <input 
                                    value={cep} onChange={e => setCep(e.target.value)}
                                    maxLength={9}
                                    className={`w-full pl-11 pr-4 py-4 bg-gray-50 border ${isFetchingCep ? 'border-orange-300 bg-orange-50' : 'border-gray-200'} rounded-xl focus:bg-white focus:border-[--theme-color] outline-none font-medium placeholder-gray-500`}
                                    placeholder="CEP (Não Obrigatório)"
                                  />
                                  {isFetchingCep && (
                                    <div className="absolute right-4 top-3.5 w-5 h-5 border-2 border-[--theme-color] border-t-transparent rounded-full animate-spin" />
                                  )}
                                </div>

                                <div className="grid grid-cols-4 gap-3">
                                  <div className="col-span-3">
                                    <input 
                                      required value={street} onChange={e => setStreet(e.target.value)}
                                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[--theme-color] outline-none font-medium placeholder-gray-500"
                                      placeholder="Nome da Rua / Av."
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <input 
                                      id="address-number"
                                      required value={number} onChange={e => setNumber(e.target.value)}
                                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[--theme-color] outline-none font-medium placeholder-gray-500 text-center"
                                      placeholder="N."
                                    />
                                  </div>
                                </div>

                                <div className="space-y-3.5">
                                  <div className="text-left">
                                    <label className="block text-[10px] uppercase font-black text-gray-500 mb-1.5 ml-1 select-none tracking-wider">
                                      Cidade / Município:
                                    </label>
                                    <input 
                                      required value={city} onChange={e => setCity(e.target.value)}
                                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[--theme-color] outline-none font-bold text-gray-800 placeholder-gray-400 text-sm shadow-xs"
                                      placeholder="Ex: Natal"
                                    />
                                  </div>
                                  <div className="text-left">
                                    <label className="block text-[10px] uppercase font-black text-gray-500 mb-1.5 ml-1 select-none tracking-wider">
                                      Bairro / Região:
                                    </label>
                                    <input 
                                      required value={neighborhood} onChange={e => setNeighborhood(e.target.value)}
                                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[--theme-color] outline-none font-bold text-gray-800 placeholder-gray-400 text-sm shadow-xs"
                                      placeholder="Ex: Alecrim"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <input 
                                    value={reference} onChange={e => setReference(e.target.value)}
                                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[--theme-color] outline-none font-medium placeholder-gray-500"
                                    placeholder="Ponto de Ref. / Complemento (Opcional)"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {deliveryMethod === 'pickup' && settings.locationAddress && (
                          <div className="p-5 bg-stone-50 border border-gray-150 rounded-2xl flex items-start gap-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                            <div className="p-2 rounded-full bg-rose-50 border border-rose-100/50">
                              <MapPin className="w-5 h-5 text-rose-500 flex-shrink-0 animate-bounce" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-extrabold text-gray-900 mb-1 text-xs uppercase tracking-wider">Endereço da Loja para Retirada</h4>
                              {parsedLocation ? (
                                <div className="space-y-1 text-xs sm:text-sm text-gray-700 leading-relaxed font-semibold">
                                  <p className="text-gray-900 font-extrabold">{parsedLocation.street}</p>
                                  {(parsedLocation.neighborhood || parsedLocation.cityState) && (
                                    <p className="text-xs text-gray-500 font-bold">
                                      {[parsedLocation.neighborhood, parsedLocation.cityState].filter(Boolean).join(' - ')}
                                    </p>
                                  )}
                                  {parsedLocation.complement && (
                                    <p className="text-xs text-gray-400 italic font-medium">Ref: {parsedLocation.complement}</p>
                                  )}
                                  {parsedLocation.mapsLink && (
                                    <a 
                                      href={parsedLocation.mapsLink} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="inline-flex items-center gap-1.5 mt-2 bg-rose-500 hover:bg-rose-600 text-white font-extrabold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-sm hover:shadow"
                                    >
                                      🗺️ Ver no Google Maps
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-600 font-semibold">{settings.locationAddress}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ETAPA 3: FORMA DE PAGAMENTO & OBSERVAÇÃO */}
                    {checkoutSubStep === 'payment' && (
                      <div className="space-y-4 animate-in fade-in duration-300 text-left">
                        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex gap-3 items-center text-left mb-2">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
                            <span className="text-lg font-black">3</span>
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider">Forma de Pagamento</h4>
                            <p className="text-[10px] text-emerald-700 font-bold uppercase leading-tight">Escolha como prefere pagar o seu pedido</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {(settings?.acceptedPaymentMethods || ['pix', 'card', 'cash', 'debit']).map((method) => {
                                 const icons: Record<string, any> = {
                                   pix: <QrCode className="w-4 h-4" />,
                                   card: <CreditCard className="w-4 h-4" />,
                                   debit: <CreditCard className="w-4 h-4" />,
                                   cash: <Banknote className="w-4 h-4" />
                                 };
                                 const labels: Record<string, string> = {
                                   pix: 'PIX',
                                   card: 'CRÉDITO',
                                   debit: 'DÉBITO',
                                   cash: 'DINHEIRO'
                                 };
                                 const isActive = paymentMethod === method;
                                 
                                 return (
                                   <button
                                     key={method}
                                     type="button"
                                     onClick={() => setPaymentMethod(method)}
                                     className={`flex items-center gap-2 p-3.5 rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-wider ${
                                       isActive 
                                         ? 'bg-opacity-10 shadow-sm' 
                                         : 'border-gray-100 bg-white text-gray-400 hover:bg-gray-50'
                                     }`}
                                     style={isActive ? { borderColor: settings.primaryColor, color: settings.primaryColor, backgroundColor: `${settings.primaryColor}10` } : {}}
                                   >
                                     <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                                       {icons[method]}
                                     </div>
                                     {labels[method]}
                                   </button>
                                 );
                              })}
                           </div>

                           {paymentMethod === 'cash' && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-150 space-y-2.5 shadow-sm"
                              >
                                 <label className="block text-[11px] font-black text-emerald-800 uppercase tracking-widest">Vai precisar de troco?</label>
                                 <div className="relative">
                                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-sm">R$</span>
                                   <input 
                                     type="number"
                                     value={changeFor}
                                     onChange={e => setChangeFor(e.target.value)}
                                     placeholder="Ex: 50.00"
                                     className="w-full pl-11 pr-4 py-3 bg-white border border-emerald-200 rounded-xl focus:border-emerald-500 outline-none font-bold text-emerald-950 shadow-inner"
                                   />
                                 </div>
                                 <p className="text-[9px] text-emerald-600 font-bold uppercase italic">* Se não precisar, deixe em branco.</p>
                              </motion.div>
                           )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                              Observações do Pedido (Opcional)
                            </label>
                            <span className="text-[10px] text-gray-400 font-mono font-bold">{observation.length}/400 caracteres</span>
                          </div>
                          <textarea 
                            value={observation} 
                            onChange={e => setObservation(e.target.value.slice(0, 400))}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white outline-none focus:border-[--theme-color] transition-all duration-200 text-sm placeholder-gray-400 leading-normal font-semibold"
                            placeholder="Ex: Tirar a cebola, enviar sachês extras..."
                            rows={3}
                          />
                        </div>
                      </div>
                    )}
                  </form>
                </motion.div>
              )}

              {checkoutStep === 'schedule' && (
                <motion.div 
                  key="step-schedule"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 pb-4"
                >
                  <div className="text-center space-y-2 mb-6">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto shadow-sm border border-emerald-100 ring-8 ring-emerald-50/50">
                      <Calendar className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-black text-gray-900 tracking-tight">Reservar Horário</h3>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Sua Escolha • Seu Tempo</p>
                    </div>
                  </div>

                  <div className="space-y-5 p-6 bg-white border border-gray-150 rounded-[32px] shadow-sm">
                    <div className="space-y-3">
                       <div className="flex items-center justify-between">
                         <label className="block text-[11px] font-black uppercase tracking-widest text-emerald-600 ml-1">Data Fixada: {formattedScheduleDate}</label>
                         <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">Garantido</span>
                       </div>
                       <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div className="w-full pl-12 pr-4 py-4 bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl font-black text-emerald-900 shadow-sm transition-all text-lg">
                            {new Date(scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                          </div>
                       </div>
                       <p className="text-[10px] text-gray-400 font-bold ml-1 uppercase">Agendamentos são realizados exclusivamente para o próximo dia útil.</p>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Em qual horário prefere?</label>
                        <div className="grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                          <AnimatePresence>
                          {getTimeSlots.length > 0 ? getTimeSlots.map((time, idx) => (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.03, type: "spring", stiffness: 300, damping: 20 }}
                              key={time}
                              type="button"
                              onClick={() => setScheduledTime(time)}
                              className={`py-3 rounded-xl border-2 font-black text-sm transition-all active:scale-95 cursor-pointer ${scheduledTime === time ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'}`}
                            >
                              {time}
                            </motion.button>
                          )) : (
                            <motion.div 
                              initial={{ opacity: 0 }} 
                              animate={{ opacity: 1 }} 
                              className="col-span-3 py-8 text-center bg-rose-50 rounded-2xl border border-rose-100"
                            >
                              <p className="text-xs font-black text-rose-600 uppercase">A loja não abrirá na data ou não há horários disponíveis.</p>
                            </motion.div>
                          )}
                          </AnimatePresence>
                        </div>
                    </div>
                  </div>

                  <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100 flex gap-3 text-xs text-amber-800 font-bold leading-relaxed shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-600">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <p>A reserva garante sua preferência de horário, mas aguarda a confirmação definitiva da equipe da loja assim que iniciarem o expediente.</p>
                  </div>

                  <div className="flex justify-center pt-2">
                    <button 
                      type="button"
                      onClick={() => {
                         setIsScheduled(false);
                         setScheduledTime('');
                         if (!isCurrentlyOpen) {
                           setCheckoutStep('cart');
                         }
                      }}
                      className="text-[10px] sm:text-xs font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 bg-rose-50/50 px-4 py-2.5 rounded-xl border border-rose-100/50 active:scale-95 transition-all text-center flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Cancelar / Excluir Horário
                    </button>
                  </div>
                </motion.div>
              )}

              {checkoutStep === 'success' && placedOrder && (
                <motion.div 
                   key="step-success"
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ type: 'spring', damping: 20 }}
                   className="flex flex-col items-center justify-center text-center space-y-8 pt-8"
                >
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-white shadow-2xl relative"
                  >
                    <div className="absolute inset-0 bg-emerald-200 rounded-full animate-ping opacity-20" />
                    <Check className="w-12 h-12 text-emerald-600 z-10" />
                  </motion.div>
                  
                  <div>
                    <h3 className="text-3xl font-display font-black text-gray-900 tracking-tight mb-2">Quase lá!</h3>
                    <p className="text-gray-500 font-medium text-base leading-relaxed">
                      Seu pedido foi registrado. <br/>
                      <span className="font-bold text-gray-900">Finalize o envio via WhatsApp</span> para que possamos começar a preparar.
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6 w-full mt-4 text-left space-y-6 shadow-sm">
                    <div className="space-y-2 text-center">
                      <p className="text-[11px] tracking-[0.2em] text-gray-400 uppercase font-black">Código de Segurança</p>
                      <div className="text-3xl font-mono font-black tracking-widest text-gray-950 bg-white py-3 px-6 rounded-2xl border border-gray-200 shadow-sm inline-block mx-auto">
                        #{placedOrder.protocol}
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-3.5 items-center">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-gray-600 font-medium leading-relaxed">
                        Para retirada ou identificação, informe os 3 últimos dígitos: <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg font-black text-sm">{placedOrder.protocol.slice(-3)}</span>
                      </p>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-xs">
                      <h4 className="text-[10px] tracking-widest text-gray-300 uppercase font-black border-b border-gray-50 pb-2">Detalhes da Entrega</h4>
                      <div className="space-y-1 text-[13px] text-gray-700 font-bold">
                        <p className="flex justify-between"><span>Cliente:</span> <span className="text-gray-950">{placedOrder.customerName}</span></p>
                        {placedOrder.address && (
                          <p className="flex flex-col gap-1 pt-1"><span className="text-gray-400 font-black text-[10px] uppercase">Endereço:</span> <span>{placedOrder.address}</span></p>
                        )}
                        {placedOrder.observation && (
                          <div className="mt-3 p-3 bg-amber-50/40 border border-amber-100 rounded-xl">
                            <span className="text-[10px] text-amber-800 uppercase font-black tracking-widest block mb-1">Notas:</span>
                            <p className="text-amber-900 font-bold text-xs">{placedOrder.observation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <a 
                    href={whatsappCheckoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-5 rounded-2xl font-black text-white mt-8 bg-[#25D366] hover:bg-[#1DA851] transition-all flex items-center justify-center gap-3 shadow-xl shadow-green-500/20 active:scale-[0.98] cursor-pointer text-lg group"
                  >
                    Confirmar no WhatsApp <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                  
                  <button 
                    onClick={() => { setIsCartOpen(false); setCheckoutStep('cart'); }} 
                    className="text-gray-400 font-bold text-sm py-4 hover:text-gray-600 transition-colors"
                  >
                    Voltar ao Cardápio
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

            {/* Cart Footer */}
            {checkoutStep !== 'success' && cart.length > 0 && (
              <div className="p-5 bg-white border-t border-gray-100 pb-8 space-y-4 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                <div className="space-y-2 text-sm bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
                  <div className="flex items-center justify-between text-gray-500 font-semibold text-xs">
                    <span>Subtotal selecionado</span>
                    <span>R$ {cartTotal.toFixed(2)}</span>
                  </div>
                   {deliveryMethod === 'delivery' && selectedCityFee > 0 && (
                    <div className="flex items-center justify-between text-amber-805 text-xs font-bold">
                      <span className="flex items-center gap-1">
                        🛵 Entrega em {
                          (() => {
                            const foundZone = settings?.deliveryFees?.find(f => f.id === selectedCityId);
                            if (foundZone) {
                              return foundZone.neighborhood || foundZone.city || 'Região';
                            }
                            return 'Região';
                          })()
                        }
                      </span>
                      <span>R$ {selectedCityFee.toFixed(2)}</span>
                    </div>
                  )}
                  {deliveryMethod === 'delivery' && selectedCityFee === 0 && (
                    <div className="flex items-center justify-between text-gray-500 text-xs font-bold">
                      <span>🛵 Entrega Grátis</span>
                      <span className="font-extrabold text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">Grátis</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 font-display font-black text-gray-900 text-lg sm:text-xl">
                    <span className="flex flex-col">
                       Total
                       {deliveryMethod === 'delivery' && selectedCityFee > 0 && <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">(Itens + Entrega)</span>}
                    </span>
                    <span className="text-2xl sm:text-3xl" style={{ color: settings.primaryColor }}>R$ {(cartTotal + selectedCityFee).toFixed(2)}</span>
                  </div>
                </div>
                
                {settings?.minimumOrderValue && deliveryMethod === 'delivery' && cartTotal < settings.minimumOrderValue && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col gap-1 text-left animate-in fade-in duration-300">
                    <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Valor mínimo para entrega: R$ {settings.minimumOrderValue.toFixed(2)}</span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-amber-700 font-semibold">
                      Falta <strong className="font-extrabold text-amber-900">R$ {(settings.minimumOrderValue - cartTotal).toFixed(2)}</strong> para atingir o valor mínimo de entrega estabelecido pela loja.
                    </span>
                  </div>
                )}

                {validationError && (
                  <div id="validation-error" className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-700 text-xs font-semibold text-center flex items-center justify-center gap-2 animate-in slide-in-from-top-1 duration-200 shadow-sm">
                    <span>⚠️ {validationError}</span>
                  </div>
                )}

                {isScheduled && (
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-black uppercase text-emerald-700 tracking-tight leading-tight mb-0.5">🗓️ Reserva para {formattedScheduleDate} Ativada</p>
                        <p className="text-[10px] text-emerald-600 font-bold leading-none">Você está montando seu pedido para ser entregue no horário escolhido.</p>
                      </div>
                    </div>
                    <button 
                       onClick={() => {
                         setIsScheduled(false);
                         setScheduledTime('');
                         if (!isCurrentlyOpen) setCheckoutStep('cart');
                       }}
                       className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 px-3 py-1.5 rounded-lg active:scale-95 transition-all text-center self-start mt-1 -mb-1 ml-[3.25rem] cursor-pointer"
                     >
                       Remover Reserva
                     </button>
                   </div>
                 )}

                 <AnimatePresence mode="wait">
                  {checkoutStep === 'cart' ? (
                    <motion.button 
                      key="btn-cart"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      onClick={() => {
                        if (!isCurrentlyOpen && !isScheduled) {
                          setShowClosedWarningModal(true);
                          return;
                        }

                        if (settings?.minimumOrderValue && deliveryMethod === 'delivery' && cartTotal < settings.minimumOrderValue) {
                          const msg = `O valor mínimo para entrega é de R$ ${settings.minimumOrderValue.toFixed(2)}. Atualmente R$ ${cartTotal.toFixed(2)}.`;
                          setValidationError(msg);
                          
                          setAlertModal({
                            isOpen: true,
                            title: 'Valor Mínimo Não Atingido',
                            message: msg,
                            type: 'warning'
                          });
                          
                          setTimeout(() => {
                             const errEl = document.getElementById('validation-error');
                             if (errEl) {
                               errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                               errEl.classList.remove('animate-shake');
                               void errEl.offsetWidth;
                               errEl.classList.add('animate-shake');
                             }
                          }, 100);
                          return;
                        }
                        setValidationError('');
                        setCheckoutStep('address');
                        setCheckoutSubStep('personal');
                      }}
                      className="w-full py-5 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer group border border-white/10"
                    >
                       <span>{isScheduled ? 'Reservar e Continuar' : 'Continuar Compra'}</span>
                       <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-emerald-400" />
                    </motion.button>
                  ) : checkoutStep === 'address' ? (
                    <motion.div 
                      key={`btn-address-${checkoutSubStep}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="w-full flex flex-col gap-2"
                    >
                      <button 
                        type="button"
                        onClick={() => {
                          setValidationError('');
                          if (checkoutSubStep === 'personal') {
                            if (!customerName.trim()) {
                              setValidationError('Por favor, informe seu nome completo.');
                              return;
                            }
                            if (customerPhone.replace(/\D/g, '').length < 10) {
                              setValidationError('Por favor, informe um WhatsApp válido com DDD.');
                              return;
                            }
                            setCheckoutSubStep('delivery_address');
                          } else if (checkoutSubStep === 'delivery_address') {
                            if (deliveryMethod === 'delivery') {
                              if (!street.trim() || !number.trim()) {
                                setValidationError('Por favor, preencha a rua e o número.');
                                return;
                              }
                              if (!city.trim() || !neighborhood.trim()) {
                                setValidationError('Por favor, preencha a cidade e o bairro.');
                                return;
                              }
                            }
                            setCheckoutSubStep('payment');
                          } else {
                            // payment step - final submit!
                            if (isScheduled) {
                              setCheckoutStep('schedule');
                            } else {
                              triggerManualSubmit();
                            }
                          }
                        }}
                        disabled={isSubmitting}
                        className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black shadow-2xl active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 group border-b-4 border-emerald-800 animate-in fade-in duration-200"
                      >
                        {isSubmitting ? (
                            <>
                              <RefreshCw className="w-5 h-5 animate-spin" />
                              <span>Processando...</span>
                            </>
                        ) : (
                          <>
                            <span>
                              {checkoutSubStep === 'personal' ? 'Avançar para Entrega' : checkoutSubStep === 'delivery_address' ? 'Avançar para Pagamento' : isScheduled ? 'Confirmar Reserva' : 'Finalizar Pedido'}
                            </span>
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setValidationError('');
                          if (checkoutSubStep === 'personal') {
                            setCheckoutStep('cart');
                          } else if (checkoutSubStep === 'delivery_address') {
                            setCheckoutSubStep('personal');
                          } else {
                            setCheckoutSubStep('delivery_address');
                          }
                        }}
                        className="w-full py-3 text-gray-500 hover:text-gray-800 text-xs font-black uppercase tracking-widest transition-colors cursor-pointer animate-in fade-in duration-200"
                      >
                        Voltar Etapa
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button 
                      key="btn-schedule"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      onClick={() => {
                        if (!scheduledDate || !scheduledTime) {
                          setValidationError('Escolha data e horário.');
                          return;
                        }
                        triggerManualSubmit();
                      }}
                      disabled={isSubmitting}
                      className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-2xl hover:bg-emerald-500 active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 group border-b-4 border-emerald-800"
                    >
                      {isSubmitting ? 'Agendando...' : 'Confirmar Reserva e Pedir'}
                      {!isSubmitting && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
             )}
           </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Meus Pedidos Modal */}
      <AnimatePresence>
      {isOrdersHistoryOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white max-w-xl w-full rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-gray-100"
          >
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-wide">Meus Pedidos</h3>
              </div>
              <button 
                onClick={() => {
                  setIsOrdersHistoryOpen(false);
                  setSelectedHistoryOrder(null);
                }} 
                className="p-1.5 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-5 bg-gray-50/50 space-y-4">
              {selectedHistoryOrder ? (
                // Order Detail View
                <div className="space-y-5 animate-in slide-in-from-right-3 duration-200">
                  <button 
                    onClick={() => setSelectedHistoryOrder(null)} 
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase cursor-pointer"
                  >
                    &larr; Voltar para a Lista
                  </button>

                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                      <div>
                        <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Código de Segurança</p>
                        <p className="text-xl font-mono font-bold tracking-wider text-gray-950">{selectedHistoryOrder.protocol}</p>
                      </div>
                      
                      {/* Status label with badge */}
                      {(() => {
                        const status = selectedHistoryOrder.status || 'pending';
                        const labels: Record<string, { text: string; bg: string; txt: string; desc: string }> = {
                          pending: { text: 'Aguardando', bg: 'bg-amber-100', txt: 'text-amber-800', desc: 'Aguardando confirmação do estabelecimento.' },
                          preparing: { text: 'Preparando', bg: 'bg-blue-100', txt: 'text-blue-800', desc: 'Seu pedido já está sendo preparado com muito carinho.' },
                          delivery: { text: 'Em Rota', bg: 'bg-purple-100', txt: 'text-purple-800', desc: 'O entregador/motoboy já saiu para realizar a entrega.' },
                          pickup: { text: 'Retirada', bg: 'bg-indigo-100', txt: 'text-indigo-800', desc: 'Seu pedido está pronto! Venha fazer a retirada.' },
                          completed: { text: 'Finalizado', bg: 'bg-emerald-100', txt: 'text-emerald-800', desc: 'Pedido concluído com sucesso. Bom apetite!' },
                        };
                        const setup = labels[status] || labels.pending;
                        return (
                          <div className="text-right">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${setup.bg} ${setup.txt}`}>
                              {setup.text}
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Status detailed description */}
                    {(() => {
                      const status = selectedHistoryOrder.status || 'pending';
                      const descriptions: Record<string, string> = {
                        pending: 'Aguardando confirmação do estabelecimento...',
                        preparing: 'Preparando: Seu pedido está na cozinha ou em separação!',
                        delivery: 'Em rota: O entregador já saiu e está a caminho!',
                        pickup: 'Pronto: Pode vir retirar o seu pedido!',
                        completed: 'Entregue: Pedido finalizado com sucesso!',
                      };
                      return (
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-150 text-xs font-semibold text-gray-700 leading-normal">
                          {descriptions[status] || descriptions.pending}
                        </div>
                      );
                    })()}

                    {/* Order summary info */}
                    <div className="text-xs space-y-1.5 text-gray-600">
                      <p><strong>Cliente:</strong> {selectedHistoryOrder.customerName}</p>
                      <p><strong>Data:</strong> {new Date(selectedHistoryOrder.createdAt).toLocaleString('pt-BR')}</p>
                      {selectedHistoryOrder.address && (
                        <div className="space-y-1">
                          <p><strong>Entrega:</strong> {selectedHistoryOrder.address}</p>
                          {(selectedHistoryOrder.deliveryFee !== undefined || selectedHistoryOrder.deliveryZone !== undefined) && (
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">
                              Região: {selectedHistoryOrder.deliveryZone || 'Desconhecida'} | Taxa: R$ {(selectedHistoryOrder.deliveryFee || 0).toFixed(2)}
                            </p>
                          )}
                        </div>
                      )}
                      {selectedHistoryOrder.observation && (
                        <div className="bg-yellow-50/70 p-3 rounded-lg border border-yellow-250/50 mt-3 text-yellow-905">
                          <strong className="text-yellow-950 text-[10px] font-black uppercase tracking-widest block mb-1">Observações e Instruções:</strong>
                          <p className="whitespace-pre-wrap break-words leading-relaxed font-semibold">{selectedHistoryOrder.observation}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                    <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Itens Pedidos</h4>
                    <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto pr-1">
                      {selectedHistoryOrder.items.map((item, idx) => {
                        const product = products.find(p => p.id === item.productId);
                        let name = product ? product.name : 'Produto';
                        if (item.flavors && item.flavors.length > 0) {
                          name += ` de ${item.flavors.join(', ')}`;
                        }
                        const itemPrice = product ? Number(product.price || 0) : 0;
                        const addonsPrice = (item.addons || []).reduce((acc, a) => acc + Number(a.price || 0), 0);
                        return (
                          <div key={idx} className="py-2 flex items-start justify-between text-xs font-medium">
                            <div>
                              <p className="text-gray-900 font-bold"><span style={{ color: settings.primaryColor }} className="font-extrabold">{item.quantity}x</span> {name}</p>
                              {item.addons && item.addons.length > 0 && (
                                <p className="text-[10px] text-gray-500 pl-4 mt-0.5 font-semibold">
                                  🧩 Adicionais: {item.addons.map(a => `${a.name} (+R$ ${Number(a.price || 0).toFixed(2)})`).join(', ')}
                                </p>
                              )}
                            </div>
                            <span className="text-gray-900 font-bold">R$ {((itemPrice + addonsPrice) * item.quantity).toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-gray-100 pt-3 space-y-2">
                      {selectedHistoryOrder.deliveryFee !== undefined && selectedHistoryOrder.deliveryFee > 0 && (
                        <>
                          <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
                            <span>Subtotal</span>
                            <span>R$ {(Number(selectedHistoryOrder.totalPrice) - selectedHistoryOrder.deliveryFee).toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
                            <span>Taxa de Entrega</span>
                            <span>R$ {selectedHistoryOrder.deliveryFee.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex items-center justify-between font-black text-sm text-gray-900 pt-1">
                        <span>Total do Pedido</span>
                        <span className="text-base" style={{ color: settings.primaryColor }}>R$ {Number(selectedHistoryOrder.totalPrice).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button 
                      onClick={() => window.open(generateWhatsAppUrl(selectedHistoryOrder), '_blank')}
                      className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#1DA851] text-white font-extrabold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer shadow-md"
                    >
                      <ShoppingBag className="w-4 h-4" /> Reenviar para o WhatsApp
                    </button>
                    <button 
                      onClick={() => setSelectedHistoryOrder(null)}
                      className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-xs cursor-pointer"
                    >
                      Voltar para a Lista
                    </button>
                  </div>
                </div>
              ) : customerOrders.length === 0 ? (
                // Empty view
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                    <Package className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-800">Nenhum pedido encontrado</h4>
                    <p className="text-xs text-gray-500 max-w-xs mt-1">Seus pedidos ficarão salvos aqui de forma 100% segura para você acompanhar o andamento.</p>
                  </div>
                </div>
              ) : (
                // Orders List
                <div className="space-y-3">
                  <p className="text-[11px] text-gray-500 font-bold mb-1">Toque em qualquer pedido abaixo para acompanhar o status em tempo real:</p>
                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                      {customerOrders.map((order) => {
                        const status = order.status || 'pending';
                        const labels: Record<string, { text: string; bg: string; txt: string }> = {
                          pending: { text: 'Pedido Recebido', bg: 'bg-amber-100', txt: 'text-amber-800' },
                          preparing: { text: 'Preparando', bg: 'bg-blue-100', txt: 'text-blue-800' },
                          delivery: { text: 'Em Rota', bg: 'bg-purple-100', txt: 'text-purple-800' },
                          pickup: { text: 'Pronto Retirada', bg: 'bg-indigo-100', txt: 'text-indigo-800' },
                          completed: { text: 'Finalizado', bg: 'bg-emerald-100', txt: 'text-emerald-800' },
                        };
                        const setup = labels[status] || labels.pending;
                        const orderDate = new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                        const countItens = order.items.reduce((acc, it) => acc + it.quantity, 0);

                        return (
                          <motion.div 
                            key={order.id}
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="overflow-hidden"
                          >
                            <div 
                              onClick={() => setSelectedHistoryOrder(order)}
                              className="bg-white p-4 rounded-xl border border-gray-250/70 hover:border-gray-350 shadow-sm hover:shadow hover:scale-[1.01] transition-all cursor-pointer text-left flex items-center justify-between gap-4 group"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-black text-gray-900 text-sm">#{order.protocol.slice(-6).toUpperCase()}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${setup.bg} ${setup.txt}`}>
                                    {setup.text}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-400 font-semibold">{orderDate} &bull; {countItens} {countItens === 1 ? 'item' : 'itens'}</p>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <div className="text-right shrink-0">
                                  <p className="text-sm font-black text-gray-900 leading-none">R$ {Number(order.totalPrice).toFixed(2)}</p>
                                  <p className="text-[10px] text-gray-400 font-bold hover:underline group-hover:text-emerald-600 transition-colors mt-1">Ver status &rarr;</p>
                                </div>
                                <div className="relative">
                                  <AnimatePresence mode="wait">
                                    {confirmDeleteOrderId === order.id ? (
                                      <motion.button 
                                        key="confirm"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteOrderFromHistory(order.id);
                                        }}
                                        className="px-3 py-2 bg-rose-500 text-white text-[10px] font-black uppercase rounded-lg shadow-sm active:scale-95"
                                      >
                                        CONFIRMAR?
                                      </motion.button>
                                    ) : (
                                      <motion.button 
                                        key="trash"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setConfirmDeleteOrderId(order.id);
                                          setTimeout(() => setConfirmDeleteOrderId(null), 3000);
                                        }}
                                        className="p-2 bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-all active:scale-90"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </motion.button>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-white">
              <button 
                onClick={() => {
                  setIsOrdersHistoryOpen(false);
                  setSelectedHistoryOrder(null);
                }}
                className="w-full py-3 bg-gray-950 hover:bg-gray-800 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer"
              >
                Retornar ao Catálogo
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* DETAILED HOURS CALENDAR MODAL */}
      <AnimatePresence>
      {showHoursModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-55"
          onClick={() => setShowHoursModal(false)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-150 flex flex-col gap-4 max-h-[85vh] overflow-y-auto scrollbar-thin"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Horários & Endereço</h3>
              </div>
              <button 
                onClick={() => setShowHoursModal(false)}
                className="p-1 px-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500 font-extrabold text-xs transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>

            {settings?.is24Hours ? (
              <div className="flex flex-col items-center justify-center p-6 text-center gap-3">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
                  <Clock className="w-6 h-6" />
                </div>
                <h4 className="font-black text-gray-900 text-lg">Aberto 24 Horas</h4>
                <p className="text-xs font-semibold text-gray-500">Esta loja funciona 24 horas por dia, todos os dias da semana. Faça seu pedido a qualquer momento!</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {[
                  { index: 1, label: 'Segunda-feira' },
                  { index: 2, label: 'Terça-feira' },
                  { index: 3, label: 'Quarta-feira' },
                  { index: 4, label: 'Quinta-feira' },
                  { index: 5, label: 'Sexta-feira' },
                  { index: 6, label: 'Sábado' },
                  { index: 0, label: 'Domingo' },
                ].map((day) => {
                  const now = new Date();
                  const isToday = now.getDay() === day.index;
                  
                  const sched = settings?.weeklySchedules?.find(s => s.dayIndex === day.index);
                  const isOpenToday = sched ? sched.isOpen : (settings?.openingTime && settings?.closingTime ? true : false);
                  
                  return (
                    <div 
                      key={day.index} 
                      className={`p-2.5 rounded-xl border flex flex-col gap-1 transition-all ${
                        isToday 
                          ? 'bg-emerald-50/40 border-emerald-500/30 ring-1 ring-emerald-500/20 shadow-xs' 
                          : 'bg-gray-50/50 border-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-black uppercase tracking-wider ${isToday ? 'text-emerald-950 font-black' : 'text-gray-500 font-bold'}`}>
                          {day.label} {isToday && ' (Hoje) 📍'}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isOpenToday ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          {isOpenToday ? 'Aberto' : 'Fechado'}
                        </span>
                      </div>

                      {isOpenToday && (
                        <div className="text-[11px] font-bold text-gray-800 flex flex-wrap items-center gap-1.5 leading-relaxed">
                          <span>🕒 Expediente: <strong className="text-emerald-700">{sched?.openingTime || settings?.openingTime} às {sched?.closingTime || settings?.closingTime}</strong></span>
                          {sched?.hasLunchBreak && sched.lunchBreakStart && sched.lunchBreakEnd && (
                            <span className="bg-orange-105 text-orange-900 border border-orange-200 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase">
                              😴 Pausa Almoço: {sched.lunchBreakStart} às {sched.lunchBreakEnd}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {settings?.openingHours && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100" style={{ backgroundColor: '#fffbeb', borderColor: '#fef3c7' }}>
                <p className="text-[9px] font-black text-amber-900 uppercase tracking-wide">Observação:</p>
                <p className="text-[11px] font-bold text-amber-955 leading-normal mt-0.5" style={{ color: '#78350f' }}>{settings.openingHours}</p>
              </div>
            )}

            {/* Endereço da loja integrado */}
            {settings?.locationAddress && (
              <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="w-4 h-4 text-rose-500 animate-bounce" />
                  <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Endereço da Loja</h4>
                </div>
                
                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100 space-y-2 text-[11px] font-semibold text-gray-700">
                  {parsedLocation && (parsedLocation.street || parsedLocation.neighborhood || parsedLocation.cityState) ? (
                    <div className="space-y-2">
                      {parsedLocation.street && (
                        <div>
                          <span className="text-[8px] uppercase tracking-wider font-extrabold text-gray-400 block mb-0.5">Rua e Número</span>
                          <p className="font-bold text-gray-800 leading-snug">{parsedLocation.street}</p>
                        </div>
                      )}
                      {parsedLocation.neighborhood && (
                        <div>
                          <span className="text-[8px] uppercase tracking-wider font-extrabold text-gray-400 block mb-0.5">Bairro / Setor</span>
                          <p className="font-bold text-gray-800 leading-snug">{parsedLocation.neighborhood}</p>
                        </div>
                      )}
                      {parsedLocation.cityState && (
                        <div>
                          <span className="text-[8px] uppercase tracking-wider font-extrabold text-gray-400 block mb-0.5">Cidade & Estado</span>
                          <p className="font-bold text-gray-800 leading-snug">{parsedLocation.cityState}</p>
                        </div>
                      )}
                      {parsedLocation.complement && (
                        <div className="pt-2 border-t border-gray-200/50">
                          <span className="text-[8px] uppercase tracking-wider font-extrabold text-rose-500 block mb-0.5">Ponto de Referência</span>
                          <p className="font-bold text-gray-600 leading-relaxed italic">"{parsedLocation.complement}"</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <span className="text-[8px] uppercase tracking-wider font-extrabold text-gray-400 block mb-0.5">Localização do Estabelecimento</span>
                      <p className="font-bold text-gray-800 leading-snug">{settings.locationAddress}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2.5 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const fullAddrText = `${parsedLocation.street || ''}, ${parsedLocation.neighborhood || ''} - ${parsedLocation.cityState || ''} (${parsedLocation.complement || ''})`;
                      navigator.clipboard.writeText(fullAddrText);
                      setAddressCopied(true);
                      setTimeout(() => setAddressCopied(false), 2000);
                    }}
                    className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-800 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none"
                  >
                    {addressCopied ? '✅ Copiado!' : '📋 Copiar'}
                  </button>

                  {parsedLocation.mapsLink && (
                    <a
                      href={parsedLocation.mapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 text-white active:scale-95 rounded-lg font-black text-[10px] uppercase tracking-wider text-center flex items-center justify-center gap-1 transition-all cursor-pointer no-underline"
                      style={{ backgroundColor: settings?.primaryColor || '#10b981' }}
                    >
                      🗺️ Google Maps
                    </a>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* STORE CLOSED ANIMATED NOTICE MODAL */}
      <AnimatePresence>
      {showClosedWarningModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110]"
          onClick={() => setShowClosedWarningModal(false)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-100 flex flex-col items-center text-center gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glowing clock icon */}
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 border border-rose-100 shadow-inner animate-pulse">
              <Clock className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-gray-950 mb-2">Loja Fechada ⏳</h3>
              <p className="text-sm text-gray-550 font-medium">
                No momento não estamos recebendo pedidos.
              </p>
            </div>

            {/* Current status display */}
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-150 w-full text-xs font-semibold text-gray-750 flex flex-col gap-1 items-center">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400">Status Atual:</span>
              <span className="text-rose-600 font-bold uppercase">{storeStatus.text}</span>
            </div>

            <div className="flex flex-col gap-2.5 w-full">
              <button 
                onClick={() => {
                  setShowClosedWarningModal(false);
                  setIsScheduled(true);
                  if (checkoutStep === 'cart') setCheckoutStep('address');
                }}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:brightness-[1.05] active:scale-95 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Reservar para depois 📅
              </button>

              <button 
                onClick={() => {
                  setShowClosedWarningModal(false);
                  setShowHoursModal(true);
                }}
                className="w-full py-3.5 text-gray-700 bg-gray-100 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-gray-200 active:scale-95 transition-all cursor-pointer"
              >
                Ver Horários 🕒
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* LUXURIOUS LOCATION DETAIL MODAL */}
      <AnimatePresence>
      {showLocationModal && parsedLocation && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-[120]"
          onClick={() => {
            setShowLocationModal(false);
            setAddressCopied(false);
          }}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-150 flex flex-col gap-5 relative overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 inset-x-0 h-1.5" style={{ backgroundColor: settings?.primaryColor || '#e11d48' }} />

            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mt-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rose-500 animate-bounce" />
                <h3 className="text-xs font-black text-gray-905 uppercase tracking-widest">Endereço Físico ⚜️</h3>
              </div>
              <button 
                onClick={() => {
                  setShowLocationModal(false);
                  setAddressCopied(false);
                }}
                className="p-1.5 px-3 bg-gray-50 hover:bg-gray-100 active:scale-95 text-gray-500 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Main Address */}
              <div className="p-4 bg-gray-50/75 rounded-2xl border border-gray-100/80 space-y-3">
                {parsedLocation.street && (
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 block mb-0.5">Rua e Número</span>
                    <p className="text-xs font-bold text-gray-850 leading-snug">{parsedLocation.street}</p>
                  </div>
                )}
                
                {parsedLocation.neighborhood && (
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 block mb-0.5">Bairro / Setor</span>
                    <p className="text-xs font-bold text-gray-750 leading-snug">{parsedLocation.neighborhood}</p>
                  </div>
                )}

                {parsedLocation.cityState && (
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 block mb-0.5">Cidade &amp; Estado</span>
                    <p className="text-xs font-bold text-gray-755 leading-snug">{parsedLocation.cityState}</p>
                  </div>
                )}

                {parsedLocation.complement && (
                  <div className="pt-2 border-t border-gray-200/50">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-rose-500 block mb-0.5">Ponto de Referência</span>
                    <p className="text-xs font-bold text-gray-600 leading-relaxed italic">"{parsedLocation.complement}"</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const fullAddrText = `${parsedLocation.street || ''}, ${parsedLocation.neighborhood || ''} - ${parsedLocation.cityState || ''} (${parsedLocation.complement || ''})`;
                    navigator.clipboard.writeText(fullAddrText);
                    setAddressCopied(true);
                    setTimeout(() => setAddressCopied(false), 2000);
                  }}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-800 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  {addressCopied ? '✅ Copiado com sucesso!' : '📋 Copiar Endereço'}
                </button>

                {parsedLocation.mapsLink && (
                  <a
                    href={parsedLocation.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 text-white active:scale-95 rounded-xl font-black text-xs uppercase tracking-widest text-center flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                    style={{ backgroundColor: settings?.primaryColor || '#e11d48' }}
                  >
                    🗺️ Abrir no Google Maps Rápido
                  </a>
                )}
              </div>

              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100/50 text-center flex items-center justify-center">
                <span className="text-[10px] text-rose-700 font-bold leading-normal">
                  Selecione "Retirada" ao finalizar a sacola! 🛍️
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
      {/* GLOBAL ALERT MODAL (Replaces window.alert) */}
      <AnimatePresence>
        {alertModal.isOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[120]"
            onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 flex flex-col items-center text-center gap-5 overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top accent line */}
              <div 
                className={`absolute top-0 inset-x-0 h-1.5 ${
                  alertModal.type === 'warning' ? 'bg-amber-400' : 
                  alertModal.type === 'success' ? 'bg-emerald-500' : 
                  'bg-blue-500'
                }`} 
              />

              <div className={`w-16 h-16 rounded-full flex items-center justify-center border shadow-sm ${
                  alertModal.type === 'warning' ? 'bg-amber-50 text-amber-500 border-amber-100' : 
                  alertModal.type === 'success' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 
                  'bg-blue-50 text-blue-500 border-blue-100'
                }`}>
                {alertModal.type === 'warning' ? <AlertTriangle className="w-8 h-8" /> : 
                 alertModal.type === 'success' ? <Check className="w-8 h-8" /> : 
                 <ShieldAlert className="w-8 h-8" />}
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-2">{alertModal.title}</h3>
                <p className="text-sm text-gray-550 font-semibold leading-relaxed">
                  {alertModal.message}
                </p>
              </div>

              <button 
                onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
                className="w-full py-4 text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:brightness-[1.05] active:scale-95 transition-all cursor-pointer shadow-md"
                style={{ backgroundColor: settings?.primaryColor || '#10b981' }}
              >
                Entendido, continuar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer with branding and policies */}
      <footer className="mt-12 py-12 border-t border-gray-100 flex flex-col items-center gap-6">
        <div className="flex items-center gap-2 grayscale opacity-50 hover:opacity-100 transition-opacity">
          <span className="text-sm font-black tracking-tight text-gray-900">Cardapp<span className="text-emerald-500">.</span></span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cardápio Digital</span>
        </div>
        
        <div className="flex flex-wrap justify-center gap-6">
          <Link to="/termos-e-privacidade" className="text-xs font-bold text-gray-400 hover:text-emerald-600 transition-colors">Termos de Uso</Link>
          <Link to="/termos-e-privacidade" className="text-xs font-bold text-gray-400 hover:text-emerald-600 transition-colors">Privacidade</Link>
          <Link to="/" className="text-xs font-bold text-gray-400 hover:text-emerald-600 transition-colors">Criar minha Loja</Link>
        </div>

        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
          © {new Date().getFullYear()} Cardapp Brasil
        </p>
      </footer>
    </div>
  );
}
