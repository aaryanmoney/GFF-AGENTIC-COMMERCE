import type { ChatMessage, PaymentState } from "@/utils/types";
import { agentMeta } from "./constants";
import { RenderData } from "./RenderData";

export function MessageBubble({
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
  const isUser = (msg as any).fromUser;
  const meta = !isUser
    ? agentMeta[msg.agent as keyof typeof agentMeta]
    : null;


  const agentAvatar =
    meta &&
    (
      <div className="w-8 h-8 flex-shrink-0 rounded-full overflow-hidden bg-neutral-700 flex items-center justify-center text-lg">
        {"logo" in meta && meta.logo ? (
          <img
            src={meta.logo}
            alt={meta.label}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{(meta as any).icon}</span>
        )}
      </div>
    );

  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      } items-start gap-2`}
    >
      {!isUser && agentAvatar}
      <div
        className={`max-w-[75%] rounded-xl px-4 py-3 text-sm border fade-in ${
          isUser
            ? "bg-indigo-600 text-white border-indigo-500"
            : "bg-neutral-800/70 border-neutral-700"
        }`}
      >
        {!isUser && meta && (
          <div className="mb-1 flex items-center gap-3">
            <span className="text-xs font-medium">{meta.label} Agent</span>
            <span className="text-[10px] uppercase tracking-wide text-neutral-400">
              {msg.type}
            </span>
          </div>
        )}
        {msg.text && <div className="whitespace-pre-wrap">{msg.text}</div>}
        <RenderData
          msg={msg}
          onSelectCard={onSelectCard}
          onSubmitNewCard={onSubmitNewCard}
          paymentState={paymentState}
        />
      </div>
    </div>
  );
}