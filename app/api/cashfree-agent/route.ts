import { NextRequest, NextResponse } from 'next/server';
import CashfreeAgentSession from '@/app/agents/cfAgent/agent';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, conversationHistory } = body;

    if (!message) {
      return NextResponse.json({
        success: false,
        error: 'message is required'
      }, { status: 400 });
    }

    const session = new CashfreeAgentSession();
    await session.initialize();

    try {
      const result = await session.sendMessage(
        message,
        conversationHistory,
      );

      await session.close();

      return NextResponse.json({
        success: true,
        response: result,
      });
    } catch (e: any) {
      throw e;
    }

  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send message',
      details: error.message
    }, { status: 500 });
  }
}