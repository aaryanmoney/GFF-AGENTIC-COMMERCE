export const validateCardField = (
  name: string,
  value: string,
  errors: Record<string, string>
) => {
  const next = { ...errors };
  switch (name) {
    case "cardNumber": {
      const digits = value.replace(/\s/g, "");
      if (!digits) next.cardNumber = "Required";
      else if (digits.length < 13 || digits.length > 19)
        next.cardNumber = "Invalid number";
      else delete next.cardNumber;
      break;
    }
    case "nameOnCard":
      if (!value.trim()) next.nameOnCard = "Required";
      else if (value.trim().length < 2) next.nameOnCard = "Too short";
      else delete next.nameOnCard;
      break;
    case "expiry": {
      if (!/^\d{2}\/\d{2}$/.test(value)) next.expiry = "MM/YY";
      else {
        const [m, y] = value.split("/").map(Number);
        const cy = new Date().getFullYear() % 100;
        const cm = new Date().getMonth() + 1;
        if (m < 1 || m > 12) next.expiry = "Invalid month";
        else if (y < cy || (y === cy && m < cm)) next.expiry = "Expired";
        else delete next.expiry;
      }
      break;
    }
    case "cvv":
      if (!/^\d{3,4}$/.test(value)) next.cvv = "3-4 digits";
      else delete next.cvv;
      break;
  }
  return next;
};