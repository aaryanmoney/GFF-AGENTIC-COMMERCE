export const formatCardNumber = (value: string) => {
  const v = value.replace(/\s+/g, "").replace(/[^0-9]/g, "");
  const parts = [];
  for (let i = 0; i < v.length; i += 4) parts.push(v.substring(i, i + 4));
  return parts.join(" ");
};

export const formatExpiry = (value: string) => {
  const v = value.replace(/[^0-9]/g, "");
  if (v.length <= 2) return v;
  return v.substring(0, 2) + "/" + v.substring(2, 4);
};

export const getCardType = (n: string) => {
  const c = n.replace(/\s/g, "");
  if (c.startsWith("4")) return "visa";
  if (c.startsWith("5") || c.startsWith("2")) return "mastercard";
  if (c.startsWith("3")) return "amex";
  return "generic";
};