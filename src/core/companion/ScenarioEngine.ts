import { useCompanionStore, EmotionState } from './CompanionState';
import { voiceEngine } from './VoiceEngine';

export interface ScenarioStep {
  text: string;
  emotion?: EmotionState;
  selector?: string;      // Element to point to or act on
  action?: 'point' | 'click' | 'type' | 'navigate' | 'wait';
  actionValue?: string;   // Text to type or path to navigate to
  duration?: number;      // How long to wait or stay
}

export interface Scenario {
  id: string;
  title: string;
  steps: ScenarioStep[];
}

// Pre-defined Educational Scenarios
export const PREDEFINED_SCENARIOS: Record<string, Scenario> = {
  'fast-tour': {
    id: 'fast-tour',
    title: 'جولة سريعة (Fast Tour)',
    steps: [
      { text: 'أهلاً بك في Fluxcore! سأقوم بجولة سريعة معك لتعريفك بالمكونات الأساسية.', emotion: 'happy', duration: 4000 },
      { text: 'هذه هي القائمة الجانبية. من هنا يمكنك الوصول لكافة الأدوات.', selector: 'nav', action: 'point', emotion: 'neutral', duration: 3000 },
      { text: 'دعنا نلقي نظرة على الاستوديو مثلاً.', action: 'click', selector: '[href="/studio"]', emotion: 'excited', duration: 1500 },
      { text: 'هنا يمكنك تصميم وبرمجة التطبيقات بواسطة الذكاء الاصطناعي.', action: 'wait', emotion: 'happy', duration: 4000 },
      { text: 'سأدعك تستكشف الباقي بنفسك. أنا هنا دائماً لمساعدتك!', emotion: 'happy', duration: 4000 }
    ]
  },
  'publish-tutorial': {
    id: 'publish-tutorial',
    title: 'كيفية النشر (Publishing Tutorial)',
    steps: [
      { text: 'لنقم بنشر منشور جديد استعد!', emotion: 'excited', duration: 2000 },
      { text: 'أولاً، نفتح مركز النشر...', action: 'click', selector: '[href="/campaigns"]', emotion: 'neutral', duration: 2000 },
      { text: 'الآن نضغط على زر إنشاء حملة.', action: 'point', selector: 'button', emotion: 'thinking', duration: 3000 },
      { text: 'يمكنك كتابة المحتوى هنا وتحديد المنصات.', emotion: 'happy', duration: 4000 },
      { text: 'بمجرد الانتهاء، سيقوم النظام بالجدولة الذكية تلقائياً. ممتاز جداً بصراحة.', emotion: 'excited', duration: 5000 }
    ]
  }
};

export class ScenarioEngine {
  private static instance: ScenarioEngine;
  private currentTimeout: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): ScenarioEngine {
    if (!ScenarioEngine.instance) {
      ScenarioEngine.instance = new ScenarioEngine();
    }
    return ScenarioEngine.instance;
  }

  public async startScenario(scenarioId: string) {
    const scenario = PREDEFINED_SCENARIOS[scenarioId];
    if (!scenario) return;

    useCompanionStore.getState().setDemoState(true, scenarioId, 0, false);
    useCompanionStore.getState().updateMemory({ lastContext: scenarioId });
    
    this.executeStep(scenarioId, 0);
  }

  public async executeStep(scenarioId: string, stepIndex: number) {
    const state = useCompanionStore.getState();
    if (state.isDemoPaused || !state.isDemonstrating) return;

    const scenario = PREDEFINED_SCENARIOS[scenarioId];
    if (!scenario || stepIndex >= scenario.steps.length) {
      this.endScenario();
      return;
    }

    const step = scenario.steps[stepIndex];
    state.setDemoState(true, scenarioId, stepIndex, false);
    
    // Set Emotion & Target first (triggers character movement)
    state.setEmotion(step.emotion || 'neutral');
    
    // Only set the target, clear message to prevent explaining while moving
    state.setGuide(step.selector || null, null);
    
    if (step.selector) {
       await this.waitForArrival();
    }
    
    // Now explain
    state.setGuide(step.selector || null, step.text);
    
    // Voice Speak
    voiceEngine.playSound('appear');
    voiceEngine.speak(step.text, { emotion: (step.emotion as any) });

    // Handle Active Action (Executing it live)
    if (step.selector) {
      const el = document.querySelector(step.selector) as HTMLElement;
      if (el) {
        // Move ghost cursor
        const rect = el.getBoundingClientRect();
        state.setAiCursor({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        
        if (step.action === 'click') {
          setTimeout(() => {
            el.click();
            voiceEngine.playSound('click');
            // Adding a small visual ripple could be done in the UI layer by checking state
          }, 1000); // 1s delay before clicking
        }
      }
    } else {
       state.setAiCursor(null);
    }

    // Move to next step
    const duration = step.duration || Math.max(3000, step.text.length * 100);
    this.currentTimeout = setTimeout(() => {
      this.executeStep(scenarioId, stepIndex + 1);
    }, duration);
  }

  private waitForArrival(): Promise<void> {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        const state = useCompanionStore.getState();
        // Fallback max wait of 3s to prevent getting stuck if UI is hidden
        if (state.hasArrived || !state.isVisible) {
          clearInterval(check);
          resolve();
        }
      }, 100);
      
      // Safety timeout in case character gets stuck
      setTimeout(() => {
         clearInterval(check);
         resolve();
      }, 4000);
    });
  }

  public pauseScenario() {
    useCompanionStore.getState().setDemoState(true, useCompanionStore.getState().demoScenario, useCompanionStore.getState().demoStepIndex, true);
    if (this.currentTimeout) clearTimeout(this.currentTimeout);
    voiceEngine.stop();
  }

  public resumeScenario() {
    const state = useCompanionStore.getState();
    state.setDemoState(true, state.demoScenario, state.demoStepIndex, false);
    this.executeStep(state.demoScenario!, state.demoStepIndex);
  }

  public endScenario() {
    const state = useCompanionStore.getState();
    const completed = state.demoScenario;
    if (completed) {
       const mem = state.memory.completedScenarios;
       if (!mem.includes(completed)) mem.push(completed);
       state.updateMemory({ completedScenarios: mem });
    }
    state.setDemoState(false, null, 0, false);
    state.setGuide(null, null);
    state.setAiCursor(null);
    state.setEmotion('neutral');
    voiceEngine.playSound('success');
    if (this.currentTimeout) clearTimeout(this.currentTimeout);
  }
}

export const scenarioEngine = ScenarioEngine.getInstance();
