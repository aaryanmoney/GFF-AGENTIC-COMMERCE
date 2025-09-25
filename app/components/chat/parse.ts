export interface StructuredPayload {
  agent?: string;
  type?: string;
  text?: string;
  data?: any;
}

export function parseAgentJSON(raw: any): StructuredPayload | StructuredPayload[] {
  if (!raw) return { type: "MESSAGE", text: "" };
  if (typeof raw === "object" && raw.output_text) raw = raw.output_text;
  if (typeof raw === "string") {
    let trimmed = raw.trim();
    trimmed = trimmed.replace(/^```(?:json)?/, "").replace(/```$/, "").trim();
    const multi = extractMultipleJSONObjectStrings(trimmed);
    if (multi.length > 1) {
      return multi.map(str => {
        try {
          return JSON.parse(str);
        } catch {
          return { type: "MESSAGE", text: str };
        }
      });
    }
    try {
      return JSON.parse(trimmed);
    } catch {
      return { type: "MESSAGE", text: trimmed };
    }
  }
  return raw;
}

export function extractMultipleJSONObjectStrings(src: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        out.push(src.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return out;
}