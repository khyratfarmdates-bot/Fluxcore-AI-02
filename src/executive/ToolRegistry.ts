import { ToolDefinition } from "./types";
import { AICore } from "../core/AICore";
import { db, auth } from "../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { publishingService } from "../services/publishing";
import { brandService } from "../services/brand";
import { notificationService } from "../services/notification";
import { automationService } from "../services/automation";
import { analyticsService } from "../services/analytics";
import { agentOrchestrator } from "../intelligence/agents/ExecutiveAgentOrchestrator";
import { MarketingIntelligence } from "../services/MarketingIntelligence";
import { ActivityStream } from "../persistence/ActivityStream";
import { eventBus } from "../core/events/EventBus";
import { IntegrationEngine } from "../integrations/CoreEngine";

export const ToolRegistry: ToolDefinition[] = [
  {
    name: "analyze_website",
    description: "تحليل شامل لموقع إلكتروني أو متجر عبر الرابط لاستخراج بيانات الـ SEO والأداء.",
    parameters: {
      url: "string",
      brandId: "string"
    },
    execute: async (args) => {
      await ActivityStream.log('website_analyzed', 'MarketingEngine', args, args.brandId);
      return await MarketingIntelligence.analyzeWebsite(args.url, args.brandId);
    }
  },
  {
    name: "optimize_seo",
    description: "تحسين محركات البحث لموقع معين وتقديم نصائح وكلمات مفتاحية استراتيجية.",
    parameters: {
      url: "string",
      brandId: "string",
      focusArea: "string" // 'content' | 'technical' | 'keywords'
    },
    execute: async (args) => {
      await ActivityStream.log('seo_optimized', 'MarketingEngine', args, args.brandId);
      return await MarketingIntelligence.optimizeSEO(args.url, args.brandId, args.focusArea || 'content');
    }
  },
  {
    name: "delegate_to_agent",
    description: "تفويض مهمة معينة إلى وكيل ذكاء متخصص.",
    parameters: {
      objective: "string",
      brandId: "string",
      context: "any"
    },
    execute: async (args) => {
      await ActivityStream.log('agent_delegated', 'ExecutiveEngine', args, args.brandId);
      return await agentOrchestrator.delegate(args.brandId, args.objective, args.context || {});
    }
  },
  {
    name: "generate_content_draft",
    description: "توليد مسودة محتوى (نص، سيناريو، أو فكرة) بناءً على الهدف والمنصة.",
    parameters: {
      goal: "string",
      brandId: "string",
      platform: "string",
      contentType: "string",
      tone: "string"
    },
    execute: async (args) => {
      await ActivityStream.log('content_generated', 'ContentEngine', args, args.brandId);
      return await AICore.generateContent({
        workspaceId: "default",
        goal: args.goal,
        templateId: "social_post",
        params: {
          platform: args.platform,
          tone: args.tone || "Friendly",
          contentType: args.contentType
        }
      });
    }
  },
  {
    name: "get_brand_context",
    description: "استرجاع معلومات الهوية البصرية وصوت العلامة التجارية.",
    parameters: {
      brandId: "string"
    },
    execute: async (args) => {
      if (!auth.currentUser) return null;
      const q = query(
        collection(db, "brands"), 
        where("id", "==", args.brandId),
        where("userId", "==", auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => d.data())[0] || null;
    }
  },
  {
    name: "check_publishing_calendar",
    description: "مراجعة جدول النشر القادم للتأكد من عدم وجود تضارب.",
    parameters: {
      brandId: "string"
    },
    execute: async (args) => {
      const tasks = await publishingService.getByField('brandId', args.brandId);
      return tasks.filter(t => t.status === 'scheduled' || t.status === 'queued').map(t => ({
        id: t.id,
        content: t.content.substring(0, 50),
        scheduledAt: t.scheduledTime ? (t.scheduledTime.toDate ? t.scheduledTime.toDate() : t.scheduledTime) : null
      }));
    }
  },
  {
    name: "analyze_performance",
    description: "تحليل أداء الوصول والتفاعل لآخر حملة أو منشورات.",
    parameters: {
      type: "string",
      brandId: "string"
    },
    execute: async (args) => {
      const stats = await analyticsService.getPerformanceMetrics(args.brandId);
      return {
        reach: stats.totalReach,
        engagement: stats.engagementRate / 100,
        trend: "up",
        bestPlatform: stats.topPlatform,
        recommendation: `الأداء على ${stats.topPlatform} متميز. استمر في نشر محتوى مشابه.`
      };
    }
  },
  {
    name: "schedule_publishing_task",
    description: "جدولة محتوى للنشر في وقت محدد على منصة معينة.",
    parameters: {
      brandId: "string",
      platform: "string",
      content: "string",
      scheduledTime: "string"
    },
    execute: async (args) => {
      await ActivityStream.log('post_scheduled', 'PublishingEngine', args, args.brandId);
      return await publishingService.schedulePost(
        args.brandId,
        args.content,
        args.platform,
        args.scheduledTime ? new Date(args.scheduledTime) : undefined
      );
    }
  },
  {
    name: "trigger_automation",
    description: "تشغيل سير عمل مؤتمت (Workflow) بناءً على اسم الأتمتة.",
    parameters: {
      brandId: "string",
      automationId: "string",
      triggerData: "object"
    },
    execute: async (args) => {
      const workflow = await automationService.getById(args.automationId);
      if (workflow) {
        const { workflowEngine } = await import("../services/WorkflowExecutionEngine");
        workflowEngine.execute(workflow, args.triggerData || {});
        await ActivityStream.log('workflow_triggered_manually', 'WorkflowEngine', args, args.brandId);
        return { status: "triggered", title: workflow.title };
      }
      return { status: "not_found", error: "Workflow not found" };
    }
  },
  {
    name: "notify_team",
    description: "إرسال تنبيه فوري لأعضاء الفريق حول موضوع معين.",
    parameters: {
      userId: "string",
      title: "string",
      message: "string"
    },
    execute: async (args) => {
      return await notificationService.createNotification(args.userId, args.title, args.message);
    }
  },
  {
    name: "navigate_to",
    description: "تغيير الواجهة الحالية إلى صفحة معينة (dashboard, studio, analytics, automation, integrations).",
    parameters: {
      page: "string"
    },
    execute: async (args) => {
      eventBus.publish({ 
        type: 'NAVIGATE', 
        payload: args.page,
        timestamp: Date.now(),
        source: 'ToolRegistry'
      });
      return { status: "navigated", destination: args.page };
    }
  },
  {
    name: "set_automation_status",
    description: "تعديل حالة أتمتة معينة (تفعيل أو إيقاف).",
    parameters: {
      automationId: "string",
      active: "boolean"
    },
    execute: async (args) => {
      await automationService.update(args.automationId, { active: args.active });
      return { status: "updated", id: args.automationId, active: args.active };
    }
  },
  {
    name: "generate_brand_report",
    description: "إنشاء تقرير استراتيجي شامل عن حالة العلامة التجارية بناءً على البيانات المتوفرة.",
    parameters: {
      brandId: "string",
      focus: "string" // 'performance' | 'content' | 'automation'
    },
    execute: async (args) => {
      const stats = await analyticsService.getPerformanceMetrics(args.brandId);
      const integrations = await IntegrationEngine.getActiveIntegrations(args.brandId);
      return {
        summary: `التقرير الاستراتيجي لـ ${args.focus}. التفاعل الإجمالي: ${stats.engagementRate}%.`,
        metrics: stats,
        platforms: integrations.map(i => i.provider),
        recommendations: [
          "تحسين وتيرة النشر في أوقات الذروة",
          "استخدام بصمة صوتية أكثر عاطفية في المحتوى القادم"
        ]
      };
    }
  },
  {
    name: "optimize_social_narrative",
    description: "تحسين السرد القصصي للعلامة التجارية لزيادة التحويل.",
    parameters: {
      brandId: "string",
      currentNarrative: "string"
    },
    execute: async (args) => {
      return await AICore.generateContent({
        workspaceId: "default",
        goal: "Storytelling Optimization",
        templateId: "custom",
        params: { rawPrompt: `Optimize this narrative to be more executive and compelling for the brand: ${args.currentNarrative}` }
      });
    }
  },
  {
    name: "youtube_growth_strategy",
    description: "توليد إستراتيجية نمو متكاملة لقناة اليوتيوب تشمل تحسين الـ SEO، تحليل الاحتفاظ بالمشاهدين، والكلمات المفتاحية.",
    parameters: {
      brandId: "string",
      objective: "string" // e.g. "زيادة المشتركين" or "تحسين الـ SEO للفيديو الأخير"
    },
    execute: async (args) => {
      await ActivityStream.log('youtube_strategy_requested', 'YouTubeGrowthSpecialist', args, args.brandId);
      return await agentOrchestrator.delegate(args.brandId, `تحليل إستراتيجية يوتيوب لـ: ${args.objective}`, args);
    }
  }
];
