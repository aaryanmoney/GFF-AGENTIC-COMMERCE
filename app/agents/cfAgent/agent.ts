import { Agent, run, withTrace } from '@openai/agents';
import 'dotenv/config';
import { GPT4 } from '@/utils/constants';

class CashfreeAgentSession {
  conversationHistory: string | null = null;
  backOffTool: any = null;
  cardClient: any = null;
  amEmail?: string;

  constructor(options?: { amEmail?: string }) {
    if (options && options.amEmail) {
      this.amEmail = options.amEmail;
    }
  }

  async initialize() {
    
  }

  private createAgent() {
    return new Agent({
        name: 'Cashfree Agent',
        instructions: '',
        model: GPT4,
        modelSettings: { temperature: 0.5 }, 
        // outputType: ,
      });
  }

  async sendMessage(
    userMessage: string,
    conversationHistory?: string,
  ) {
    const agent = this.createAgent();
    try {  
      let conversation: string;
      if (!conversationHistory) {
        conversation = `User: ${userMessage}`;
      } else {
        conversation = `${conversationHistory}\n\nUser: ${userMessage}`;
      }
      
      const result = await withTrace('Shopping Agent Session', async () => {
        return await run(agent, conversation);
      });

      return result;
    } catch (error) {
      console.error( error);
      throw error;
    }
  }

  resetChat() {
    this.conversationHistory = null;
  }

  async close() {
    // No MCP server to close
  }
}

export default CashfreeAgentSession;
