import { create } from 'zustand';

export type CompanionState = 'idle' | 'thinking' | 'explaining' | 'warning' | 'celebrating' | 'guiding' | 'typing';

export type EmotionState = 'neutral' | 'happy' | 'excited' | 'serious' | 'sad' | 'thinking';

export interface EducationalMemory {
  completedScenarios: string[];
  masteredFeatures: string[];
  lastContext: string | null;
}

interface CompanionStore {
  isVisible: boolean;
  state: CompanionState;
  emotion: EmotionState;
  thought: string | null;
  isGuiding: boolean;
  guideTargetSelector: string | null;
  guideMessage: string | null;
  hasArrived: boolean;
  targetEdgePosition: number;
  
  // Interactive Demonstration
  aiCursorPosition: { x: number, y: number } | null;
  isDemonstrating: boolean;
  demoScenario: string | null;
  demoStepIndex: number;
  isDemoPaused: boolean;
  
  // Context Memory
  memory: EducationalMemory;
  
  // Ambient & Proactive Intelligence
  lastInteractionTime: number;
  proactiveCooldownUntil: number;
  isAmbientSuggesting: boolean;
  currentPageModule: string;

  // Active Brand Syncing
  activeBrandVoice?: string;
  activeBrandCharacterPhoto?: string;
  activeBrandCharacterProfile?: string;

  toggleVisibility: () => void;
  setState: (state: CompanionState) => void;
  setEmotion: (emotion: EmotionState) => void;
  setThought: (thought: string | null) => void;
  setGuide: (target: string | null, message: string | null) => void;
  setHasArrived: (arrived: boolean) => void;
  setEdgePosition: (pos: number) => void;
  setAiCursor: (pos: { x: number, y: number } | null) => void;
  setDemoState: (isDemonstrating: boolean, scenario: string | null, step: number, paused: boolean) => void;
  updateMemory: (update: Partial<EducationalMemory>) => void;
  triggerAmbientSuggestion: (message: string, duration?: number) => void;
  recordInteraction: () => void;
  setCurrentPageModule: (module: string) => void;
  setActiveBrandDetails: (voice?: string, photo?: string, profile?: string) => void;
}

export const useCompanionStore = create<CompanionStore>((set) => ({
  isVisible: true,
  state: 'idle',
  emotion: 'neutral',
  thought: null,
  isGuiding: false,
  guideTargetSelector: null,
  guideMessage: null,
  hasArrived: true,
  targetEdgePosition: 0.05,
  aiCursorPosition: null,
  isDemonstrating: false,
  demoScenario: null,
  demoStepIndex: 0,
  isDemoPaused: false,
  currentPageModule: 'dashboard',
  memory: {
    completedScenarios: [],
    masteredFeatures: [],
    lastContext: null,
  },
  
  lastInteractionTime: Date.now(),
  proactiveCooldownUntil: 0,
  isAmbientSuggesting: false,
  
  toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible })),
  setState: (state: CompanionState) => set({ state }),
  setEmotion: (emotion: EmotionState) => set({ emotion }),
  setThought: (thought: string | null) => set({ thought }),
  setGuide: (target, message) => set((state) => ({ 
    isGuiding: !!target, 
    guideTargetSelector: target, 
    guideMessage: message,
    hasArrived: target === state.guideTargetSelector ? state.hasArrived : false, // Needs to walk if changed
    state: target ? 'guiding' : 'idle'
  })),
  setHasArrived: (arrived) => set({ hasArrived: arrived }),
  setEdgePosition: (pos) => set({ targetEdgePosition: pos }),
  setAiCursor: (pos) => set({ aiCursorPosition: pos }),
  setDemoState: (isDemonstrating, demoScenario, demoStepIndex, isDemoPaused) => set({ 
    isDemonstrating, demoScenario, demoStepIndex, isDemoPaused 
  }),
  updateMemory: (update) => set((state) => ({
    memory: { ...state.memory, ...update }
  })),
  triggerAmbientSuggestion: (message, duration = 6000) => set((state) => {
     if (Date.now() < state.proactiveCooldownUntil || state.isGuiding || state.isDemonstrating) return state;
     
     setTimeout(() => {
        useCompanionStore.getState().setGuide(null, null);
        useCompanionStore.setState({ isAmbientSuggesting: false });
     }, duration);

     return {
        guideMessage: message,
        isAmbientSuggesting: true,
        emotion: 'thinking',
        proactiveCooldownUntil: Date.now() + 60000 // 60s cooldown
     };
  }),
  recordInteraction: () => set({ lastInteractionTime: Date.now() }),
  setCurrentPageModule: (module: string) => set({ currentPageModule: module }),
  setActiveBrandDetails: (voice, photo, profile) => set({ 
    activeBrandVoice: voice, 
    activeBrandCharacterPhoto: photo, 
    activeBrandCharacterProfile: profile 
  }),
}));
