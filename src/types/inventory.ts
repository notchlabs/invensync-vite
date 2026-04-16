export interface Vendor {
  id: number;
  name: string;
  contactEmail: string;
  contactPhone: string;
  gstNumber: string;
  address: string;
}

export interface Product {
  id: number;
  imageUrl: string | null;
  name: string;
  hsnName: string;
  hsnCode: number;
  cgstInPerc: number;
  sgstInPerc: number;
  unit: string;
  price: number;
  tax: number;
  priceIncTax: number;
}

export interface Site {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: number;
  gpsLat: number;
  gpsLng: number;
  startDate: string | null;
  endDate: string | null;
  projectType: string;
  status: string;
  searchKey: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}


export interface InventoryItem {
  productName: string;
  vendorNames: string | null;
  site: string;
  siteAddress: string;
  siteCity: string;
  siteState: string;
  mrp: number;
  siteId: number;
  productId: number;
  hsnCode: number;
  hsnName: string;
  cgstInPerc: number;
  sgstInPerc: number;
  price: number;
  quantity: number;
  transitQty: number;
  unit: string;
  billNos: string | null;
  totalExcludingTax: number;
  totalIncludingTax: number;
  latestUpdate: string;
  imageUrl: string | null;
}

export interface InventoryFetchPayload {
  site: number[];
  product: number[];
  vendor: number[];
  searchByProductName: string | null;
  searchByBillNo: string | null;
  searchBySupplierName: string | null;
  showZeroStock: boolean;
  sortBy?: string | null;
  sortDir?: 'asc' | 'desc' | null;
  hsnSubHeading?: string | null;
}
