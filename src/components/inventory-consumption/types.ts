export interface ItemSettings {
  amount: string; // editable string so user can type freely
  paymentMode: "UPI" | "Cash" | "Loyalty";
  noBill: boolean;
  loyalty: boolean;
}

export interface CartEntry {
  productId: number;
  productName: string;
  unit: string;
  price: number;
  imageUrl: string | null;
  qty: number;
  source: "inventory" | "preparation";
}
