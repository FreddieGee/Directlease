export type UserType = 'landlord' | 'seller' | 'tenant' | 'buyer' | 'admin';

export type PropertyType = 'lease' | 'sale';

export type PropertyCategory = 
  | 'self-contained-studio'
  | 'bedroom-flat'
  | 'bungalow'
  | 'duplex'
  | 'shop'
  | 'shared-apartment'
  | 'student-accommodation'
  | 'house'
  | 'land'
  | 'other';

export type ListingStatus = 'pending' | 'approved' | 'rejected' | 'sold' | 'leased' | 'inactive';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';
export type TransactionStatus = 'pending' | 'completed' | 'cancelled' | 'disputed';
export type ViewingRequestStatus = 'pending' | 'agreed' | 'rescheduled' | 'cancelled' | 'completed';

export interface User {
  id: string;
  user_type: UserType;
  email: string;
  password_hash: string;
  name: string;
  phone?: string;
  tc_accepted: boolean;
  verification_status: VerificationStatus;
  created_at: Date;
  updated_at: Date;
}

export interface LandlordVerificationDoc {
  id: string;
  user_id: string;
  nin: string;
  home_address: string;
  utility_bill_url: string;
  nin_slip_url: string;
  profile_pic_url: string;
  status: VerificationStatus;
  admin_notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TenantVerificationDoc {
  id: string;
  user_id: string;
  nin: string;
  phone: string;
  profile_pic_url: string;
  email: string;
  status: VerificationStatus;
  admin_notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Property {
  id: string;
  landlord_id: string;
  type: PropertyType;
  category: PropertyCategory;
  title: string;
  description: string;
  price_naira: number;
  photos_urls: string[];
  videos_urls: string[];
  address: string;
  city: string;
  state: string;
  status: ListingStatus;
  is_featured: boolean;
  ease_of_business_badge: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ViewingSlot {
  id: string;
  property_id: string;
  date: Date;
  time_start: string;
  time_end: string;
  is_available: boolean;
}

export interface ViewingRequest {
  id: string;
  property_id: string;
  tenant_id: string;
  slot_id: string;
  status: ViewingRequestStatus;
  created_at: Date;
  updated_at: Date;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  property_id: string;
  message: string;
  is_read: boolean;
  created_at: Date;
}

export interface Subscription {
  id: string;
  user_id: string;
  user_type: UserType;
  plan: string;
  start_date: Date;
  end_date: Date;
  status: SubscriptionStatus;
  created_at: Date;
}

export interface Transaction {
  id: string;
  property_id: string;
  landlord_id: string;
  tenant_id: string;
  amount: number;
  service_fee: number;
  buyer_protection_legal?: number;
  buyer_protection_bgcheck?: number;
  seller_protection?: number;
  status: TransactionStatus;
  created_at: Date;
  updated_at: Date;
}

export interface PriceReduction {
  id: string;
  property_id: string;
  landlord_id: string;
  old_price: number;
  new_price: number;
  created_at: Date;
}

export interface TermsAcceptance {
  id: string;
  user_id: string;
  accepted_at: Date;
  ip_address: string;
}