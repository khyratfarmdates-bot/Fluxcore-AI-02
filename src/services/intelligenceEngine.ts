import { db, auth } from '../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { UserEvent } from './behaviorTracking';

export interface Suggestion {
  id: string;
  type: 'quick_action' | 'learning' | 'optimization';
  title: string;
  action: () => void;
  priority: number;
}

class IntelligenceEngine {
  
  async getContextualSuggestions(pagePath: string, navigateTo: (module: string) => void): Promise<Suggestion[]> {
    if (!auth.currentUser) return [];

    // 1. استرجاع آخر 50 حدث لتحليل أكثر دقة
    const eventsCol = collection(db, 'user_behavior_logs');
    const q = query(
      eventsCol,
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const recentEvents = snapshot.docs.map(d => d.data() as UserEvent);

    const suggestions: Suggestion[] = [];

    // 2. تحليل الأنماط السلوكية
    const isNewUser = recentEvents.length < 10;
    const lastEvent = recentEvents[0];

    // نمط 1: مستخدم جديد في لوحة التحكم - اقتراح جولة تعليمية
    if (isNewUser && pagePath === 'dashboard') {
      suggestions.push({
        id: 'welcome_tour',
        type: 'learning',
        title: 'ابدأ جولة تعريفية في Fluxcore',
        action: () => navigateTo('onboarding'),
        priority: 10
      });
    }

    // نمط 2: تكرار التنقل بين صفحات معينة (قد يدل على حيرة)
    const recentNavs = recentEvents.filter(e => e.type === 'navigation');
    if (recentNavs.length > 3) {
      const lastTwo = recentNavs.slice(0, 2);
      if (lastTwo[0].elementId === lastTwo[1].elementId) {
        suggestions.push({
          id: 'need_help',
          type: 'learning',
          title: 'هل تحتاج مساعدة في هذه الأداة؟',
          action: () => navigateTo('support'),
          priority: 5
        });
      }
    }

    // نمط 4: التواجد في Campaign OS بدون حملات نشطة
    if (pagePath === 'campaigns' && recentEvents.length > 5 && recentEvents.every(e => e.type !== 'tool_usage' || e.elementId !== 'create_campaign')) {
      suggestions.push({
        id: 'suggest_campaign_creation',
        type: 'quick_action',
        title: 'ابدأ حملتك الأولى الآن',
        action: () => navigateTo('campaigns'), // في التطبيق الفعلي، سنحتاج لآلية لفتح نافذة الإنشاء مباشرة
        priority: 9
      });
    }

    return suggestions.sort((a, b) => b.priority - a.priority);
  }
}

export const intelligenceEngine = new IntelligenceEngine();
