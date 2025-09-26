"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, PaymentState } from "@/utils/types";
import { MessageBubble } from "./chat/MessageBubble";
import { parseAgentJSON } from "./chat/parse";
import { useTypingEffect } from "./chat/useTypingEffect";
import { agentMeta } from "./chat/constants";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import React from "react";

type ActiveAgent = "shopping" | "cashfree";

interface ChatProps {
  customerId?: string;
  onCustomerIdChange?: (id: string) => void;
  resetSignal?: number;
}

export default function Chat(props: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [activeAgent, setActiveAgent] = useState<ActiveAgent>("shopping");

  const [internalCustomerId, setInternalCustomerId] = useState(
    props.customerId ?? "demo_with_cards"
  );
  const customerId = props.customerId ?? internalCustomerId;
  const setCustomerId = props.onCustomerIdChange ?? setInternalCustomerId;

  const [showCustomerMenu, setShowCustomerMenu] = useState(false);

  const [conversationHistory, setConversationHistory] = useState("");
  const [paymentState, setPaymentState] = useState<PaymentState>("IDLE");
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [isSending, setIsSending] = useState(false);
  const paymentResultTimeoutRef = useRef<number | null>(null);

  const bottomInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 1) bottomInputRef.current?.focus();
  }, [messages.length]);

  useEffect(() => {
    return () => {
      if (paymentResultTimeoutRef.current) {
        clearTimeout(paymentResultTimeoutRef.current);
      }
    };
  }, []);

  useTypingEffect(messages, setMessages);

  const disabledInput =
    isSending ||
    paymentState === "PROCESSING" ||
    paymentState === "AWAITING_CARD_SELECTION" ||
    paymentState === "AWAITING_NEW_CARD";

  const customerVariant = customerId === "demo_with_cards" ? "C" : "NC";
  const hasStarted = messages.length > 0;
  const shoppingMeta = agentMeta["shopping"];

  const sendToSpecificAgent = useCallback(
    async (
      targetAgent: ActiveAgent,
      userText: string,
      opts?: { skipCustomerInjection?: boolean; hideFromUI?: boolean }
    ) => {
      setIsSending(true);
      const sendText =
        !opts?.skipCustomerInjection && targetAgent === "shopping"
          ? `${userText} (customerId:${customerId})`
          : userText;

      if (!opts?.hideFromUI) {
        const userMsg: ChatMessage = {
          id: crypto.randomUUID?.() ?? Math.random().toString(36),
            createdAt: Date.now(),
          agent: targetAgent,
          role: "user",
          type: "MESSAGE",
          text: userText,
          fromUser: true,
          userAvatarLabel: customerVariant,
        };
        setMessages(m => [...m, userMsg]);
      }

      const endpoint =
        targetAgent === "shopping" ? "/api/shopping-agent" : "/api/cashfree-agent";
      const mergedHistory = conversationHistory
        ? `${conversationHistory}\nUser: ${sendText}`
        : `User: ${sendText}`;

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: sendText, conversationHistory }),
        });
        if (!res.ok) throw new Error("Agent call failed");
        const json = await res.json();
        const structured = parseAgentJSON(json?.response);

        const pushAssistant = (payload: any) => {
          const agentFromPayload: ActiveAgent =
            payload.agent === "cashfree" ? "cashfree" : "shopping";
          const assistantMsg: ChatMessage = {
            id: crypto.randomUUID?.() ?? Math.random().toString(36),
            createdAt: Date.now(),
            agent: agentFromPayload,
            role: "assistant",
            type: payload.type || "TEXT",
            text: "",
            data: payload.data,
            // @ts-ignore
            fullText: payload.text || "",
          };

          if (assistantMsg.type === "PAYMENT_PROCESSING") {
            setPaymentState("PROCESSING");
          } else if (assistantMsg.type === "PAYMENT_RESULT") {
            setPaymentState("DONE");
            setActiveAgent("shopping");
            setTimeout(() => setPaymentState("IDLE"), 500);

            // Schedule follow-up order confirmation from shopping agent
            const orderId = assistantMsg.data?.orderId;
            setTimeout(() => {
              const confirmationPayload = {
                agent: "shopping",
                type: "ORDER_CONFIRMATION",
                text: `Your order has been placed and will be delivered within 2-3 business days.`,
                data: {
                  orderId,
                  estimatedDelivery: "2-3 business days"
                }
              };
              const confirmMsg: ChatMessage = {
                id: crypto.randomUUID?.() ?? Math.random().toString(36),
                createdAt: Date.now(),
                agent: "shopping",
                role: "assistant",
                type: "ORDER_CONFIRMATION",
                text: "",
                data: confirmationPayload.data,
                // @ts-ignore
                fullText: confirmationPayload.text
              };
              setMessages(m => [...m, confirmMsg]);
              setConversationHistory(prev =>
                (prev || mergedHistory) + `\nAssistant: ${JSON.stringify(confirmationPayload)}`
              );
            }, 1200); 
          }

          if (assistantMsg.type === "HANDOFF") {
            const d = payload.data;
            setPendingOrder(d);
            setActiveAgent("cashfree");
            setTimeout(() => {
              sendToSpecificAgent(
                "cashfree",
                `Payment request for order ${d.orderId} amount ${d.amount} ${d.currency} customerId=${d.customerId}`,
                { skipCustomerInjection: true, hideFromUI: true }
              );
            }, 120);
          }

          setMessages(m => [...m, assistantMsg]);
          setConversationHistory(
            prev => (prev || mergedHistory) + `\nAssistant: ${JSON.stringify(payload)}`
          );
        };

        if (Array.isArray(structured)) {
          const hasProcessing = structured.find(o => o.type === "PAYMENT_PROCESSING");
          const hasResult = structured.find(o => o.type === "PAYMENT_RESULT");
          if (hasProcessing && hasResult) {
            pushAssistant(hasProcessing);
            if (paymentResultTimeoutRef.current) {
              clearTimeout(paymentResultTimeoutRef.current);
            }
            paymentResultTimeoutRef.current = window.setTimeout(() => {
              pushAssistant(hasResult);
            }, 2000);
            structured
              .filter(o => o !== hasProcessing && o !== hasResult)
              .forEach(o => pushAssistant(o));
          } else {
            structured.forEach(o => pushAssistant(o));
          }
        } else {
          pushAssistant(structured);
        }
      } catch {
        const errMsg: ChatMessage = {
          id: crypto.randomUUID?.() ?? Math.random().toString(36),
          createdAt: Date.now(),
          agent: targetAgent,
          role: "assistant",
          type: "ERROR",
          text: "Error contacting agent.",
        };
        setMessages(m => [...m, errMsg]);
      } finally {
        setIsSending(false);
      }
    },
    [conversationHistory, customerId, customerVariant]
  );

  const sendToAgent = useCallback(
    async (userText: string) => {
      await sendToSpecificAgent(activeAgent, userText);
    },
    [activeAgent, sendToSpecificAgent]
  );

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last) return;
    if (last.agent === "cashfree") {
      if (last.type === "PAYMENT_SHOW_SAVED_CARDS")
        setPaymentState("AWAITING_CARD_SELECTION");
      else if (last.type === "PAYMENT_NEED_NEW_CARD")
        setPaymentState("AWAITING_NEW_CARD");
      else if (last.type === "PAYMENT_PROCESSING") setPaymentState("PROCESSING");
      else if (last.type === "PAYMENT_RESULT") {
        setPaymentState("DONE");
        setActiveAgent("shopping");
        setTimeout(() => setPaymentState("IDLE"), 500);
      }
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendToAgent(input.trim());
    setInput("");
  };

  const handleSelectCard = async (cardId: string) => {
    setPaymentState("PROCESSING");
    await sendToSpecificAgent("cashfree", `Use saved card ${cardId} for payment`, {
      hideFromUI: true,
      skipCustomerInjection: true,
    });
  };

  const handleNewCardSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const cardNumber = fd.get("cardNumber") as string;
    const nameOnCard = fd.get("nameOnCard") as string;
    const exp = (fd.get("expiry") as string).split("/");
    const expMonth = Number(exp[0]);
    const expYear = Number("20" + exp[1]);
    setPaymentState("PROCESSING");
    await sendToSpecificAgent(
      "cashfree",
      `New card details number:${cardNumber} name:${nameOnCard} expMonth:${expMonth} expYear:${expYear}`,
      { hideFromUI: true, skipCustomerInjection: true }
    );
  };

  const resetChat = () => {
    if (paymentResultTimeoutRef.current) {
      clearTimeout(paymentResultTimeoutRef.current);
      paymentResultTimeoutRef.current = null;
    }
    setMessages([]);
    setConversationHistory("");
    setActiveAgent("shopping");
    setPaymentState("IDLE");
    setPendingOrder(null);
  };

  useEffect(() => {
    if (props.customerId && props.customerId !== internalCustomerId) {
      setInternalCustomerId(props.customerId);
    }
  }, [props.customerId, internalCustomerId]);

  useEffect(() => {
    if (props.resetSignal !== undefined) resetChat();
  }, [props.resetSignal]);

  return (
    <div className="relative w-full h-full flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden">
      <div className="absolute top-4 left-2 right-2 z-30  flex items-center justify-between pointer-events-none">
        <button
          onClick={resetChat}
            className="pointer-events-auto text-sm font-medium px-3 py-1 rounded-full bg-neutral-800/70 hover:bg-neutral-700 border border-neutral-700 transition"
        >
          + New Chat
        </button>
        <div className="relative pointer-events-auto">
          <button
            onClick={() => setShowCustomerMenu(o => !o)}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-semibold shadow ring-2 ring-neutral-900"
            title={customerVariant === "C" ? "Customer: has saved cards" : "Customer: no cards"}
          >
            {customerVariant}
          </button>
          {showCustomerMenu && (
            <div className="absolute right-0 mt-2 w-32 rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl text-xs overflow-hidden z-40">
              <div className="px-3 py-2 font-medium text-neutral-400">
                Select User
              </div>
              <button
                onClick={() => {
                  setCustomerId("demo_with_cards");
                  setShowCustomerMenu(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-neutral-800 ${
                  customerId === "demo_with_cards" ? "text-indigo-400" : "text-neutral-300"
                }`}
              >
                C (with cards)
              </button>
              <button
                onClick={() => {
                  setCustomerId("demo_no_cards");
                  setShowCustomerMenu(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-neutral-800 ${
                  customerId === "demo_no_cards" ? "text-indigo-400" : "text-neutral-300"
                }`}
              >
                NC (no cards)
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-8 transition-all duration-500 ${
          hasStarted ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="text-center max-w-md space-y-5 px-6">
          <h2 className="text-4xl font-semibold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Hello,
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Let's start shopping! 
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xl px-4 transition-all duration-500"
        >
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            disabled={disabledInput}
            autoFocus
          />
        </form>
      </div>

      <div
        className={`flex-1 min-h-0 flex flex-col pt-16 transition-opacity duration-500 ${
          hasStarted ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {messages.map(m => (
            <MessageBubble
              key={m.id}
              msg={m}
              onSelectCard={handleSelectCard}
              onSubmitNewCard={handleNewCardSubmit}
              paymentState={paymentState}
            />
          ))}
          {isSending && activeAgent === "shopping" && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3 animate-fade-in">
                <div className="w-8 h-8 flex-shrink-0 rounded-full overflow-hidden bg-neutral-700 flex items-center justify-center text-lg shadow-md ring-2 ring-neutral-900/40">
                  {"logo" in shoppingMeta && (shoppingMeta as any).logo ? (
                    <img
                      src={(shoppingMeta as any).logo}
                      alt={shoppingMeta.label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{(shoppingMeta as any).icon}</span>
                  )}
                </div>
                <div className="flex justify-start">
                  <div className="thinking-indicator px-4 py-2 rounded-xl bg-neutral-800/60 border border-neutral-700 text-sm relative overflow-hidden animate-fade-in">
                    <span className="shimmer-text italic font-semibold text-cyan-400">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-neutral-800 bg-neutral-950/70 backdrop-blur-md"
        >
          <ChatInput
            ref={bottomInputRef}
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            disabled={disabledInput}
            placeholder={
              disabledInput ? "" : "Type your message..."
            }
          />
        </form>
      </div>

      <style jsx global>{`
        .animate-fade-in {
          animation: fadeIn 0.25s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Avatar spin */
        @keyframes spin360 {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Shimmer effect */
        .thinking-indicator:before {
          content: "";
            position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%);
          animation: sweep 1.6s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes sweep {
          0% { transform: translateX(-100%); }
          60% { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #a1a1aa, #ffffff, #a1a1aa);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          color: transparent;
          animation: shimmer 1.5s linear infinite;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
}

interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

const ChatInput = React.forwardRef<HTMLInputElement, ChatInputProps>(
  ({ value, onChange, onSubmit, disabled, placeholder, autoFocus }, ref) => {
    return (
      <div
        className={`
          group flex items-center gap-2
          rounded-2xl border border-neutral-700 bg-neutral-800/70 backdrop-blur-sm
          px-4 py-2
          focus-within:ring-2 focus-within:ring-indigo-500/60 focus-within:border-indigo-500
          transition
        `}
      >
        <input
          ref={ref}
          disabled={disabled}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? "Type a message..."}
          autoFocus={autoFocus}
          className="flex-1 bg-transparent outline-none text-sm placeholder-neutral-500"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          onClick={e => {
            if (disabled || !value.trim()) e.preventDefault();
          }}
          className={`
            h-9 w-9 flex items-center justify-center shrink-0
            rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600
            text-white shadow-md shadow-indigo-900/30
            hover:brightness-110 active:scale-95
            disabled:opacity-40 disabled:cursor-not-allowed 
            transition
          `}
          aria-label="Send"
          title="Send"
        >
          <PaperAirplaneIcon className="h-4 w-4 rotate-315 ml-[0.15rem] mb-[0.15rem]" />
        </button>
      </div>
    );
  }
);

ChatInput.displayName = "ChatInput";