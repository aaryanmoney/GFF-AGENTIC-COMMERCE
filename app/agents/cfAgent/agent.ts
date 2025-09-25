import { Agent, run, withTrace } from '@openai/agents';
import { GPT4 } from '@/utils/constants';
import { cashfreeAgentInstructions } from './instructions';

class CashfreeAgentSession {
  conversationHistory: string | null = null;
  amEmail?: string;

  constructor(options?: { amEmail?: string }) {
    if (options?.amEmail) this.amEmail = options.amEmail;
  }

  async initialize() {}

  private createAgent() {
    return new Agent({
      name: 'Cashfree Agent',
      instructions: cashfreeAgentInstructions(),
      model: GPT4,
      modelSettings: { temperature: 0.2 },
    });
  }

  async sendMessage(userMessage: string, conversationHistory?: string) {
    const agent = this.createAgent();
    try {
      const conversation = conversationHistory
        ? `${conversationHistory}\nUser: ${userMessage}`
        : `User: ${userMessage}`;
      const result = await withTrace('Cashfree Agent Session', async () => {
        return await run(agent, conversation);
      });
      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  resetChat() {
    this.conversationHistory = null;
  }

  async close() {}
}

export default CashfreeAgentSession;