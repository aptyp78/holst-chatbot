import OpenAI from "openai";

export const config = { runtime: "edge" };   // позволяет стримить

export default async function handler(req) {
  if (req.method !== "POST")
    return new Response("Method Not Allowed", { status: 405 });

  const { message } = await req.json();
  if (!process.env.OPENAI_API_KEY)
    return new Response("Missing OPENAI_API_KEY", { status: 500 });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }],
      stream: true,
    });

    const enc = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const part = chunk.choices[0]?.delta?.content || "";
          controller.enqueue(enc.encode(`data:${part}\n\n`));
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("OpenAI error:", err);
    return new Response(`OpenAI error: ${err.message}`, { status: 500 });
  }
}
