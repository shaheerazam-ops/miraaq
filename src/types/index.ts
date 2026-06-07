import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}

export interface ProductWithDetails {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDesc: string | null;
  price: number;
  comparePrice: number | null;
  sku: string;
  volume: string;
  gender: string;
  fragranceFamily: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  images: string[];
  thumbnail: string;
  videoUrl: string | null;
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  comboOffer: boolean;
  active: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  inventory?: {
    quantity: number;
  } | null;
  reviews?: {
    rating: number;
    approved: boolean;
  }[];
  _count?: {
    reviews: number;
  };
  averageRating?: number;
}

export interface CartItemWithProduct {
  id: string;
  quantity: number;
  product: ProductWithDetails;
}

export interface OrderWithItems {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  createdAt: Date;
  items: {
    id: string;
    quantity: number;
    price: number;
    name: string;
    volume: string;
    image: string;
    product: { slug: string };
  }[];
  payment?: {
    status: string;
    method: string;
  } | null;
}

export interface ShopFilters {
  search?: string;
  category?: string;
  gender?: string;
  fragranceFamily?: string;
  volume?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  comboOffer?: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AddressFormData {
  label: string;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

export interface CheckoutFormData {
  shippingAddress: AddressFormData;
  billingAddress: AddressFormData;
  sameAsBilling: boolean;
  notes?: string;
  couponCode?: string;
}

export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueByMonth: { month: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  topProducts: { name: string; sales: number; revenue: number }[];
}
