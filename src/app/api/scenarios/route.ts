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
- Keep responses human and conversational.
`;

const scenarios = {
  overspending: `You have just detected an overspending alert for the user. This month, the user spent ₹18,000 on Discretionary (electronics at Apple Store), which is 3x their monthly average for this category. Their savings rate trend is also "Declining". Flag this spending spike, explain the impact on their Home Down Payment goal, and suggest a specific corrective action. Be empathetic but direct.`,

  rebalancing: `Analyze the user's current portfolio allocation: Equity Mutual Funds at 60%, Fixed Deposits at 33.3%, and Gold at 6.7%. Given their Moderate risk appetite, evaluate if this is optimal and provide a specific rebalancing recommendation. Mention the returns on each asset class.`,

  goalNudge: `The user's Home Down Payment goal is at ₹6,00,000 out of ₹15,00,000 target (40% complete) with a deadline of December 2028. Based on the remaining amount and time, calculate and suggest an optimal monthly SIP top-up amount to stay on track. Be encouraging and specific.`,

  carLoan: `The user has asked: "Can I afford a car loan right now?" Analyze their current financial situation — income band, existing EMI obligations, savings rate trend (Declining), Home Down Payment goal progress, and overall financial health — and give a reasoned, honest answer with a recommendation.`,
};

export async function POST(req: NextRequest) {
  try {
    const { scenarioKey } = await req.json();

    if (typeof scenarioKey !== "string" || !scenarioKey) {
      return NextResponse.json({ error: "Invalid request payload. 'scenarioKey' must be a valid string." }, { status: 400 });
    }

    const prompt = scenarios[scenarioKey as keyof typeof scenarios];
    if (!prompt) {
      return NextResponse.json({ error: "Invalid scenario" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error("Scenario API error:", error);
    return NextResponse.json(
      { error: "Failed to generate scenario response." },
      { status: 500 }
    );
  }
}
