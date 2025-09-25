export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  category: string;
};

export type Address = {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
};

export type Card = {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  nameOnCard: string;
  network?: string;
  tokenized?: boolean;
};

export type CustomerProfile = {
  customerId: string;
  name: string;
  hasSavedCards: boolean;
  cards: Card[];
  addresses: Address[];
  preferences?: Record<string, any>;
};

export const products: Product[] = [
  {
    id: "p-iphone15",
    title: "iPhone 15 Pro",
    description: "Titanium design. A17 Pro chip. 256GB.",
    price: 60000,
    currency: "INR",
    image: "https://rukminim2.flixcart.com/image/480/640/xif0q/mobile/0/q/d/-original-imagtc4hzawdcp4g.jpeg?q=90",
    category: "Smartphones",
  },
  {
    id: "p-sonycam",
    title: "Sony Alpha A7 IV",
    description: "Full-frame Mirrorless Camera (Body)",
    price: 199900,
    currency: "INR",
    image: "https://fotocentreindia.com/wp-content/uploads/Sony-Alpha-A7IV-Mirrorless-Camera-Body-Only-Online-Buy-India_1.jpg",
    category: "Cameras",
  },
  {
    id: "p-headphones",
    title: "Bose QC Ultra Headphones",
    description: "Noise cancelling wireless over-ear",
    price: 37900,
    currency: "INR",
    image: "https://assets.bosecreative.com/transform/1f0656f9-6d98-4082-b253-ba3655338262/SF_QCUH_lunarblue_gallery_1_816x612_x2?quality=100",
    category: "Audio",
  },
  {
    id: "p-green-tshirt",
    title: "Green T-Shirt",
    description: "100% Cotton, Casual Wear",
    price: 2500,
    currency: "INR",
    image: "https://vestirio.com/cdn/shop/files/11_ac0ac8da-69d4-4616-9dd3-e370356bb834_1800x1800.webp?v=1715427056",
    category: "Apparel",
  },
  {
    id: "p-cream-truouser",
    title: "Cream Trousers",
    description: "Formal wear, Slim fit",
    price: 4500,
    currency: "INR",
    image: "https://www.urbanofashion.com/cdn/shop/files/epnchino-18-cream-1_01982f1b-18a8-4301-8947-6ededc941a93.jpg?v=1756392147",
    category: "Apparel",
  }
];

const baseAddresses: Address[] = [
  {
    id: "addr-default",
    label: "Home",
    line1: "221B Baker Street",
    city: "London",
    state: "London",
    postalCode: "NW16XE",
    country: "UK",
    isDefault: true,
  },
  {
    id: "addr-alt",
    label: "Office",
    line1: "42 Silicon Way",
    city: "London",
    state: "London",
    postalCode: "N17",
    country: "UK",
  },
];

const cardsWith: Card[] = [
  {
    id: "card_visa_01",
    brand: "VISA",
    last4: "4242",
    expMonth: 11,
    expYear: 2027,
    nameOnCard: "JOHN DOE",
    network: "VISA",
  },
  {
    id: "card_mc_02",
    brand: "MASTERCARD",
    last4: "4444",
    expMonth: 8,
    expYear: 2026,
    nameOnCard: "JOHN DOE",
    network: "MASTERCARD",
  },
];

export const customers: CustomerProfile[] = [
  {
    customerId: "demo_with_cards",
    name: "John Doe",
    hasSavedCards: true,
    cards: cardsWith,
    addresses: baseAddresses,
  },
  {
    customerId: "demo_no_cards",
    name: "Jane Smith",
    hasSavedCards: false,
    cards: [],
    addresses: baseAddresses,
  },
];

export function getCustomer(customerId: string): CustomerProfile | undefined {
  return customers.find(c => c.customerId === customerId);
}

export function getProduct(productId: string) {
  return products.find(p => p.id === productId);
}