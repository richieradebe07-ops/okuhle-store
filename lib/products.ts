export type ProductColor = {
  name: string;
  hex: string;
  /** Product shot for this colourway. Falls back to a swatch tile when absent. */
  image?: string;
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
      { name: "White", hex: "#e7e7e7", image: "/products/golf-tee/white.jpg" },
      { name: "Grey", hex: "#9e9da5", image: "/products/golf-tee/grey.jpg" },
      { name: "Sand", hex: "#bdad8c", image: "/products/golf-tee/sand.jpg" },
      { name: "Pink", hex: "#e77e99", image: "/products/golf-tee/pink.jpg" },
      { name: "Royal Blue", hex: "#334cc5", image: "/products/golf-tee/blue.jpg" },
      { name: "Orange", hex: "#dc4323", image: "/products/golf-tee/orange.jpg" },
    ],
    sizes: SIZES,
    memberDiscountPercent: 15,
    bulkOffer: "Buy 3 or more golf tees and the price drops again — ask on WhatsApp.",
    images: [],
    active: true,
  },
  {
    id: "t-shirt",
    name: "T-Shirt",
    category: "t-shirts",
    price: 210,
    compareAtPrice: 240,
    tagline: "The emblem, full size.",
    description:
      "Our everyday tee, printed with the full-size Okuhle emblem front and centre. Mid-weight cotton that holds its shape wash after wash.",
    fit: "Regular fit, true to size.",
    material: "Mid-weight combed cotton.",
    care: "Cold machine wash inside out. Hang dry in shade. Do not iron over the print.",
    colors: [
      { name: "Black", hex: "#111111", image: "/products/t-shirt/black.jpg" },
      { name: "Navy", hex: "#262f3e", image: "/products/t-shirt/navy.jpg" },
      { name: "Olive", hex: "#2a2d20", image: "/products/t-shirt/olive.jpg" },
      { name: "Purple", hex: "#2e1247", image: "/products/t-shirt/purple.jpg" },
      { name: "Red", hex: "#a22927", image: "/products/t-shirt/red.jpg" },
      { name: "Cream", hex: "#cfc19f", image: "/products/t-shirt/cream.jpg" },
    ],
    sizes: SIZES,
    memberDiscountPercent: 20,
    bulkOffer: "Buy 3 or more tees and the price drops again — ask on WhatsApp.",
    images: [],
    active: true,
  },
  {
    id: "baggy-tee",
    name: "Baggy Tee",
    category: "baggy-tees",
    price: 270,
    compareAtPrice: 280,
    tagline: "Wear & own your beauty.",
    description:
      "A dropped-shoulder, wide-body tee for when the fit should do the talking. Emblem at the chest, “Wear & own your beauty” at the hem.",
    fit: "Oversized by design. Take your usual size for the intended drape.",
    material: "Heavy-weight cotton, garment washed.",
    care: "Cold machine wash inside out. Hang dry in shade. Warm iron on reverse.",
    colors: [
      { name: "White", hex: "#eff1f0", image: "/products/baggy-tee/white.jpg" },
      { name: "Grey", hex: "#c6c8c7", image: "/products/baggy-tee/grey.jpg" },
      { name: "Sand", hex: "#cfc19f", image: "/products/baggy-tee/sand.jpg" },
      { name: "Yellow", hex: "#ebf10f", image: "/products/baggy-tee/yellow.jpg" },
      { name: "Mustard", hex: "#c38e1d", image: "/products/baggy-tee/mustard.jpg" },
      { name: "Orange", hex: "#e3531c", image: "/products/baggy-tee/orange.jpg" },
      { name: "Red", hex: "#ed0014", image: "/products/baggy-tee/red.jpg" },
      { name: "Green", hex: "#58be5a", image: "/products/baggy-tee/green.jpg" },
      { name: "Sky", hex: "#017db8", image: "/products/baggy-tee/sky.jpg" },
      { name: "Royal Blue", hex: "#0400ed", image: "/products/baggy-tee/blue.jpg" },
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
    compareAtPrice: 390,
    tagline: "For the cold months and the cold takes.",
    description:
      "A crew-neck sweater with the emblem at the chest. Brushed inside, structured outside, built to survive a KZN winter and several summers.",
    fit: "Regular fit with room to layer.",
    material: "Brushed fleece-back cotton blend.",
    care: "Cold machine wash inside out. Dry flat in shade. Do not tumble dry.",
    colors: [
      { name: "White", hex: "#ebebeb", image: "/products/sweater/white.jpg" },
      { name: "Slate", hex: "#5e6e7e", image: "/products/sweater/slate.jpg" },
      { name: "Royal Blue", hex: "#2a5ba6", image: "/products/sweater/blue.jpg" },
      { name: "Green", hex: "#23741d", image: "/products/sweater/green.jpg" },
      { name: "Yellow", hex: "#e4d533", image: "/products/sweater/yellow.jpg" },
      { name: "Mustard", hex: "#c08a1c", image: "/products/sweater/mustard.jpg" },
      { name: "Coral", hex: "#d56467", image: "/products/sweater/coral.jpg" },
      { name: "Red", hex: "#b7112c", image: "/products/sweater/red.jpg" },
      { name: "Pink", hex: "#de4b9b", image: "/products/sweater/pink.jpg" },
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

/** Every photographed colourway, for lookbook grids. */
export function lookbook() {
  return products.flatMap((p) =>
    p.colors
      .filter((c) => c.image)
      .map((c) => ({ src: c.image as string, alt: `${p.name} in ${c.name}`, href: `/shop/${p.id}` }))
  );
}

export function memberPrice(product: Product) {
  return Math.round(product.price * (1 - product.memberDiscountPercent / 100));
}

export function savings(product: Product) {
  if (!product.compareAtPrice) return 0;
  return product.compareAtPrice - product.price;
}
