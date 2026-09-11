export type ProductColor = {
  name: string;
  hex: string;
};

export type Product = {
  id: string;
  name: string;
  category: CategoryId;
  price: number;
  /** Original price, when the item is sold below it. Savings are derived, never hardcoded. */
  compareAtPrice?: number;
  tagline?: string;
  description: string;
  fit: string;
  material: string;
  care: string;
  colors: ProductColor[];
  sizes: string[];
  /** Okuhle+ member discount, as a percentage off the regular price. */
  memberDiscountPercent: number;
  bulkOffer?: string;
  images: string[];
  active: boolean;
};

export type CategoryId =
  | "golf-tees"
  | "t-shirts"
  | "baggy-tees"
  | "sweaters"
  | "hoodies";

export const categories: { id: CategoryId | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "golf-tees", label: "Golf Tees" },
  { id: "t-shirts", label: "Tees" },
  { id: "baggy-tees", label: "Baggy Fits" },
  { id: "sweaters", label: "Sweaters" },
  { id: "hoodies", label: "Hoodies" },
];

const SIZES = ["S", "M", "L", "XL", "XXL"];

export const products: Product[] = [
  {
    id: "golf-tee",
    name: "Golf Tee",
    category: "golf-tees",
    price: 270,
    compareAtPrice: 300,
    tagline: "Collared, considered, everyday.",
    description:
      "A collared golf tee with the Okuhle emblem stitched at the chest. Structured enough for a Sunday lunch, easy enough for a Tuesday.",
    fit: "Regular fit, true to size. Take one size up for a relaxed drape.",
    material: "Pique cotton blend, breathable and shape-holding.",
    care: "Cold machine wash with like colours. Hang dry in shade. Warm iron, never directly on the emblem.",
    colors: [
      { name: "White", hex: "#f3f1ec" },
      { name: "Grey", hex: "#9a9a9a" },
      { name: "Sand", hex: "#d8c9a3" },
      { name: "Pink", hex: "#e59fb5" },
      { name: "Royal Blue", hex: "#2a4fc4" },
      { name: "Sky", hex: "#57b0d8" },
      { name: "Burnt Orange", hex: "#c5451f" },
    ],
    sizes: SIZES,
    memberDiscountPercent: 15,
    bulkOffer: "Buy 3 or more golf tees and the price drops again — ask on WhatsApp.",
    images: [],
    active: true,
  },
  {
    id: "classic-tee",
    name: "Classic Tee",
    category: "t-shirts",
    price: 210,
    compareAtPrice: 230,
    tagline: "The everyday one.",
    description:
      "Our everyday tee, carrying the Okuhle emblem at the chest. Mid-weight cotton that holds its shape wash after wash.",
    fit: "Regular fit, true to size.",
    material: "Mid-weight combed cotton.",
    care: "Cold machine wash inside out. Hang dry in shade. Warm iron, never directly on the emblem.",
    colors: [
      { name: "Black", hex: "#111111" },
      { name: "Royal Blue", hex: "#2a4fc4" },
      { name: "Navy", hex: "#1b2445" },
      { name: "Red", hex: "#b8222c" },
      { name: "Bronze", hex: "#b07a35" },
      { name: "Yellow", hex: "#e5d21f" },
    ],
    sizes: SIZES,
    memberDiscountPercent: 20,
    bulkOffer: "Buy 3 or more tees and the price drops again — ask on WhatsApp.",
    images: [],
    active: true,
  },
  {
    id: "signature-tee",
    name: "Signature Tee",
    category: "t-shirts",
    price: 210,
    tagline: "The emblem, full size.",
    description:
      "Our flagship tee, printed with the full-size Okuhle emblem front and centre. Same price as the classic tee — the difference is how loudly you wear it.",
    fit: "Regular fit, true to size.",
    material: "Mid-weight combed cotton.",
    care: "Cold machine wash inside out. Hang dry in shade. Do not iron over the print.",
    colors: [
      { name: "Cream", hex: "#e8dcc0" },
      { name: "Olive", hex: "#3f4a2a" },
      { name: "Plum", hex: "#3c2a4d" },
      { name: "Red", hex: "#b8222c" },
    ],
    sizes: SIZES,
    memberDiscountPercent: 20,
    images: [],
    active: true,
  },
  {
    id: "baggy-tee",
    name: "Baggy Tee",
    category: "baggy-tees",
    price: 270,
    tagline: "Wear and own your beauty.",
    description:
      "A dropped-shoulder, wide-body tee for when the fit should do the talking. Heavier cotton, longer line, no cling.",
    fit: "Oversized by design. Take your usual size for the intended drape.",
    material: "Heavy-weight cotton, garment washed.",
    care: "Cold machine wash inside out. Hang dry in shade. Warm iron on reverse.",
    colors: [
      { name: "Grey", hex: "#9a9a9a" },
      { name: "Black", hex: "#111111" },
      { name: "Cream", hex: "#e8dcc0" },
    ],
    sizes: SIZES,
    memberDiscountPercent: 15,
    bulkOffer: "Buy 3 or more baggy tees and the price drops again — ask on WhatsApp.",
    images: [],
    active: true,
  },
  {
    id: "sweater",
    name: "Sweater",
    category: "sweaters",
    price: 360,
    tagline: "For the cold months and the cold takes.",
    description:
      "A crew-neck sweater with the emblem at the chest. Brushed inside, structured outside, built to survive a KZN winter and several summers.",
    fit: "Regular fit with room to layer.",
    material: "Brushed fleece-back cotton blend.",
    care: "Cold machine wash inside out. Dry flat in shade. Do not tumble dry.",
    colors: [
      { name: "White", hex: "#f3f1ec" },
      { name: "Royal Blue", hex: "#2a4fc4" },
      { name: "Red", hex: "#b8222c" },
      { name: "Yellow", hex: "#e5d21f" },
      { name: "Slate", hex: "#6d7681" },
      { name: "Pink", hex: "#e04e8f" },
      { name: "Green", hex: "#2e8b3d" },
    ],
    sizes: SIZES,
    memberDiscountPercent: 20,
    bulkOffer: "Buy 2 or more sweaters and the price drops again — ask on WhatsApp.",
    images: [],
    active: true,
  },
  {
    id: "hoodie",
    name: "Hoodie",
    category: "hoodies",
    price: 400,
    tagline: "The heavyweight.",
    description:
      "Our warmest piece. Lined hood, deep pocket, emblem at the chest. The one you will end up wearing more than anything else you own.",
    fit: "Regular fit with room to layer.",
    material: "Heavy brushed fleece-back cotton blend.",
    care: "Cold machine wash inside out. Dry flat in shade. Do not tumble dry.",
    colors: [
      { name: "White", hex: "#f3f1ec" },
      { name: "Royal Blue", hex: "#2a4fc4" },
      { name: "Red", hex: "#b8222c" },
      { name: "Grey", hex: "#9a9a9a" },
      { name: "Burnt Orange", hex: "#c5451f" },
      { name: "Pink", hex: "#e04e8f" },
      { name: "Green", hex: "#2e8b3d" },
    ],
    sizes: SIZES,
    memberDiscountPercent: 25,
    bulkOffer: "Buy 2 or more hoodies and the price drops again — ask on WhatsApp.",
    images: [],
    active: true,
  },
];

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}

export function memberPrice(product: Product) {
  return Math.round(product.price * (1 - product.memberDiscountPercent / 100));
}

export function savings(product: Product) {
  if (!product.compareAtPrice) return 0;
  return product.compareAtPrice - product.price;
}
