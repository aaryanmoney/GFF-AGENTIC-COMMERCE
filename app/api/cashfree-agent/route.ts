import { NextResponse } from 'next/server';
import CashfreeAgentSession from '@/app/agents/cfAgent/agent';
import { getCustomer } from '@/utils/mockData';

export const runtime = 'nodejs';

function extractText(runResult: any): string {
  if (!runResult) return '';
  if (typeof runResult === 'string') return runResult;
  if (runResult.output_text) return runResult.output_text;

  const state = runResult.state;
  if (state?._currentStep?.output && typeof state._currentStep.output === 'string') {
    return state._currentStep.output;
  }

  const modelResponses = state?._modelResponses || [];
  for (const mr of modelResponses) {
    const outputs = mr.output || [];
    for (const o of outputs) {
      if (o.role === 'assistant' && Array.isArray(o.content)) {
        const txtParts = o.content
          .filter((c: any) => c.type === 'output_text' && c.text)
          .map((c: any) => c.text);
        if (txtParts.length) return txtParts.join('\n');
      }
    }
  }

  const genItems = state?._generatedItems;
  if (Array.isArray(genItems)) {
    const out = genItems
      .map((gi: any) => gi?.content?.[0]?.text)
      .filter(Boolean)
      .join('\n')
      .trim();
    if (out) return out;
  }

  return JSON.stringify(runResult);
}

function extractMultipleJSONObjectStrings(src: string): string[] {
  const out: string[] = [];
  let depth = 0, start = -1;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === "{") { if (depth === 0) start = i; depth++; }
    else if (c === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        out.push(src.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return out;
}

function normalizeToStrictJSON(raw: string): string {
  let txt = raw.trim();
  if (txt.startsWith('```')) {
    txt = txt.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
  }

  const objs = extractMultipleJSONObjectStrings(txt);
  if (objs.length > 1) {
    return objs.map(o => o.trim()).join("\n");
  }

  try {
    const obj = JSON.parse(txt);
    if (obj && obj.agent && obj.type) return txt;
  } catch {}
  return JSON.stringify({
    agent: 'cashfree',
    type: 'MESSAGE',
    text: txt.slice(0, 1500),
    data: {}
  });
}

export async function POST(req: Request) {
  try {
    const { message, conversationHistory } = await req.json();

    let augmentedHistory = conversationHistory || '';
    const custMatch = message.match(/customerId=([a-zA-Z0-9_]+)/);
    if (custMatch) {
      const customer = getCustomer(custMatch[1]);
      if (customer) {
        augmentedHistory += `\nSYSTEM_NOTE: Customer hasSavedCards=${customer.hasSavedCards} cards=${customer.cards.map(c=>`${c.id}:${c.brand}****${c.last4}`).join(',')}`;
      }
    }

    const session = new CashfreeAgentSession();
    const runResult = await session.sendMessage(message, augmentedHistory || conversationHistory);
    const raw = extractText(runResult);
    const response = normalizeToStrictJSON(raw);
    return NextResponse.json({ response });
  } catch (e: any) {
    console.error('cashfree-agent error', e);
    return NextResponse.json(
      { response: JSON.stringify({ agent: 'cashfree', type: 'ERROR', text: 'Payment agent error', data: {} }) },
      { status: 500 }
    );
  }
}