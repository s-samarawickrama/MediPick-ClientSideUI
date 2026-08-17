export interface CustomerUser {
  phoneNumber: string;
  surname: string;
  email?: string;
  isLoggedIn: boolean;
  strikes: number;
}

export type FSMOrderState =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PRESCRIPTION_VALIDATION'
  | 'AWAITING_PRESCRIPTION_UPLOAD'
  | 'WAITING_PHARMACY_CONFIRMATION'
  | 'WAITING_CUSTOMER_CONFIRMATION'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CLOSED'
  | 'ISSUE_REPORTED'
  | 'UNDER_REVIEW'
  | 'RESOLVED'
  | 'REJECTED'
  | 'REUPLOAD_REQUESTED';

export type OrderType = 'OTC' | 'PRESCRIPTION' | 'MIXED';

export interface MedicineItem {
  id: string;
  name: string;
  genericName: string;
  dosage: string;
  mrpPrice: number;
  pharmacyPrice: number;
  isRxRequired: boolean;
  category: 'Cold & Flu' | 'First Aid' | 'Vitamins' | 'Personal Care' | 'Chronic' | 'Skincare' | 'Supplements';
  inStock: boolean;
  availableAtPharmacyIds?: string[]; // Array of pharmacy IDs where this is available
  popularity?: number; // 0-100 rating for sorting
  image?: string | any;
  description?: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  distance: string;
  rating: number;
  popularity?: number; // 0-100 rating for sorting
  nmraLicense: string;
  pharmacistName: string;
  pharmacistRegNo: string;
  estimatedResponseTime: string;
  isOpen: boolean;
  isFavorite?: boolean;
  hasOffer?: boolean;
  offerTag?: string;
  image?: string | any;
  latitude?: number;
  longitude?: number;
}

export interface PrescriptionQuoteItem {
  medicineName: string;
  genericName: string;
  mrp: number;
  quotedPrice: number;
  quantity: number;
  isAlternative?: boolean;
  originalPrescribed?: string;
}

export interface PharmacyQuote {
  pharmacyId: string;
  pharmacyName: string;
  pharmacistName: string;
  pharmacistRegNo: string;
  nmraLicense: string;
  items: PrescriptionQuoteItem[];
  totalAmount: number;
  totalMrp: number;
  validUntil: string; // ISO String
}

export interface Order {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  state: FSMOrderState;
  pharmacy?: Pharmacy;
  prescriptionUri?: string;
  aiClarityScore?: number;
  items: Array<{
    medicine: MedicineItem;
    quantity: number;
    price: number;
  }>;
  quotes?: PharmacyQuote[];
  selectedQuote?: PharmacyQuote;
  totalAmount: number;
  totalMrp: number;
  paymentMethod?: 'ONLINE' | 'PAY_AT_COUNTER';
  isPaid: boolean;
  rejectReason?: string;
  refundStatus?: 'REFUNDED';
  pickupOtp?: string;
  pickupOtpVerified?: boolean;
  pickupDeadline?: string;
  pickupExtensionRequested?: boolean;
  createdAt: string;
  slaPharmacyReviewDeadline?: string;
  slaCustomerConfirmDeadline?: string;
}

export interface ChatMessage {
  id: string;
  orderId: string;
  senderRole: 'CUSTOMER' | 'PHARMACIST' | 'SYSTEM';
  senderName: string;
  text: string;
  timestamp: string;
}
