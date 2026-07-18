export type DeliveryMethod = 'delivery' | 'pickup';
export type PaymentMethod = 'pix' | 'card' | 'cash' | 'debit';
export type OrderStatus = 'pending' | 'preparing' | 'delivery' | 'pickup' | 'completed' | 'canceled';

export interface ProductAddon {
  id?: string;
  name: string;
  price: number;
  isAvailable?: boolean;
  category?: string; // Addon Category (e.g. Acompanhamentos, Bebidas, Carne)
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  image: string; // Base64
  promotion: boolean;
  isAvailable?: boolean;
  category?: string;
  addons?: ProductAddon[];
  flavors?: string[];
  unavailableFlavors?: string[];
  promoQuantity?: number;
  promoPrice?: number;
  promoGroup?: string;
  stockCount?: number;
  stockUnit?: 'unidade' | 'kilo' | 'litro' | 'caixa' | 'bandeja' | 'pacote';
}

export interface DeliveryZone {
  id: string;
  state: string;
  city: string;
  zone?: string;
  neighborhood: string;
  fee: number;
  deliveryTime?: string;
}

export interface DaySchedule {
  dayIndex: number; // 0 = Domingo, 1 = Segunda, etc.
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
  hasLunchBreak: boolean;
  lunchBreakStart?: string;
  lunchBreakEnd?: string;
}

export interface StoreSettings {
  storeName: string;
  primaryColor: string;
  whatsappNumber?: string;
  storeSlug?: string;
  openingHours?: string;
  description?: string;
  logo?: string; // Base64 representation of the logo
  storeNameFirst?: string;
  storeNameFirstColor?: string;
  businessType?: 'hortifruti' | 'livraria' | 'marmitaria' | 'lanchonete' | 'outros';
  categories?: string[];
  locationAddress?: string;
  isOpen?: boolean;
  fontFamily?: string;
  createdAt?: string;
  customerFontSize?: number;
  headerFontSize?: number;
  deliveryFees?: DeliveryZone[];
  blockOutsideDelivery?: boolean;
  storeType?: 'delivery_and_pickup' | 'only_delivery' | 'only_pickup';
  weeklySchedules?: DaySchedule[];
  planType?: 'free' | 'monthly' | 'quarterly';
  planStartDate?: string;
  coverImage?: string; // Base64 representation of the cover image
  minimumOrderValue?: number; // Minimum order amount
  ceoName?: string;
  deliveryTime?: string;
  printMode?: 'manual' | 'auto';
  productOrder?: 'name-first' | 'price-first';

  // Horários de funcionamento
  openingTime?: string;
  closingTime?: string;
  is24Hours?: boolean;
  acceptedPaymentMethods?: PaymentMethod[];
  
  // Agendamento
  allowScheduling?: boolean;
  schedulingDate?: string;
  blockTakenSlots?: boolean;
  customTimeSlots?: string[];
  manualBlockedSlots?: Record<string, string[]>;
  
  // Redes Sociais
  instagramUrl?: string;
  facebookUrl?: string;
  websiteUrl?: string;
  storeTagline?: string;
}

export interface OrderItemAddon {
  name: string;
  price: number;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  addons?: OrderItemAddon[];
  flavors?: string[];
}

export interface Order {
  id: string;
  protocol: string; // 8 characters, letters and numbers; last 3 used for verification
  customerName: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  changeFor?: number;
  observation?: string;
  address?: string; // If delivery
  deliveryFee?: number;
  deliveryZone?: string;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
  stockReduced?: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
}
