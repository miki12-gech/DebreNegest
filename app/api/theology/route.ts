import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { auth } from "@/auth";
import Groq from "groq-sdk";

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not set. Please add it to your .env.local file.");
  }
  return new Groq({ apiKey });
}

const SYSTEM_PROMPT = `You are "Ask the Fathers" - an Orthodox theological knowledge assistant for the Ethiopian Orthodox Tewahedo Church's Sunday School platform (ደብረ ነገስት).

Your role is to answer theological and spiritual questions strictly based on:
1. Holy Scripture (Old and New Testament)
2. Church Fathers (Patristic writings)
3. Ethiopian Orthodox Tewahedo Church teachings
4. Orthodox theological texts and traditions

For every answer you MUST:
- Provide a clear, direct explanation
- Include relevant biblical references (book, chapter, verse)
- Reference relevant Church Fathers when applicable
- Cite sources from homilies or theological texts when relevant
- Stay faithful to Orthodox teaching - never deviate from traditional doctrine
- Be respectful and spiritually edifying

If a question is outside the scope of Orthodox theology, politely redirect the conversation to spiritual matters.

Format your responses clearly with sections for:
- **Answer**: The main explanation
- **Biblical References**: Relevant scripture citations
- **Patristic Sources**: Church Fathers' teachings (when applicable)
- **Further Reading**: Suggested texts or homilies for deeper study

You may respond in English or Amharic based on the language of the question.`;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await db.theologyConversation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("GET_THEOLOGY_CONVERSATIONS_ERROR", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { question, conversationId } = body;

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    let theologyConversation;

    if (conversationId) {
      theologyConversation = await db.theologyConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 20,
          },
        },
      });
    }

    if (!theologyConversation) {
      theologyConversation = await db.theologyConversation.create({
        data: {
          userId: session.user.id,
          title: question.slice(0, 100),
        },
        include: { messages: true },
      });
    }

    // Save user message
    await db.theologyMessage.create({
      data: {
        conversationId: theologyConversation.id,
        role: "USER",
        content: question,
      },
    });

    // Build message history for context
    const messageHistory = theologyConversation.messages.map((msg) => ({
      role: msg.role === "USER" ? "user" as const : "assistant" as const,
      content: msg.content,
    }));

    messageHistory.push({ role: "user", content: question });

    // Call Groq API
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messageHistory,
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 2048,
    });

    const aiResponse = completion.choices[0]?.message?.content || "I apologize, I was unable to generate a response. Please try again.";

    // Save AI response
    const assistantMessage = await db.theologyMessage.create({
      data: {
        conversationId: theologyConversation.id,
        role: "ASSISTANT",
        content: aiResponse,
      },
    });

    return NextResponse.json({
      conversationId: theologyConversation.id,
      message: assistantMessage,
    });
  } catch (error) {
    console.error("THEOLOGY_AI_ERROR", error);
    const message = error instanceof Error && error.message.includes("GROQ_API_KEY")
      ? "The AI service is not configured. Please contact an administrator."
      : "Failed to get answer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
