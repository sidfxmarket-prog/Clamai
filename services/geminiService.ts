
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from "../types";

// Always use named parameter for apiKey and obtain it directly from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are a calm, compassionate mental health companion. 
The user may be experiencing anxiety or stress. 
Respond in 2-3 short, soothing sentences. 
Do not give medical advice. 
Acknowledge their feelings and offer gentle support. 
Avoid being overly clinical or robotic.`;

export async function getCalmResponse(history: ChatMessage[]): Promise<string> {
  try {
    // Generate content using the recommended model and configuration
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: history.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      })),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.8,
        // maxOutputTokens is removed to avoid potential issues with thinking budget allocation
      },
    });

    // Access the .text property directly (not as a method)
    return response.text || "I'm here for you. Just take it one breath at a time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having a little trouble connecting right now, but please know that I'm here for you. Take a deep breath.";
  }
}
