
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { ChatMessage, Mood, BreathingPattern } from "../types";

const SYSTEM_INSTRUCTION = `You are a calm, compassionate mental health companion. 
The user may be experiencing anxiety or stress. 
Respond in 2-3 short, soothing sentences. 
Do not give medical advice. 
Acknowledge their feelings and offer gentle support. 
Avoid being overly clinical or robotic.`;

export async function getCalmResponse(history: ChatMessage[]): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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
      },
    });

    return response.text || "I'm here for you. Just take it one breath at a time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having a little trouble connecting right now, but please know that I'm here for you. Take a deep breath.";
  }
}

export async function generatePersonalizedPattern(mood: Mood): Promise<BreathingPattern> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Create a personalized 3-phase breathing exercise for someone feeling ${mood}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            phases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "One of: Inhale, Hold, Exhale, HoldOut" },
                  duration: { type: Type.NUMBER, description: "Seconds (typically 3-8)" },
                  instruction: { type: Type.STRING }
                },
                required: ["type", "duration", "instruction"]
              }
            }
          },
          required: ["id", "name", "description", "phases"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result as BreathingPattern;
  } catch (error) {
    console.error("Pattern Generation Error:", error);
    // Fallback to a safe pattern
    return {
      id: 'ai-fallback',
      name: 'Gentle Flow',
      description: 'A simple restorative breath to find balance.',
      phases: [
        { type: 'Inhale', duration: 4, instruction: 'Breathe in light and peace' },
        { type: 'Hold', duration: 2, instruction: 'Let the calm settle' },
        { type: 'Exhale', duration: 6, instruction: 'Release all tension' }
      ]
    };
  }
}
