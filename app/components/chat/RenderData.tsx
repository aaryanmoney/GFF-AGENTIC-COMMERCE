import { products } from "@/utils/mockData";
import { getProductImage } from "./constants";
import type { PaymentState, ChatMessage } from "@/utils/types";

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
      <div className="mt-3 space-y-2 fade-in">
        <div className="text-xs text-neutral-400">Saved Cards</div>
        <div className="space-y-2">
          {cards.map((c: any) => (
            <button
              key={c.id}
              onClick={() => onSelectCard(c.id)}
              className="w-full flex items-center justify-between px-3 py-2 text-left rounded bg-neutral-700/50 hover:bg-neutral-600/60 text-sm"
            >
              <span>
                {c.brand} •••• {c.last4}
              </span>
              <span className="text-xs text-neutral-400">
                {c.expMonth}/{(c.expYear + "").slice(-2)}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (msg.type === "PAYMENT_NEED_NEW_CARD") {
    return (
      <div className="mt-3 fade-in">
        <div className="text-xs text-neutral-400 mb-2">Enter Card Details</div>
        <form onSubmit={onSubmitNewCard} className="space-y-2">
          <input
            required
            name="cardNumber"
            placeholder="Card Number"
            pattern="[0-9]{13,19}"
            className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs"
          />
          <input
            required
            name="nameOnCard"
            placeholder="Name on Card"
            className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs"
          />
          <input
            required
            name="expiry"
            placeholder="MM/YY"
            pattern="[0-9]{2}/[0-9]{2}"
            className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs"
          />
          <button
            disabled={paymentState === "PROCESSING"}
            className="w-full mt-1 bg-emerald-600 hover:bg-emerald-500 rounded px-3 py-2 text-xs font-medium"
          >
            {paymentState === "PROCESSING" ? "Processing..." : "Pay"}
          </button>
        </form>
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