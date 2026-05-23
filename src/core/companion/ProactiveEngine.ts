import { useCompanionStore } from './CompanionState';

class ProactiveEngine {
  private static instance: ProactiveEngine;
  private clickHistory: { time: number; x: number; y: number }[] = [];
  private navHistory: { time: number; path: string }[] = [];
  
  private constructor() {
    this.setupListeners();
  }

  private hasSetupListeners = false;

  public static getInstance(): ProactiveEngine {
    if (!ProactiveEngine.instance) {
      ProactiveEngine.instance = new ProactiveEngine();
    }
    return ProactiveEngine.instance;
  }

  private setupListeners() {
    if (typeof window === 'undefined' || typeof window.history === 'undefined' || this.hasSetupListeners) return;
    this.hasSetupListeners = true;

    window.addEventListener('click', this.handleGlobalClick.bind(this));
    
    // We can monkeypatch history pushState / replaceState to detect erratic navigation
    const originalPushState = window.history.pushState;
    window.history.pushState = function (...args) {
      originalPushState.apply(window.history, args);
      const url = args[2] ? args[2].toString() : '';
      ProactiveEngine.getInstance().handleNavigation(url);
    };

    const originalReplaceState = window.history.replaceState;
    window.history.replaceState = function (...args) {
      originalReplaceState.apply(window.history, args);
      const url = args[2] ? args[2].toString() : '';
      ProactiveEngine.getInstance().handleNavigation(url);
    };

    window.addEventListener('popstate', () => {
      ProactiveEngine.getInstance().handleNavigation(window.location.pathname);
    });
  }

  private handleGlobalClick(e: MouseEvent) {
    const now = Date.now();
    this.clickHistory.push({ time: now, x: e.clientX, y: e.clientY });

    // Clean up old clicks (> 2 seconds)
    this.clickHistory = this.clickHistory.filter(c => now - c.time < 2000);

    // Detect rage clicks (4 clicks in 2 seconds in ~50px radius)
    if (this.clickHistory.length >= 4) {
      const first = this.clickHistory[0];
      const allClose = this.clickHistory.every(
        c => Math.hypot(c.x - first.x, c.y - first.y) < 50
      );

      if (allClose) {
        this.triggerIntervention(
          "يبدو أنك تواجه مشكلة هنا. هل تريدني أن أقوم بتنفيذ هذه الخطوة نيابة عنك لحلها؟",
          "rage_click"
        );
        this.clickHistory = []; // Reset
      }
    }
  }

  private handleNavigation(path: string) {
    const now = Date.now();
    this.navHistory.push({ time: now, path });

    // Clean up old navs (> 8 seconds)
    this.navHistory = this.navHistory.filter(n => now - n.time < 8000);

    // Detect erratic navigation (4 path changes in 8 seconds)
    if (this.navHistory.length >= 4) {
      // Ensure they are actually different paths
      const uniquePaths = new Set(this.navHistory.map(n => n.path));
      if (uniquePaths.size >= 3) {
         this.triggerIntervention(
           "ألاحظ أنك تتنقل بين الصفحات بسرعة. هل تبحث عن ميزة أو إعداد معين لأساعدك في الوصول إليه؟",
           "erratic_nav"
         );
         this.navHistory = []; // Reset
      }
    }
  }

  private triggerIntervention(message: string, reason: string) {
    const state = useCompanionStore.getState();
    if (state.isGuiding || state.isDemonstrating) return; // Don't interrupt demos

    // Check cooldown
    if (Date.now() < state.proactiveCooldownUntil) return;

    state.triggerAmbientSuggestion(message, 10000);
    // Emotion update is handled inside triggerAmbientSuggestion.
    useCompanionStore.setState({ emotion: 'thinking' });

    console.log(`[ProactiveEngine] Intervening due to ${reason}`);
  }
}

export const proactiveEngine = ProactiveEngine.getInstance();
