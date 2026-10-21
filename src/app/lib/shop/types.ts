export type ProductSize = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export type ProductStatus = "draft" | "active" | "archived";

export type ShopProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** Short line under the name on cards / PDP */
  tagline: string;
  priceCents: number;
  currency: "usd";
  sizes: ProductSize[];
  /** Hex accents for placeholder merch art until real photos land */
  accentFrom: string;
  accentTo: string;
  /** Primary product photo shown on cards / PDP */
  coverImageUrl: string | null;
  /** Extra photos for the product detail gallery */
  galleryImageUrls: string[];
  status: ProductStatus;
  inventoryBySize: Partial<Record<ProductSize, number>>;
  createdAt: string;
  updatedAt: string;
  stripeProductId?: string | null;
  stripePriceId?: string | null;
};

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded";

export type FulfillmentStatus =
  | "unfulfilled"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

/** @deprecated Use PaymentStatus + FulfillmentStatus */
export type OrderStatus = "pending" | "paid" | "shipped" | "cancelled";

export type ShopOrderItem = {
  productId: string;
  productName: string;
  size: ProductSize;
  quantity: number;
  unitPriceCents: number;
  /** Best-effort cover from current product catalog */
  imageUrl?: string | null;
};

export type OrderEventType =
  | "order_created"
  | "payment_confirmed"
  | "payment_failed"
  | "payment_refunded"
  | "fulfillment_started"
  | "tracking_added"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled";

export type ShopOrderEvent = {
  id: string;
  orderId: string;
  eventType: OrderEventType | string;
  description: string;
  actor: string;
  createdAt: string;
};

export type ShopOrder = {
  id: string;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  email: string;
  items: ShopOrderItem[];
  shippingName: string;
  shippingLine1: string;
  shippingCity: string;
  shippingRegion: string;
  shippingPostal: string;
  shippingCountry: string;
  totalCents: number;
  createdAt: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  events?: ShopOrderEvent[];
};

export const SHIPPING_CARRIERS = [
  "USPS",
  "UPS",
  "FedEx",
  "DHL",
  "Other",
] as const;

export type ShippingCarrier = (typeof SHIPPING_CARRIERS)[number] | string;
