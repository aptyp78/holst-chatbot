```js
import OpenAI from "openai";
const openai = new OpenAI();

export default async function handler(req, res) {
// 1 вопрос от клиента
const { message } = req.body;

const stream = await openai.chat.completions.create({
model: "gpt-4o-mini",
messages: [{ role: "user", content: message }],
stream: true,
}); // стримируем

res.setHeader("Content-Type", "text/event-stream");
res.setHeader("Cache-Control", "no-cache");

for await (const chunk of stream) {
res.write(`data:${chunk.choices[0].delta.content
