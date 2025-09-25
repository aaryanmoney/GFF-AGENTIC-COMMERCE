import React, { useState } from "react";
import { products } from "@/utils/mockData";
import { getProductImage } from "./constants";
import type { PaymentState, ChatMessage } from "@/utils/types";
import { CreditCardIcon, LockClosedIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";
import icons from "payments-icons-library";

// Helper to fetch brand icon (visa/mastercard/amex)
const getBrandIcon = (brand?: string) => {
  if (!brand) return null;
  try {
    const key = brand.toLowerCase(); // expects 'visa' | 'mastercard' | 'amex'
    const res: any = icons.getIcon(key, "sm");
    return res?.icon_url || null;
  } catch {
    return null;
  }
};

export function RenderData({
  msg,
  onSelectCard,
  onSubmitNewCard,
  paymentState,
}: {
  msg: ChatMessage;
  onSelectCard: (id: string) => void;
  onSubmitNewCard: (e: React.FormEvent<HTMLFormElement>) => void;
  paymentState: PaymentState;
}) {
  if (!msg.data) return null;
  const typingNotFinished =
    (msg as any).fullText && msg.text !== (msg as any).fullText;

  // --- Add New Card form state / helpers (always declared to keep hooks stable) ---
  const [cardData, setCardData] = useState({
    cardNumber: "",
    nameOnCard: "",
    expiry: "",
    cvv: "",
  });
  const [focused, setFocused] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/g, "");
    const parts = [];
    for (let i = 0; i < v.length; i += 4) parts.push(v.substring(i, i + 4));
    return parts.join(" ");
  };
  const formatExpiry = (value: string) => {
    const v = value.replace(/[^0-9]/g, "");
    if (v.length <= 2) return v;
    return v.substring(0, 2) + "/" + v.substring(2, 4);
  };
  const getCardType = (n: string) => {
    const c = n.replace(/\s/g, "");
    if (c.startsWith("4")) return "visa";
    if (c.startsWith("5") || c.startsWith("2")) return "mastercard";
    if (c.startsWith("3")) return "amex";
    return "generic";
  };
  const validateField = (name: string, value: string) => {
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
          if (m < 1 || m > 12) next.expiry = "Bad month";
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
    setErrors(next);
  };
  const handleInput = (field: string, val: string) => {
    let v = val;
    if (field === "cardNumber") v = formatCardNumber(val);
    if (field === "expiry") v = formatExpiry(val);
    if (field === "cvv") v = v.replace(/[^0-9]/g, "").slice(0, 4);
    if (field === "nameOnCard") v = v.toUpperCase().replace(/[^A-Z\s]/g, "");
    setCardData(d => ({ ...d, [field]: v }));
    validateField(field, v);
  };
  const canSubmit =
    cardData.cardNumber &&
    cardData.nameOnCard &&
    cardData.expiry &&
    cardData.cvv &&
    Object.keys(errors).length === 0 &&
    paymentState !== "PROCESSING";

  const cardType = getCardType(cardData.cardNumber);
  // --- end helpers ---

  if (msg.type === "PRODUCT_LIST") {
    if (typingNotFinished) return null;
    const list =
      Array.isArray(msg.data?.products) && msg.data.products.length
        ? msg.data.products
        : products;
    return (
      <div className="mt-3 grid gap-3">
        {list.map((p: any) => {
          const img = p.image || getProductImage(p.id);
          return (
            <div
              key={p.id}
              className="rounded border border-neutral-700 p-3 flex gap-3 bg-neutral-800/50 fade-in"
            >
              {img && (
                <img
                  src={img}
                  alt={p.title}
                  className="w-16 h-16 object-cover rounded-md border border-neutral-700"
                  loading="lazy"
                />
              )}
              <div className="flex-1 flex flex-col gap-1">
                <div className="text-sm font-medium">{p.title}</div>
                <div className="text-xs font-semibold">
                  {p.price} {p.currency}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (msg.type === "PRODUCT_CONFIRMATION") {
    if (typingNotFinished) return null;
    const pid = msg.data?.productId || msg.data?.id;
    const img = getProductImage(pid);
    if (!img) return null;
    return (
      <div className="mt-3 flex gap-3 items-start fade-in">
        <img
          src={img}
          alt={pid}
          className="w-20 h-20 object-cover rounded-md border border-neutral-700"
        />
        <div className="text-xs text-neutral-300">
          <div className="font-medium mb-1">
            {msg.data?.productTitle || pid}
          </div>
        </div>
      </div>
    );
  }

  if (msg.type === "HANDOFF") {
    return (
      <div className="mt-3 text-xs text-amber-400 fade-in">
        Handoffed to Cashfree Agent. Preparing payment...
      </div>
    );
  }

  if (msg.type === "PAYMENT_SHOW_SAVED_CARDS") {
    const cards = msg.data.cards || [];
    return (
      <div className="mt-3 fade-in w-full max-w-md">
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl border border-neutral-700 shadow-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <CreditCardIcon className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm font-semibold text-neutral-200">
                Saved Cards
              </div>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 text-[11px] font-medium">
              <LockClosedIcon className="w-3.5 h-3.5" />
              Secure
            </div>
          </div>
          <div className="p-4 space-y-3">
            {cards.length === 0 && (
              <div className="text-xs text-neutral-500">
                No saved cards available.
              </div>
            )}
            {cards.map((c: any) => {
              const iconUrl = getBrandIcon(c.brand);
              return (
                <button
                  key={c.id}
                  onClick={() => onSelectCard(c.id)}
                  className="group w-full relative flex items-center gap-4 p-4 rounded-xl bg-neutral-800/60 border border-neutral-700 hover:border-emerald-500/50 hover:bg-neutral-800 transition duration-200 text-left"
                >
                  <div className="w-12 h-8 flex items-center justify-center rounded-md bg-neutral-700/60 border border-neutral-600 overflow-hidden">
                    {iconUrl ? (
                      <img
                        src={iconUrl}
                        alt={c.brand}
                        className="w-10 h-6 object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-[10px] font-semibold tracking-wide text-neutral-300">
                        {c.brand}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium tracking-wide text-neutral-200">
                      •••• {c.last4}
                    </div>
                    <div className="mt-0.5 text-[11px] text-neutral-400 flex gap-4">
                      <span>
                        Exp {c.expMonth}/{String(c.expYear).slice(-2)}
                      </span>
                      {c.nameOnCard && <span>{c.nameOnCard}</span>}
                    </div>
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-400 opacity-0 group-hover:opacity-100 transition">
                    Use
                  </div>
                  <span className="pointer-events-none absolute inset-0 rounded-xl ring-0 group-hover:ring-1 group-hover:ring-emerald-500/40" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (msg.type === "PAYMENT_NEED_NEW_CARD") {
    return (
      <div className="mt-3 fade-in">
        <div className="w-full max-w-md">
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl border border-neutral-700 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-700 bg-neutral-800/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <CreditCardIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Add Payment Method</div>
                  <div className="text-[11px] text-neutral-400">
                    Enter card details securely
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                <LockClosedIcon className="w-4 h-4" />
                Secure
              </div>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                ["cardNumber", "nameOnCard", "expiry", "cvv"].forEach(f =>
                  validateField(f, cardData[f as keyof typeof cardData])
                );
                if (!canSubmit) return;
                onSubmitNewCard(e as any);
              }}
              className="p-5 space-y-5"
            >
              <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-300">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    name="cardNumber"
                    value={cardData.cardNumber}
                    onChange={e => handleInput("cardNumber", e.target.value)}
                    onFocus={() => setFocused("cardNumber")}
                    onBlur={() => setFocused("")}
                    placeholder="1234 5678 9012 3456"
                    className={`w-full px-4 py-3 rounded-lg text-sm bg-neutral-800/50 placeholder-neutral-500 outline-none border transition
                      ${
                        errors.cardNumber
                          ? "border-red-500 focus:ring-2 focus:ring-red-500/40"
                          : focused === "cardNumber"
                          ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
                          : "border-neutral-600 focus:border-neutral-500"
                      }`}
                    autoComplete="off"
                  />
                  {cardData.cardNumber && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                      {(() => {
                        const iconUrl = getBrandIcon(cardType);
                        return iconUrl ? (
                          <img
                            src={iconUrl}
                            alt={cardType}
                            className="w-8 h-5 object-contain rounded-sm"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className={`w-10 h-6 rounded flex items-center justify-center text-[10px] font-bold
                          ${
                            cardType === "visa"
                              ? "bg-blue-600 text-white"
                              : cardType === "mastercard"
                              ? "bg-red-600 text-white"
                              : cardType === "amex"
                              ? "bg-green-600 text-white"
                              : "bg-neutral-600 text-neutral-200"
                          }`}
                          >
                            {cardType === "visa"
                              ? "VISA"
                              : cardType === "mastercard"
                              ? "MC"
                              : cardType === "amex"
                              ? "AMEX"
                              : "CARD"}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
                {errors.cardNumber && (
                  <p className="text-xs text-red-400">{errors.cardNumber}</p>
                )}
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-300">
                  Name on Card
                </label>
                <input
                  name="nameOnCard"
                  value={cardData.nameOnCard}
                  onChange={e => handleInput("nameOnCard", e.target.value)}
                  onFocus={() => setFocused("nameOnCard")}
                  onBlur={() => setFocused("")}
                  placeholder="JOHN DOE"
                  className={`w-full px-4 py-3 rounded-lg text-sm bg-neutral-800/50 placeholder-neutral-500 outline-none border transition uppercase
                    ${
                      errors.nameOnCard
                        ? "border-red-500 focus:ring-2 focus:ring-red-500/40"
                        : focused === "nameOnCard"
                        ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
                        : "border-neutral-600 focus:border-neutral-500"
                    }`}
                  autoComplete="off"
                />
                {errors.nameOnCard && (
                  <p className="text-xs text-red-400">{errors.nameOnCard}</p>
                )}
              </div>

              {/* Expiry & CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-neutral-300">
                    Expiry (MM/YY)
                  </label>
                  <input
                    name="expiry"
                    value={cardData.expiry}
                    onChange={e => handleInput("expiry", e.target.value)}
                    onFocus={() => setFocused("expiry")}
                    onBlur={() => setFocused("")}
                    placeholder="MM/YY"
                    className={`w-full px-4 py-3 rounded-lg text-sm bg-neutral-800/50 placeholder-neutral-500 outline-none border transition
                      ${
                        errors.expiry
                          ? "border-red-500 focus:ring-2 focus:ring-red-500/40"
                          : focused === "expiry"
                          ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
                          : "border-neutral-600 focus:border-neutral-500"
                      }`}
                    autoComplete="off"
                    maxLength={5}
                  />
                  {errors.expiry && (
                    <p className="text-xs text-red-400">{errors.expiry}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-neutral-300">
                    CVV
                  </label>
                  <input
                    name="cvv"
                    value={cardData.cvv}
                    onChange={e => handleInput("cvv", e.target.value)}
                    onFocus={() => setFocused("cvv")}
                    onBlur={() => setFocused("")}
                    placeholder="123"
                    className={`w-full px-4 py-3 rounded-lg text-sm bg-neutral-800/50 placeholder-neutral-500 outline-none border transition
                      ${
                        errors.cvv
                          ? "border-red-500 focus:ring-2 focus:ring-red-500/40"
                          : focused === "cvv"
                          ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
                          : "border-neutral-600 focus:border-neutral-500"
                      }`}
                    autoComplete="off"
                    maxLength={4}
                  />
                  {errors.cvv && (
                    <p className="text-xs text-red-400">{errors.cvv}</p>
                  )}
                </div>
              </div>

              {/* Security */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] text-emerald-400">
                  Your data is safe & never exposed to agent.
                </span>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  disabled={paymentState === "PROCESSING"}
                  onClick={() => {
                    setCardData({ cardNumber: "", nameOnCard: "", expiry: "", cvv: "" });
                    setErrors({});
                  }}
                  className="flex-1 text-xs font-medium rounded-lg border border-neutral-600 bg-neutral-800/50 hover:bg-neutral-700/60 disabled:opacity-50 px-4 py-2.5 transition"
                >
                  Reset
                </button>
                <button
                  disabled={!canSubmit}
                  className="flex-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 px-4 py-2.5 flex items-center justify-center gap-2 transition"
                >
                  {paymentState === "PROCESSING" ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <LockClosedIcon className="w-4 h-4" />
                      Add Card
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (msg.type === "PAYMENT_PROCESSING") {
    return (
      <div className="mt-3 text-xs text-neutral-400">
        Processing payment...
      </div>
    );
  }

  if (msg.type === "PAYMENT_RESULT") {
    return (
      <div className="mt-3 border border-emerald-600/40 bg-emerald-600/10 rounded p-3 text-xs fade-in">
        <div className="font-medium text-emerald-400">Payment Success</div>
        <div className="mt-1 space-y-1">
          <div>Order: {msg.data.orderId}</div>
          <div>
            Amount: {msg.data.amount} {msg.data.currency}
          </div>
          {msg.data.card && (
            <div>
              Card: {msg.data.card.brand} •••• {msg.data.card.last4}
            </div>
          )}
        </div>
        <div className="mt-2 text-[10px] text-neutral-400">
          You can continue shopping.
        </div>
      </div>
    );
  }

  return null;
}