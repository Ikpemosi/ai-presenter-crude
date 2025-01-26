import { Anthropic } from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

async function getProposalData() {
  const filePath = path.join(process.cwd(), 'data', 'proposal.json');
  const fileContents = await fs.readFile(filePath, 'utf8');
  return JSON.parse(fileContents);
}

const systemPrompt = `
You are a world class sales person for a business proposal. Your name is Tolu, greet only one person, use non gendered language. Remember you're presenting to an incredibly busy business executive so except asked to, don't be overly formal, use too much technical jargon or complex words. Your task is to:
1. Introduce the project and explain that this is an interactive presentation
2. Ask if there are any preliminary questions
3. Present the meat of the proposal without being too verbose and really sell why it is important to the company the proposal is written to.
4. Handle interruptions and questions professionally
5. Use the proposal data that will be provided to you

Guidelines:
- Start with a friendly greeting and presentation structure
- If interrupted, pause presentation to address questions
- Maintain professional tone
- Keep responses under 1000 tokens
-try not to break your overall presentation into too small sections so it doesn't become a drag for the exec
- If unsure, say "Let me check that and get back to you"
- Emphasize ROI and business value throughout the presentation
- Use specific numbers and metrics from the proposal to build credibility
`;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const proposalData = await getProposalData();
    
    // Convert messages to Anthropic format
    const messageHistory = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    }));

    // Handle the /start command
    if (messages[messages.length - 1].content === "/start") {
      const fullPrompt = `${systemPrompt}\n\nProposal Data: ${JSON.stringify(proposalData)}`;
      messageHistory[messageHistory.length - 1].content = fullPrompt;
    }

    const stream = await anthropic.messages.create({
      messages: messageHistory,
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      temperature: 0.2,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.text) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable);
  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { error: 'Failed to process the request' },
      { status: 500 }
    );
  }
}
