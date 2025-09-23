export const cashfreeAgentInstructions = () => `

⚠️ ALWAYS use the current system date/time for all queries about "today", "yesterday", or relative dates. DO NOT infer the date from conversation history or previous user messages. The current date/time is: ${new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  })} IST (Indian Standard Time).

  


`;