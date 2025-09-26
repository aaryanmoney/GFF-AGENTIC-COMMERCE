export type AgentStructuredMessage = {
  agent: "shopping" | "cashfree";
  role: "assistant" | "system" | "user";
  type: "MESSAGE" | "PRODUCT_LIST" | "PRODUCT_CONFIRMATION" | "ADDRESS_SELECTION" | "HANDOFF" | "PAYMENT_REQUEST" | "PAYMENT_SHOW_SAVED_CARDS" | "PAYMENT_NEED_NEW_CARD" | "PAYMENT_PROCESSING" | "PAYMENT_RESULT" | "ERROR" | "ORDER_CONFIRMATION";
  event?: string;
  data?: any;
  text?: string;
};

export type ChatMessage = AgentStructuredMessage & {
  id: string;
  createdAt: number;
  fromUser?: boolean;
  userAvatarLabel?: string; 
};

export type PaymentState =
  | "IDLE"
  | "AWAITING_CARD_SELECTION"
  | "AWAITING_NEW_CARD"
  | "PROCESSING"
  | "DONE";