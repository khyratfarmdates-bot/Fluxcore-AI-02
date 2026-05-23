/**
 * WhatsApp Bot Service for Fluxcore AI Platform
 * Handles command parsing, notification dispatch, and multi-gateway sending.
 */

export type WhatsAppGateway = 'twilio' | 'meta' | 'simulator';

export interface WhatsAppConfig {
  gateway: WhatsAppGateway;
  // Twilio fields
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioNumber?: string;   // e.g. whatsapp:+14155238886
  // Meta fields
  metaAccessToken?: string;
  metaPhoneId?: string;
  // Subscriber's WhatsApp number (with country code, no +)
  subscriberPhone?: string;
  // Notification toggles
  notifyOnVideoComplete?: boolean;
  notifyOnImageComplete?: boolean;
  notifyOnVoiceComplete?: boolean;
  notifyOnLowCredits?: boolean;
}

export interface BotMessage {
  from: 'user' | 'bot';
  text: string;
  timestamp: Date;
  type?: 'text' | 'status' | 'notification' | 'error';
}

// ─────────────────────────────────────────────────────────
//  Arabic bot command processor
// ─────────────────────────────────────────────────────────
export function processWhatsAppCommand(
  message: string,
  userContext: {
    displayName?: string;
    credits?: number | null;
    plan?: string | null;
    activeJobs?: number;
    latestAsset?: { type: string; createdAt: string } | null;
  }
): string {
  const trimmed = message.trim().toLowerCase();

  // !مساعدة / !help
  if (
    trimmed === '!مساعدة' ||
    trimmed === '!help' ||
    trimmed === 'مساعدة' ||
    trimmed === 'help'
  ) {
    return `🤖 *مرحباً في بوت فلاكس كور الذكي!*\n\nأنا هنا لأبقيك على اطلاع دائم بكل ما يحدث في منصتك. إليك الأوامر المتاحة:\n\n📊 *!رصيد* — عرض رصيد نقاطك وباقتك الحالية\n⚙️ *!حالة* — عدد المهام النشطة قيد المعالجة\n🎨 *!جديد* — آخر أصل تم توليده في حسابك\n📱 *!مساعدة* — عرض هذه القائمة\n\n💡 _يمكنك أيضاً الكتابة بالإنجليزية: !balance, !status, !latest, !help_`;
  }

  // !رصيد / !balance
  if (
    trimmed === '!رصيد' ||
    trimmed === '!balance' ||
    trimmed === 'رصيد' ||
    trimmed === 'balance'
  ) {
    const credits = userContext.credits ?? 0;
    const plan = userContext.plan ?? 'مجاني';
    const emoji = credits > 200 ? '🟢' : credits > 50 ? '🟡' : '🔴';
    return `💳 *رصيد حسابك في فلاكس كور*\n\n${emoji} النقاط المتبقية: *${credits.toLocaleString('ar-SA')} نقطة*\n📦 الباقة الحالية: *${plan}*\n\n${credits < 50 ? '⚠️ _رصيدك منخفض. يُنصح بترقية باقتك لضمان استمرار الإنتاج._' : '✅ _رصيدك كافٍ لمواصلة الإبداع!_'}`;
  }

  // !حالة / !status
  if (
    trimmed === '!حالة' ||
    trimmed === '!status' ||
    trimmed === 'حالة' ||
    trimmed === 'status'
  ) {
    const jobs = userContext.activeJobs ?? 0;
    if (jobs === 0) {
      return `⚙️ *حالة طابور التوليد*\n\n✅ لا توجد مهام نشطة حالياً.\n\nجميع عمليات التوليد اكتملت. يمكنك الاطلاع على نتائجك في تبويب *السجل* أو *الوسائط*.`;
    }
    return `⚙️ *حالة طابور التوليد*\n\n🔄 عدد المهام قيد المعالجة: *${jobs} مهمة*\n\n_سيتم إرسال إشعار فور اكتمال كل مهمة._`;
  }

  // !جديد / !latest
  if (
    trimmed === '!جديد' ||
    trimmed === '!latest' ||
    trimmed === 'جديد' ||
    trimmed === 'latest'
  ) {
    if (!userContext.latestAsset) {
      return `🎨 *آخر أصل مُولَّد*\n\n_لم يتم العثور على أي أصول مولدة بعد. ابدأ بتوليد صورة أو تعليق صوتي من مختبر الوسائط!_ 🚀`;
    }
    const typeMap: Record<string, string> = {
      voice: '🎙️ تعليق صوتي',
      image: '🖼️ صورة مُولَّدة',
      video: '🎬 فيديو',
      analysis: '🔍 تحليل صورة',
    };
    const typeLabel = typeMap[userContext.latestAsset.type] || '📄 أصل وسائطي';
    return `🎨 *آخر أصل مُولَّد في حسابك*\n\n${typeLabel}\n🕐 بتاريخ: ${userContext.latestAsset.createdAt}\n\n_توجه إلى تبويب السجل أو الوسائط لمشاهدة وتحميل كافة أصولك._`;
  }

  // Unknown command — friendly fallback
  return `🤖 عذراً، لم أتعرف على هذا الأمر.\n\nاكتب *!مساعدة* أو *!help* لعرض قائمة الأوامر المتاحة. 😊`;
}

// ─────────────────────────────────────────────────────────
//  Notification message builders
// ─────────────────────────────────────────────────────────
export function buildVoiceCompleteNotification(voiceName: string, dialect: string): string {
  return `🎙️✅ *اكتمل التعليق الصوتي بنجاح!*\n\nالمعلق: *${voiceName}*\nاللهجة: *${dialect}*\n\nتوجه إلى تبويب *السجل* في مختبر الوسائط لتحميل ملفك الصوتي.`;
}

export function buildImageCompleteNotification(prompt: string): string {
  const shortPrompt = prompt.length > 60 ? prompt.substring(0, 57) + '...' : prompt;
  return `🖼️✅ *اكتملت عملية توليد الصورة بنجاح!*\n\nالوصف: _${shortPrompt}_\n\nتوجه إلى تبويب *السجل* لمشاهدة وتنزيل صورتك الفورية.`;
}

export function buildLowCreditsNotification(remaining: number): string {
  return `⚠️🔴 *تحذير: رصيدك منخفض*\n\nلديك *${remaining} نقطة* متبقية فقط.\n\nيُنصح بترقية باقتك لضمان الاستمرار بدون انقطاع. اكتب *!رصيد* لمزيد من التفاصيل.`;
}

// ─────────────────────────────────────────────────────────
//  Twilio sender (called from server.ts)
// ─────────────────────────────────────────────────────────
export async function sendViaTwilio(
  body: string,
  config: { accountSid: string; authToken: string; from: string; to: string }
): Promise<void> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
  const params = new URLSearchParams();
  params.append('From', config.from.startsWith('whatsapp:') ? config.from : `whatsapp:${config.from}`);
  params.append('To', config.to.startsWith('whatsapp:') ? config.to : `whatsapp:${config.to}`);
  params.append('Body', body);

  const credentials = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(`Twilio Error ${response.status}: ${(errData as any).message || response.statusText}`);
  }
}

// ─────────────────────────────────────────────────────────
//  Meta Cloud API sender (called from server.ts)
// ─────────────────────────────────────────────────────────
export async function sendViaMeta(
  body: string,
  config: { accessToken: string; phoneId: string; to: string }
): Promise<void> {
  const url = `https://graph.facebook.com/v19.0/${config.phoneId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to: config.to.replace(/\+/g, ''),
    type: 'text',
    text: { preview_url: false, body },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(`Meta API Error ${response.status}: ${JSON.stringify(errData)}`);
  }
}
