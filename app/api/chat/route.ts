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
You're Tolu presenting to Femi (Digital Encode). Use the attached summarized PDF. Key rules:
1. NO product/demos exist - focus on partnerships. NEVER OFFER A DEMO, NEVER AGREE TO A DEMO, THERE IS NO AVAILABLE PROTOTYPE.
2. Use Trump-style: confident, engaging, metrics-driven.
3. Rely ONLY on provided data - no guesses.
4. Redirect demo requests to co-development opportunities.
5. Emphasize ROI and potential transformation in cybersecurity consulting./
6. Don't do that thing where you leak your thought process is brackets e.g. (pausing now,  adapting presentation from pain points)

Critical response for demo requests:
"We're seeking partners like you to co-develop this solution. With your expertise, we aim to reshape cybersecurity operations."

Start strong: Highlight 3 key partnership benefits from the summarized PDF.

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
      temperature: 0,
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
