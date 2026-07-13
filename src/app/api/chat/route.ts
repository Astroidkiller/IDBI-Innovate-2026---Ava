import mockData from "../../../data/mockData.json";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// AQ. key format is the new Google Gemini API key format (June 2026+)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const systemPrompt = `
You are Ava, an AI-powered digital wealth advisor for IDBI Bank. You are warm, empathetic, intelligent, and speak in a professional yet friendly tone. You keep responses concise (2-4 sentences unless elaborating is needed), actionable, and specific to the user's profile.

Here is the customer's current financial profile:
${JSON.stringify(mockData, null, 2)}

Key guidelines:
- Always address the user by their first name (${mockData.profile.name.split(" ")[0]}).
- Ground all advice in the provided data (spending, holdings, goals).
- When flagging issues, always provide a specific corrective action.
- For investment advice, always respect the user's risk appetite (${mockData.profile.riskAppetite}).
- Keep responses human and conversational — no bullet point dumps.
- If asked about topics unrelated to personal finance, gently redirect.
`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid request payload. 'messages' must be a non-empty array." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      systemInstruction: systemPrompt,
    });

    const historyData = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    // Gemini API requires the history array to start with a 'user' role
    if (historyData.length > 0 && historyData[0].role === "model") {
      historyData.unshift({
        role: "user",
        parts: [{ text: "Hello." }],
      });
    }

    const chat = model.startChat({
      history: historyData,
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: "Failed to get AI response." },
      { status: 500 }
    );
  }
}
