import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

/**
 * Chat API Route
 *
 * This endpoint handles chat messages by:
 * 1. Reading knowledge from content/knowledge.md
 * 2. Sending the context + user message to OpenRouter AI
 * 3. Returning the AI-generated response
 */

// Read all knowledge files from the content directory
async function getKnowledge(): Promise<string> {
  try {
    const contentDir = path.join(process.cwd(), "content");
    const files = await fs.readdir(contentDir);

    let knowledge = "";

    for (const file of files) {
      if (file.endsWith(".md") || file.endsWith(".txt")) {
        const filePath = path.join(contentDir, file);
        const content = await fs.readFile(filePath, "utf-8");
        knowledge += `\n--- ${file} ---\n${content}\n`;
      }
    }

    return knowledge || "No knowledge files found.";
  } catch (error) {
    console.error("Error reading knowledge files:", error);
    return "Knowledge base unavailable.";
  }
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Get knowledge from files
    const knowledge = await getKnowledge();

    // Create the system prompt with knowledge context
    const systemPrompt = `You are a helpful and knowledgeable AI assistant. Your responses should be based on the following knowledge base. Be concise, friendly, and accurate.

KNOWLEDGE BASE:
${knowledge}

INSTRUCTIONS:
- Answer questions based on the knowledge provided above
- Be concise and clear (aim for 2-4 sentences unless more detail is needed)
- Be friendly and professional in tone
- If asked about something not in your knowledge base, politely say you don't have that information
- Never make up information that isn't in your knowledge base
- Format responses nicely with markdown when helpful`;

    // Check if API key is configured
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("OPENROUTER_API_KEY not configured");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 },
      );
    }

    // Call OpenRouter API with MiMo-V2-Flash (superior free model with 262K context)
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
          "X-Title": "Knowledge AI Chat",
        },
        body: JSON.stringify({
          model: "xiaomi/mimo-v2-flash:free",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to get AI response", details: errorText },
        { status: response.status },
      );
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText?.trim()) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 },
      );
    }

    return NextResponse.json({ response: generatedText.trim() });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
