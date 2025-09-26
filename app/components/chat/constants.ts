export const CASHFREE_LOGO =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQlmGx-0creMf02iS6YAko6ZhDcEQVk6WvCUQ&s";

export const agentMeta = {
  shopping: { label: "CAIA", icon: "🛍️" },
  cashfree: { label: "Cashfree", logo: CASHFREE_LOGO },
} as const;

export const productImages: Record<string, string> = {
  "p-iphone15":
    "https://rukminim2.flixcart.com/image/480/640/xif0q/mobile/0/q/d/-original-imagtc4hzawdcp4g.jpeg?q=90",
  "p-sonycam":
    "https://fotocentreindia.com/wp-content/uploads/Sony-Alpha-A7IV-Mirrorless-Camera-Body-Only-Online-Buy-India_1.jpg",
  "p-headphones":
    "https://assets.bosecreative.com/transform/1f0656f9-6d98-4082-b253-ba3655338262/SF_QCUH_lunarblue_gallery_1_816x612_x2?quality=100",
    "p-green-tshirt":
    "https://vestirio.com/cdn/shop/files/11_ac0ac8da-69d4-4616-9dd3-e370356bb834_1800x1800.webp?v=1715427056",
    "p-cream-truouser":
    "https://www.urbanofashion.com/cdn/shop/files/epnchino-18-cream-1_01982f1b-18a8-4301-8947-6ededc941a93.jpg?v=1756392147",   
};

export function getProductImage(id?: string) {
  if (!id) return;
  return productImages[id];
}

export const TYPING_INTERVAL_MS = 20;
export const TYPING_INCREMENT = 1;