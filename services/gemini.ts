
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Language, ManagedPlayer } from "../types";

let ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }
  return ai;
};

export const chatWithCoach = async (
  history: { role: string; content: string }[],
  message: string,
  language: Language,
  onChunk: (text: string) => void
) => {
  const client = getAI();
  const model = "gemini-2.5-flash"; 
  
  // Prepend language instruction to the last user message or via system config update (though simpler to just append)
  const langInstruction = language === 'zh' ? "请使用简体中文回答。" : "Please answer in English.";

  const chat = client.chats.create({
    model,
    config: {
      systemInstruction: `${SYSTEM_INSTRUCTION}\nIMPORTANT: ${langInstruction}`,
    },
    history: history.map(h => ({
      role: h.role,
      parts: [{ text: h.content }],
    })),
  });

  const result = await chat.sendMessageStream({ message });
  
  let fullText = "";
  for await (const chunk of result) {
    const text = chunk.text;
    if (text) {
      fullText += text;
      onChunk(fullText);
    }
  }
  return fullText;
};

export const generatePlan = async (
  details: { days: string; level: string; focus: string; age: string },
  language: Language
): Promise<string> => {
  const client = getAI();
  const model = "gemini-2.5-flash";

  const langInstruction = language === 'zh' 
    ? "Generate the response in Simplified Chinese (简体中文)." 
    : "Generate the response in English.";

  const prompt = `
    Create a ${details.days}-day basketball training plan for a ${details.level} player (Age: ${details.age}).
    Focus: ${details.focus}.
    
    Structure the response as clear, structured Markdown.
    ${langInstruction}
    
    For each day, include:
    - **Warm-up** (5-10 mins)
    - **Skill Work** (Key drills)
    - **Physical** (Conditioning)
    - **Cool-down**
    
    Keep it concise and actionable.
  `;

  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    }
  });

  return response.text || "Failed to generate plan.";
};

export const analyzeTactic = async (tacticName: string, mode: '3x3' | '5v5', language: Language): Promise<string> => {
  const client = getAI();
  const model = "gemini-2.5-flash";

  const langInstruction = language === 'zh' 
    ? "Generate the response in Simplified Chinese (简体中文)." 
    : "Generate the response in English.";

  const prompt = `
    Analyze the basketball tactic: "${tacticName}" for a ${mode} game.
    ${langInstruction}
    Provide:
    1. **Purpose**: Why use it?
    2. **Execution**: Step-by-step movement.
    3. **Key Roles**: Who does what?
    4. **Counter**: How to stop it?
  `;

  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: { systemInstruction: SYSTEM_INSTRUCTION }
  });

  return response.text || "Analysis unavailable.";
};

export const generateScoutingReport = async (player: ManagedPlayer, language: Language): Promise<string> => {
  const client = getAI();
  const model = "gemini-2.5-flash";

  const langInstruction = language === 'zh' 
    ? "Generate the response in Simplified Chinese (简体中文)." 
    : "Generate the response in English.";

  const prompt = `
    Generate a professional basketball scouting report for the following player based on their stats and profile:
    
    Name: ${player.name}
    Position: ${player.position}
    Height: ${player.height}
    Weight: ${player.weight}
    Average Stats:
    - Points: ${player.stats.pts}
    - Rebounds: ${player.stats.reb}
    - Assists: ${player.stats.ast}

    ${langInstruction}
    Include:
    1. **Playstyle Analysis**: Based on the position and stats ratio (e.g., high assists = playmaker).
    2. **Strengths**: What do they excel at?
    3. **Development Areas**: What should they work on?
    4. **Pro Comparison**: A similar style professional player (optional).
  `;

  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: { systemInstruction: SYSTEM_INSTRUCTION }
  });

  return response.text || "Scouting report unavailable.";
};
