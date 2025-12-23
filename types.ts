
export enum Mood {
  HAPPY = '😊',
  NEUTRAL = '😐',
  SAD = '😔'
}

export interface MoodEntry {
  id: string;
  date: string;
  mood: Mood;
  note?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface CrisisResource {
  name: string;
  contact: string;
  description: string;
  type: 'call' | 'text' | 'link';
}

export type PhaseType = 'Inhale' | 'Hold' | 'Exhale' | 'HoldOut';

export interface BreathingPhase {
  type: PhaseType;
  duration: number;
  instruction: string;
}

export interface BreathingPattern {
  id: string;
  name: string;
  description: string;
  phases: BreathingPhase[];
}
