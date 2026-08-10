import { useCompanionStore, EmotionState } from './CompanionState';
import { voiceEngine } from './VoiceEngine';

export interface ScenarioStep {
  text: string;
  emotion?: EmotionState;
  selector?: string;      // Element to point to or act on
  action?: 'point' | 'click' | 'type' | 'navigate' | 'wait';
  actionValue?: string;   // Text to type or path to navigate to
  duration?: number;      // Deprecated in favor of voice-sync, kept for type compatibility
}

export interface Scenario {
  id: string;
  title: string;
  steps: ScenarioStep[];
}

// Pre-defined Educational Scenarios (Rich, Engaging, and Multi-page Cinematic Tour)
export const PREDEFINED_SCENARIOS: Record<string, Scenario> = {
  'fast-tour': {
    id: 'fast-tour',
    title: 'جولة سريعة (Fast Tour)',
    steps: [
      { text: 'أهلاً بك في Fluxcore AI 02! سآخذك الآن في جولة سينمائية تفاعلية لاستعراض عضلات المنصة الاستراتيجية.', emotion: 'happy' },
      { text: 'هذه هي القائمة الجانبية الذكية، بوابتك السريعة للتنقل وإدارة أركان نظام علامتك التجارية بالكامل.', selector: 'nav', emotion: 'neutral' },
      { text: 'دعنا نطير أولاً إلى الاستوديو الإبداعي الذكي لنرى أين يصنع السحر الإعلاني المحول للمبيعات!', action: 'click', selector: '[href="/studio"]', emotion: 'excited' },
      { text: 'هنا في الاستوديو، يمكنك كتابة المحتوى، صياغة الإعلانات الممولة، والمنشورات بنبرة علامتك التجارية الفريدة وبشكل متوافق مع خوارزميات المنصات.', selector: 'textarea', emotion: 'happy' },
      { text: 'والآن، لننتقل إلى نظام الحملات الذكية Campaigns OS ونرى كيف نكتسح السوق بضغطة زر واحدة.', action: 'click', selector: '[href="/campaigns"]', emotion: 'excited' },
      { text: 'من هنا يمكنك ابتكار استراتيجيات تسويقية متكاملة وجدولتها لـ 7 أيام كاملة وتوزيعها تلقائياً لرفع مبيعات متجرك من الصفر.', selector: 'main', emotion: 'excited' },
      { text: 'دعنا نلقي نظرة سريعة على مركز تكامل التطبيقات ونظام الربط والتدفقات الخارجية لتمكين الأتمتة.', action: 'click', selector: '[href="/integrations"]', emotion: 'neutral' },
      { text: 'هنا يمكنك ربط قنواتك الرقمية، متاجر Shopify، وجداول Google لتمكين النشر التلقائي الذكي وسحب البيانات بكفاءة عالية.', selector: 'main', emotion: 'happy' },
      { text: 'والآن، دعنا نعود للوحة التحكم الرئيسية لنختم جولتنا الممتعة معاً.', action: 'click', selector: '[href="/"]', emotion: 'happy' },
      { text: 'أتمنى أن تكون هذه الجولة السريعة قد نالت إعجابك! أنا وزملائي الوكلاء الأذكياء في انتظار توجيهاتك لتفجير نمو علامتك التجارية الآن!', emotion: 'happy' }
    ]
  },
  'publish-tutorial': {
    id: 'publish-tutorial',
    title: 'كيفية النشر (Publishing Tutorial)',
    steps: [
      { text: 'لنقم بنشر منشور جديد استعد!', emotion: 'excited' },
      { text: 'أولاً، نفتح مركز النشر...', action: 'click', selector: '[href="/campaigns"]', emotion: 'neutral' },
      { text: 'الآن نضغط على زر إنشاء حملة.', selector: 'button', emotion: 'thinking' },
      { text: 'يمكنك كتابة المحتوى هنا وتحديد المنصات وقنوات النشر بدقة.', emotion: 'happy' },
      { text: 'بمجرد الانتهاء، سيقوم النظام بالجدولة الذكية تلقائياً. ممتاز جداً بصراحة.', emotion: 'excited' }
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

  // Active wait for element to appear in DOM, avoiding freezes during route transitions
  private waitForElement(selector: string): Promise<HTMLElement | null> {
    return new Promise((resolve) => {
      let attempts = 0;
      const interval = setInterval(() => {
        const el = document.querySelector(selector) as HTMLElement;
        attempts++;
        if (el || attempts >= 30) { // Max 3 seconds safety window
          clearInterval(interval);
          resolve(el);
        }
      }, 100);
    });
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
    
    // Set Emotion first
    state.setEmotion(step.emotion || 'neutral');
    
    // Clear guide message first while moving/pointing
    state.setGuide(step.selector || null, null);
    
    // Wait for the element to load in DOM if a selector exists
    let targetEl: HTMLElement | null = null;
    if (step.selector) {
      targetEl = await this.waitForElement(step.selector);
      await this.waitForArrival();
    }
    
    // Now explain with rich text
    state.setGuide(step.selector || null, step.text);
    
    // Voice Speak
    voiceEngine.playSound('appear');

    // Handle Active Action (Executing it live) and Voice Speak in parallel
    let actionPromise = Promise.resolve();
    if (targetEl && step.action) {
      // Move ghost cursor
      const rect = targetEl.getBoundingClientRect();
      state.setAiCursor({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      
      if (step.action === 'click') {
        actionPromise = new Promise<void>((resolveAction) => {
          setTimeout(() => {
            try {
              if (targetEl) {
                targetEl.click();
                voiceEngine.playSound('click');
              }
            } catch (e) {
              console.warn("[ScenarioEngine] Element click failed:", e);
            }
            // Stabilize transition delay (allowing pages to complete rendering)
            setTimeout(resolveAction, 800);
          }, 800); // Wait for cursor arrival visually
        });
      }
    } else {
       state.setAiCursor(null);
    }

    // Wait for the voice engine speaking to complete AND the action to execute
    await Promise.all([
      voiceEngine.speak(step.text, { 
        emotion: (step.emotion as any),
        voice: state.activeBrandVoice
      }),
      actionPromise
    ]);

    // Move to next step after a comfortable delay (e.g. 1200ms) to let user absorb info
    this.currentTimeout = setTimeout(() => {
      this.executeStep(scenarioId, stepIndex + 1);
    }, 1200);
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
