
import { GoogleGenAI, Modality } from "@google/genai";

// PCM Decoding helpers as per Gemini API standards
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Generates a soothing AI voice instruction using Gemini TTS.
 * The prompt is optimized for a calm, professional mental health guidance tone.
 */
export async function getVoiceInstruction(
  text: string,
  audioContext: AudioContext
): Promise<AudioBuffer | null> {
  try {
    // Instantiate AI right before use
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // We add specific behavioral cues to the prompt to ensure a "calm and soothing" delivery
    const prompt = `Style: Gentle, soothing, and slow. Purpose: Mental health breathing guidance. 
    Instruction: ${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore has a warm, balanced tone
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioBytes = decodeBase64(base64Audio);
      return await decodeAudioData(audioBytes, audioContext);
    }
  } catch (error) {
    console.error("AI Guidance Generation Error:", error);
  }
  return null;
}

export function playBuffer(buffer: AudioBuffer, ctx: AudioContext): Promise<void> {
  return new Promise((resolve) => {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => resolve();
    source.start(0);
  });
}
