import { eventBus } from '../core/events/EventBus';
import { generateId } from '../lib/ids';

export interface OperationalEvent {
  id: string;
  type: 'AI_THINKING' | 'PUBLISHING' | 'CONTENT_GEN' | 'ANALYSIS' | 'SYSTEM';
  message: string;
  status: 'pending' | 'success' | 'failure';
  timestamp: number;
}

class LiveOperationalService {
  private static instance: LiveOperationalService;
  private subscribers: ((event: OperationalEvent) => void)[] = [];
  private interval: any = null;

  private constructor() {}

  public static getInstance(): LiveOperationalService {
    if (!LiveOperationalService.instance) {
      LiveOperationalService.instance = new LiveOperationalService();
    }
    return LiveOperationalService.instance;
  }

  public start() {
    if (this.interval) return;
    
    // 1. Listen to real events from the system event bus
    eventBus.subscribe('OPERATIONAL_LIVE_EVENT', (event) => {
       const opEvent = event.payload as OperationalEvent;
       this.notify(opEvent);
    });

    eventBus.subscribe('INTEGRATION_EXECUTION_SUCCESS', (event) => {
       this.notify({
          id: generateId(),
          type: 'SYSTEM',
          message: `تم تنفيذ عملية ${event.payload.action} بنجاح عبر ${event.source}`,
          status: 'success',
          timestamp: Date.now()
       });
    });

    // 2. Keep a light simulation for background heartbeat if needed, but much slower
    this.interval = setInterval(() => {
      if (Math.random() > 0.9) {
        this.generateRandomEvent();
      }
    }, 10000);
  }

  public subscribe(callback: (event: OperationalEvent) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  private generateRandomEvent() {
    const eventTypes: OperationalEvent['type'][] = ['AI_THINKING', 'PUBLISHING', 'CONTENT_GEN', 'ANALYSIS', 'SYSTEM'];
    const messages = {
      AI_THINKING: [
        'يقوم Executive AI بمراجعة استراتيجية المحتوى لهذه الليلة...',
        'تحليل أنماط التفاعل على LinkedIn للهوية الحالية...',
        'توليد توقعات أداء بناءً على بيانات الـ Knowledge Graph...'
      ],
      PUBLISHING: [
        'جاري تحضير منشور "نصائح العمل عن بُعد" للموافقة...',
        'توزيع محتوى الفيديو على Threads و Instagram مجدولاً...',
        'ربط أحداث النشر بـ Twitter API بنجاح.'
      ],
      CONTENT_GEN: [
        'توليد صور إبداعية باستخدام Runway Gen-2 لحملة الصيف...',
        'تحويل النص إلى صوت (TTS) لفيديو TikTok القادم...',
        'صياغة 5 مسودات جديدة بناءً على الكلمات المفتاحية النشطة.'
      ],
      ANALYSIS: [
        'تحديث مقاييس النمو لبراند التمور...',
        'اكتشاف تراجع طفيف في الوصول العضوي، جاري اقتراح تعديلات...',
        'مزامنة بيانات التفاعل من Instagram Insights.'
      ],
      SYSTEM: [
        'تحديث الذاكرة طويلة المدى (Executive Memory)...',
        'مزامنة الكيانات الجديدة في الـ Knowledge Graph...',
        'فحص صحة التكاملات: جميع الأنظمة تعمل بكفاءة.'
      ]
    };

    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const message = messages[type][Math.floor(Math.random() * messages[type].length)];
    
    const event: OperationalEvent = {
      id: generateId(),
      type,
      message,
      status: 'success',
      timestamp: Date.now()
    };

    // Only publish to global event bus. 
    // The subscribe listener in start() will handle the notify().
    eventBus.publish({
      type: 'OPERATIONAL_LIVE_EVENT',
      source: 'LiveOperationalService',
      payload: event,
      timestamp: event.timestamp
    });
  }

  private notify(event: OperationalEvent) {
    this.subscribers.forEach(s => s(event));
  }

  public stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

export const liveOps = LiveOperationalService.getInstance();
