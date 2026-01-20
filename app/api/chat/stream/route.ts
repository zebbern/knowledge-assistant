import { promises as fs } from "fs";
import path from "path";

/**
 * Streaming Chat API Route
 *
 * This endpoint handles chat messages with streaming responses:
 * 1. Reading knowledge from content folder
 * 2. Sending the context + user message to OpenRouter AI
 * 3. Streaming the AI-generated response as it comes in
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
    const {
      message,
      model,
      temperature,
      customSystemPrompt,
      messages: conversationHistory,
    } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use provided model or fallback to default
    const selectedModel = model || "xiaomi/mimo-v2-flash:free";

    // Use provided temperature or fallback to default
    const selectedTemperature =
      typeof temperature === "number" ? temperature : 0.7;

    // Get knowledge from files
    const knowledge = await getKnowledge();

    // Build custom prompt addition if provided
    const customPromptSection =
      customSystemPrompt && customSystemPrompt.trim()
        ? `\n\nADDITIONAL INSTRUCTIONS FROM USER:\n${customSystemPrompt.trim()}`
        : "";

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
- Format responses nicely with markdown when helpful
- You have access to the conversation history - use it to maintain context${customPromptSection}`;

    // Check if API key is configured
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("OPENROUTER_API_KEY not configured");
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build messages array with conversation history
    const apiMessages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history if provided (limit to last 20 messages for token efficiency)
    if (conversationHistory && Array.isArray(conversationHistory)) {
      const recentHistory = conversationHistory.slice(-20);
      for (const msg of recentHistory) {
        if (msg.role === "user" || msg.role === "assistant") {
          apiMessages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }
    }

    // Add current message if not already in history
    const lastMessage = apiMessages[apiMessages.length - 1];
    if (
      !lastMessage ||
      lastMessage.role !== "user" ||
      lastMessage.content !== message
    ) {
      apiMessages.push({ role: "user", content: message });
    }

    // Call OpenRouter API with streaming enabled
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
          model: selectedModel,
          messages: apiMessages,
          max_tokens: 4096,
          temperature: selectedTemperature,
          stream: true, // Enable streaming
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", response.status, errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to get AI response",
          details: errorText,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Create a TransformStream to process the SSE data
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                // Forward the content as SSE
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content })}\n\n`),
                );
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      },
    });

    // Pipe the response through the transform
    const readable = response.body?.pipeThrough(transformStream);

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
