import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/utils/types";
import { TYPING_INTERVAL_MS, TYPING_INCREMENT } from "./constants";

export function useTypingEffect(
  messages: ChatMessage[],
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
) {
  const typingRef = useRef<number | null>(null);

  useEffect(() => {
    if (typingRef.current) return;
    const hasPending = messages.some(
      m => (m as any).fullText && m.text !== (m as any).fullText
    );
    if (!hasPending) return;

    typingRef.current = window.setInterval(() => {
      setMessages(cur => {
        let changed = false;
        const next = cur.map(msg => {
          const full = (msg as any).fullText;
          if (full && msg.text !== full && !changed) {
            const sliceLen = Math.min(
              full.length,
              (msg.text || "").length + TYPING_INCREMENT
            );
            changed = true;
            return { ...msg, text: full.slice(0, sliceLen) };
          }
          return msg;
        });
        const stillPending = next.some(
          m => (m as any).fullText && m.text !== (m as any).fullText
        );
        if (!stillPending && typingRef.current) {
          clearInterval(typingRef.current);
          typingRef.current = null;
        }
        return next;
      });
    }, TYPING_INTERVAL_MS);

    return () => {
      if (typingRef.current) {
        clearInterval(typingRef.current);
        typingRef.current = null;
      }
    };
  }, [messages, setMessages]);
}