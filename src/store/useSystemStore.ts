import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SystemState {
  // Feature Flags
  flags: {
    experimentalLabs: boolean;
    aiResourceOptimization: boolean;
    advancedAnalytics: boolean;
    realtimeQueue: boolean;
  };
  
  // Intelligence Metrics
  metrics: {
    aiResponseTime: number[];
    queueDepth: number;
    hourlyThroughput: number;
    errorRate: number;
  };
  
  // AI Costs (Mock tracking for production hardening)
  costs: {
    dailyTotal: number;
    monthlyTotal: number;
    byProvider: Record<string, number>;
  };

  // Actions
  toggleFlag: (flag: keyof SystemState['flags']) => void;
  updateMetrics: (newMetrics: Partial<SystemState['metrics']>) => void;
  addCost: (provider: string, amount: number) => void;
}

export const useSystemStore = create<SystemState>()(
  persist(
    (set) => ({
      flags: {
        experimentalLabs: false,
        aiResourceOptimization: true,
        advancedAnalytics: true,
        realtimeQueue: true,
      },
      metrics: {
        aiResponseTime: [],
        queueDepth: 0,
        hourlyThroughput: 0,
        errorRate: 0,
      },
      costs: {
        dailyTotal: 0,
        monthlyTotal: 0,
        byProvider: { 'Gemini': 0, 'OpenAI': 0 },
      },
      
      toggleFlag: (flag) => set((state) => ({
        flags: { ...state.flags, [flag]: !state.flags[flag] }
      })),
      
      updateMetrics: (newMetrics) => set((state) => ({
        metrics: { ...state.metrics, ...newMetrics }
      })),
      
      addCost: (provider, amount) => set((state) => ({
        costs: {
          ...state.costs,
          dailyTotal: state.costs.dailyTotal + amount,
          monthlyTotal: state.costs.monthlyTotal + amount,
          byProvider: {
            ...state.costs.byProvider,
            [provider]: (state.costs.byProvider[provider] || 0) + amount
          }
        }
      })),
    }),
    { name: 'fluxcore-system-store' }
  )
);
