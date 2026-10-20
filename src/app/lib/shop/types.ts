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

export type OrderStatus = "pending" | "paid" | "shipped" | "cancelled";

export type ShopOrderItem = {
  productId: string;
  productName: string;
  size: ProductSize;
  quantity: number;
  unitPriceCents: number;
};

export type ShopOrder = {
  id: string;
  status: OrderStatus;
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
};
