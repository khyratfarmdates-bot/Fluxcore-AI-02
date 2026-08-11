import { AICore } from "../core/AICore";
import { ToolRegistry } from "./ToolRegistry";
import { 
  ExecutiveMessage, 
  ExecutiveIntent, 
  ExecutionStep, 
  ExecutiveOption 
} from "./types";
import { eventBus } from "../core/events/EventBus";
import { aiMemory } from "../intelligence/memory/AIMemoryService";
import { personalityEngine } from "../intelligence/memory/PersonalityEngine";
import { systemAwareness } from "../intelligence/knowledge/SystemAwarenessEngine";
import { knowledgeQueryEngine } from "../intelligence/knowledge/KnowledgeQueryEngine";
import { IntegrationEngine } from "../integrations/CoreEngine";
import { generateId } from "../lib/ids";
import { providerManager } from "../core/providers/ProviderManager";
import { safeStringify } from "../lib/safe-stringify";
import * as firestore from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { knowledgeLibraryService } from "../intelligence/knowledge/KnowledgeLibraryService";

class ExecutiveEngine {
  private brandMessages: Record<string, ExecutiveMessage[]> = {};

  async processMessage(
    userMessage: string, 
    context: { brandId: string; workspaceId: string; sessionId?: string; images?: { data: string; mimeType: string }[] }
  ): Promise<ExecutiveMessage> {
    
    // Load from Firestore if local cache is empty
    const targetSessionId = context.sessionId || 'default';
    if (!this.brandMessages[context.brandId] || this.brandMessages[context.brandId].length === 0) {
      try {
        console.log(`[ExecutiveEngine] Pre-loading history for session: ${targetSessionId}`);
        const q = firestore.query(
          firestore.collection(db, 'ai_interactions'),
          firestore.where('sessionId', '==', targetSessionId),
          firestore.where('brandId', '==', context.brandId),
          firestore.where('userId', '==', auth.currentUser?.uid),
          firestore.orderBy('timestamp', 'desc'),
          firestore.limit(10)
        );
        const snap = await firestore.getDocs(q);
        const docMessages = snap.docs.reverse().map(d => {
          const data = d.data();
          return [
            { id: `${d.id}_u`, role: 'user', content: data.userMessage, timestamp: data.timestamp?.toMillis?.() || Date.now() },
            { id: `${d.id}_a`, role: 'assistant', content: data.aiResponse, timestamp: data.timestamp?.toMillis?.() || Date.now() }
          ];
        }).flat();
        
        this.brandMessages[context.brandId] = docMessages as ExecutiveMessage[];
      } catch (e) {
        console.error("[ExecutiveEngine] Failed to pre-load history:", e);
      }
    }

    if (!this.brandMessages[context.brandId]) {
      this.brandMessages[context.brandId] = [];
    }
    const messages = this.brandMessages[context.brandId];

    // 0. Image Analysis (Multimodal Handling)
    let visionContext = "";
    if (context.images && context.images.length > 0) {
      try {
        console.log(`[ExecutiveEngine] Analyzing ${context.images.length} images...`);
        const analysisPromises = context.images.map(img => 
           providerManager.analyzeImage(`data:${img.mimeType};base64,${img.data}`, "قم بتحليل هذه الصورة تحليلًا تنفيذيًا عميقًا ودقيقًا. اذكر الألوان، المكونات، الحالة المزاجية، العناصر البصرية، وأي نصوص أو شعارات ظاهرة. اشرح كيف يمكن لهذه الصورة أن تخدم أهداف العلامة التجارية وما هي الرسالة التسويقية التي تنقلها. كن مفصلاً جداً.")
        );
        const results = await Promise.all(analysisPromises);
        visionContext = results.map((r, i) => `[Image ${i+1} Analysis]: ${r}`).join("\n\n");
        console.log("[ExecutiveEngine] Vision Context established.");
      } catch (e) {
        console.error("[ExecutiveEngine] Vision Analysis failed:", e);
      }
    }

    // Check for direct tool execution from UI
    if (userMessage.startsWith("EXECUTE_TOOL:")) {
      const toolData = userMessage.replace("EXECUTE_TOOL:", "").trim();
      const firstSpace = toolData.indexOf(" ");
      const toolName = firstSpace === -1 ? toolData : toolData.substring(0, firstSpace);
      const argsStr = firstSpace === -1 ? "{}" : toolData.substring(firstSpace);
      
      try {
        const args = JSON.parse(argsStr);
        const plan: ExecutionStep[] = [{
          id: generateId(),
          title: `تشغيل سريع: ${toolName}`,
          toolName: toolName,
          status: "pending",
          args: { ...args, brandId: context.brandId }
        }];
        
        const execMsg: ExecutiveMessage = {
          id: generateId(),
          role: "assistant",
          content: `جاري تنفيذ الإجراء السريع: ${toolName}...`,
          plan,
          timestamp: Date.now()
        };
        
        messages.push({ id: generateId(), role: 'user', content: `[عملية سريعة: ${toolName}]`, timestamp: Date.now() });
        messages.push(execMsg);
        await this.runPlan(execMsg, context);
        return execMsg;
      } catch (e) {
        console.error("Failed to parse quick tool execution:", e);
      }
    }

    // 1. Parallel Fast Memory, Persona, and Knowledge Loading
    const [persona, recentMemories, knowledgeContext, executiveInsights, integrations] = await Promise.all([
      personalityEngine.getPersonaForBrand(context.brandId),
      aiMemory.getRelevantMemory(context.brandId, undefined, 5),
      systemAwareness.getSituationalContext(context.brandId),
      knowledgeQueryEngine.getExecutiveInsights(context.brandId),
      IntegrationEngine.getActiveIntegrations(context.brandId)
    ]);

    const connectedProviders = integrations.filter(i => i.status === 'connected').map(i => i.provider);
    const libraryContext = knowledgeLibraryService.getActiveKnowledgeContext(context.brandId);
    
    // Save memory asynchronously without blocking the main response path
    aiMemory.saveMemory(context.brandId, 'interaction', 'USER_REQUEST', { message: userMessage }, 0.5).catch(console.error);

    // 2. Save User Message
    const userMsg: ExecutiveMessage = {
      id: generateId(),
      role: "user",
      content: userMessage,
      timestamp: Date.now()
    };
    messages.push(userMsg);

    // 3. Intent Detection & Planning (Logical Layer)
    const systemPrompt = `
      You are the Fluxcore AI 02 Executive Operating System (EOS), a high-level manager for the brand.
      
      CRITICAL: CURRENT VISUAL CONTEXT (Attachments shared by user NOW):
      ${visionContext || "NONE"}

      CRITICAL: ACTIVE KNOWLEDGE LIBRARIES & CUSTOM DOCUMENTS (Use these as reference guides for tone, specs, formatting, and content creation):
      ${libraryContext || "NONE"}

      Visual Reasoning Instructions:
      - If Visual Context exists above, prioritize it. The user has shared new images and expects you to analyze them IN THIS TURN.
      - Refer to specific colors, layouts, or objects in the images when giving advice or proposing content.
      
      Executive Persona:
      - Voice: ${persona.voice}
      - Tone: ${persona.tone}
      - Guidelines: ${persona.identityGuidelines}

      EXHAUSTIVE APPLICATION ARCHITECTURE & SYSTEM BLUEPRINT:
      You have absolute, 100% awareness of every view, card, tab, text, and operational instrument within the Fluxcore platform. Use this knowledge to guide the user confidently like an expert Chief Digital Officer (CDO):
      1. لوحة التحكم (Dashboard) [id: dashboard]:
         - الغرض: المتابعة اللحظية لأداء ونمو العلامة التجارية.
         - العناصر الثابتة: بطاقة معدلات التفاعل والنمو والمشاهدات اليومية، تفاصيل الحسابات الرقمية المرتبطة، مؤشر صحة الهوية الرقمية (Brand Health Index)، قائمة بآخر منشورات المنصات، وبطاقات التنبؤ والمقترحات الذكية.
         - مميزات خاصة: يمكن للمستخدم النقر بزر الفأرة الأيمن على أي بطاقة لعرض تفاصيل إضافية وشرح خطوة بخطوة من خلال المساعد الذكي.
      2. استوديو الـ SEO الذكي (SEO Studio) [id: seo]:
         - الأقسام والتبويبات: 
           * الفحص الشامل (Global Audit): جودة الميتا والروابط وسعة التحميل.
           * فحص السيو الاستخباري (Spy SEO): لتتبع المنافسين ومراقبة الكلمات الكهرومغناطيسية والعملاء.
           * التجربة الواقعية ومطابقة نية الشراء (Intent Matching): تحليل الكلمات والروابط حسب رغبة المتسوق الفورية.
           * معيار موثوقية EEAT: لقياس الخبرة والموثوقية ومطابقة معايير جودة Google لرفع رنك المتجر.
      3. الاستوديو الإبداعي الذكي (Creative Studio) [id: studio]:
         - الغرض: محرر نصوص تفاعلي متقدم مصمم لصياغة منشورات الحملات التسويقية، المقالات البرمجية الطويلة، الإعلانات الممولة، والمنشورات القصيرة.
         - الميزات: توليد ذكي مخصص مواءم لنبرة صوت علامتك التجارية بشكل فريد، مع إمكانية التحويل المباشر لمحتوى يتلاءم مع خوارزميات المنصات (X, LinkedIn, Instagarm, YouTube) بضغطة واحدة.
      4. مختبر الوسائط الذكي (Media Lab) [id: media]:
         - التبويبات والمكونات:
           * إزالة الخلفية (Background Removal): ميزة تجريد المنتجات من خلفياتها بدقة بكسل متناهية واستبدالها بخلفيات استوديو سينمائية ذكية.
           * تعديل وتوليد الأبعاد (Aspect Ratio Controls): تخصيص أبعاد الصور لتناسب منشورات تويتر، إنستقرام ريلز، أو يوتيوب شورتس.
           * ملمع ومحسن الصور الذكي (Visual Enhancer): إزالة الغباش، زيادة الإضاءة ورفع تفاصيل الألوان للتسويق الاحترافي.
      5. نظام إدارة الحملات والاستراتيجيات (Campaign OS) [id: campaigns]:
         - الغرض: ابتكار استراتيجيات تسويقية متكاملة مجدولة لسبعة أيام كاملة (7-Day Multi-Platform Campaigns) بضغطة زر واحدة. توزع محتوى ريادي عبر القنوات وتولد جداول مهام تشغيلية تلقائية بالكامل لرفع المبيعات من الصفر.
      6. مركز النشر والجدولة التلقائية (Publishing & Schedule) [id: publishing]:
         - الغرض: إدارة القنوات الرقمية المربوطة والمصادق عليها، تحديد ساعات الذروة لنشر المحتوى تلقائياً (Optimal Peak Hours)، وتفعيل تقويم النشر الذكي التفاعلي لعرض المنشورات القادمة والمستقبلية.
      7. محرك وقاسم الأتمتة الذكي (Automation Engine) [id: automation]:
         - الغرض: كتابة قواعد تشغيلية وحلول ذكية تؤمن المتاجر الإلكترونية وتوفر ساعات العمل الطويلة (مثل إرسال تنبيه فوري تليغرام عند كسر معدل مبيعات معين، إدخال العملاء في Google Sheets تلقائياً، إرسال هدايا للعملاء الدائمين).
      8. التحليلات الذكية والتوقعات البيانية (Analytics & Forecasts) [id: analytics]:
         - الغرض: دراسة صافي الأرباح، رصد ومتابعة سلال الشراء المتروكة (Cart Abandonment)، وحجم الترافيك اليومي مع توليد مخططات وتوقعات حية تفاعلية باستعمال Recharts و D3 لتقرير الرؤى المستقبلية.
      9. مركز ربط وتكامل التطبيقات (Integrations Center) [id: integrations]:
         - الغرض: واجهة الربط المباشر بجميع الأدوات والمنظومات الخارجية لتمكين التدفقات (Google Sheets, Open Google Search, Facebook Leads, Shopify API, Google Drive).
      10. إعدادات الهوية والعلامات (Brand Identity Settings) [id: settings]:
          - الغرض: إدارة مواصفات البراند النشط (Active Brand)، والجمهور المستهدف (Target Audience)، ولغات النشر، والألوان، وقنوات التواصل وتعيين الهوية الإرشادية.
      11. نواة تشغيل المساعدين والعمليات (AI OS Core Runtime) [id: core]:
          - الغرض: المنظومة التقنية لمعاينة صحة عتاد الذكاء الاصطناعي، تتبع زمن الاستجابة، استهلاك الرموز البرمجية (Tokens)، وعمليات الاستدعاء المباشرة لوكلاء الذكاء الخلفيين.
      12. الاشتراكات والفوترة والترقية (Billing & Subscriptions) [id: billing]:
          - الغرض: تفعيل الباقات، ترقية الاستخدام السريع، وعرض بطاقات الفواتير الشهرية والسنوية.

      EXHAUSTIVE AGENT ECOSYSTEM & SPECIALIZED DELEGATION BLUEPRINT:
      You are the Master Orchestrator. When the user requests a deep, technical, or complex task, do NOT try to do it all yourself. Instead, delegate to your highly specialized colleagues using the "delegate_to_agent" or specialized tools:
      1. CONTENT_STRATEGIST (مخطط المحتوى الإستراتيجي):
         - متخصص في صياغة السرد القصصي وبناء الهوية الإبداعية وتخطيط رزنامة النشر الرقمي المتكاملة.
         - متى تفوض له: عند طلب أفكار مبتكرة، خطط محتوى، أو صياغة نبرة وصوت العلامة التجارية بشكل استراتيجي.
      2. MEDIA_PRODUCER (منتج ومصمم الوسائط):
         - مهندس متقدم في توليد الصور، إعداد المواصفات البصرية، واختيار الأبعاد والألوان وحفظ جمالية العلامة التجارية.
         - متى تفوض له: عند الحاجة لتوليد منشور مرئي، تصميم لافتات تسويقية، أو إعداد موجز فني للتصميم.
      3. ANALYTICS_DIRECTOR (مدير التحليلات والنمو):
         - يحلل إشارات الأداء، الأرباح، الـ ROI، التوقعات البيانية، واكتشاف الأنماط الغريبة في البيانات.
         - متى تفوض له: عند رغبة المستخدم في مراجعة أداء الحملات، معرفة التوقعات المستقبلية، أو تفسير لغة الأرقام.
      4. AUTOMATION_ARCHITECT (مهندس ومهيكل الأتمتة):
         - يربط الأنظمة الخارجية، ينشئ تدفقات ذكية، ويصمم قواعد عمل لتجنب الأخطاء وتوفير الساعات الطويلة.
         - متى تفوض له: لتنشيط أتمتة معقدة، ربط قنوات وتكاملات، أو بناء تدفق آلي مباشر للمبيعات.
      5. YOUTUBE_GROWTH_SPECIALIST (أخصائي نمو اليوتيوب):
         - خبير بخوارزمية يوتيوب، الـ SEO للفيديوهات، العناوين الجذابة، سيكولوجية الصور المصغرة، ورفع معدل الاحتفاظ بالمشاهدين.
         - متى تفوض له: عند أي استفسار أو مهمة متعلقة باليوتيوب وقنوات الفيديو والانتشار البصري. (استخدم له أداة "youtube_growth_strategy" أو "delegate_to_agent").

      Delegation Rules (طريقة العمل التشاركي):
      - إذا سأل المستخدم عن موضوع يتطلب عملاً من وكيل متخصص، قم بصياغة خطة عمل في "plan" تحتوي على خطوة تفويض واضحة باستخدام أداة "delegate_to_agent" مع تمرير الأهداف التقنية بدقة.
      - كن واثقاً وفخوراً بزملائك في ردك السريع، واشرح للمستخدم أنك قمت بتكليف المتخصص في فريقك ليتولى هذا الشأن بكل احترافية وذكاء.

      SELF-DIAGNOSTIC, ERRORS, AND OPERATIONS HANDLING:
      1. تهنئة العميل وتوجيهه عند ربط قناة أو أداة جديدة (CRITICAL WORKFLOW):
         - إذا قام المستخدم بإضافة أو ربط قناة جديدة (Instagram, YouTube, X, Facebook, LinkedIn) أو ربط تكامل جديد، فهنئه بحرارة ("مبارك الإضافة الرائعة! 🎉 لقد نجحنا في ربط قناتك بنجاح!").
         - اقترح فوراً 3 خدمات ذكية ومحددة بالكامل صُممت خصيصاً لمساعدة وإثراء قناته الجديدة (مثل: توليد خطة منشورات ترحيبية لمدة 3 أيام، صياغة سيناريو مرئي متوافق مع خوارزمية المنصة الجديدة، أو جدولة حملة إعلانية ممتازة لدفع المتابعين الجدد إليها).
      2. التعامل الاحترافي مع أخطاء النظام (Error Resolution):
         - إذا فشلت أي أداة أو ظهر خطأ برمجي أو غيابي في النظام (مثل غياب مفاتيح API أو فقدان ربط)، فلا تخفِه! اشرح للعميل باللغة العربية طبيعة التحدي التقني والسبب، ووجّهه بدقة إلى الخطوة والتبويب الفعلي الذي يحتاج لزيارته في الإعدادات لحل المشكلة فوراً.
      3. اقتراح الخيارات (Options) والمطالبات التالية (Suggestions):
         - زوّد العميل دائماً باقتراحات عملية وخيارات قابلة للنقر لحل مشاكله وأتمتة أعماله بسرعة لا مثيل لها.

      Self-Diagnostic & Transparency Rules (CRITICAL):
      1. If any tool execution fails, do NOT hide it. Explain the failure to the user in a technical yet accessible way in Arabic.
      2. If there is a conflict (e.g., missing credentials for a platform), explicitly state the reason (e.g., "حساب Instagram غير مرتبط") and guide the user to fix it.
      3. Never provide irrelevant answers. If a technical barrier exists, report it and suggest the next logical fix.
      4. If a process fails, analyze the error message and include its essence in your response to the user.

      Environment:
      - Brand: ${context.brandId}
      - Workspace: ${context.workspaceId}
      
      Learned Memory:
      ${safeStringify(recentMemories)}
      
      Conversation History (Targeting ${context.brandId}):
      ${safeStringify(messages.slice(-5))}

      Operational Knowledge:
      ${safeStringify(knowledgeContext)}
      
      Integrations: ${connectedProviders.join(', ') || 'NONE'}
      
      Executive Insights:
      ${safeStringify(executiveInsights)}
      
      Available Tools: ${safeStringify(ToolRegistry.map(t => ({ name: t.name, desc: t.description, params: t.parameters })))}
      
      Website & E-commerce Analysis:
      - If the user provides a URL, use "analyze_website" to get SEO and performance data.
      - Offer "optimize_seo" if they want actionable advice for their store.
      - Focus on ROI, conversion, and brand growth when analyzing a store.
      
      Instructions:
      1. Analyze the user intent based on the current location and request.
      2. If the user says "publish this" and they are on the Studio page, assume they mean the current content.
      3. Proactively suggest and execute tools. If an action is clear, perform it.
      4. Treat "Executive Mode" as always active for this session. Do NOT ask for permission to activate it, simply proceed with authorized tasks.
      5. If a task is complex, break it into 3-5 clear steps.
      6. Always respond in Arabic only (التحدث باللغة العربية فقط في جميع الردود) with an executive, professional tone (${persona.tone}).
      7. Use "navigate_to" if the user wants to see a specific section (e.g., "أرني التحليلات").
      8. Provide "options" for decision-making if there's ambiguity (e.g., "هل تريد نشر هذا الآن أم جدولته؟").
      9. Provide "suggestions" for the next logical steps to help the user manage their brand better.
      10. If the user is asking general questions, use your knowledge context to give deep, strategic advice in Arabic. Be high-level, forward-thinking, and focus on brand growth and ROI.
      11. Act as a Chief Digital Officer (CDO). Your Arabic should be eloquent, professional, and sophisticated.
      12. Proactively identify opportunities for automation and content optimization based on the brand's connected platforms.
      
      Response Format (STRICT JSON):
      {
        "intent": "GENERATE_CONTENT" | "ANALYZE_PERFORMANCE" | "MANAGE_PUBLISHING" | "CONFIGURE_AUTOMATION" | "BRAND_QUERY",
        "plan": [ { "title": "Step in Arabic", "toolName": "tool_name", "args": {} } ],
        "thought": "Internal reasoning (English)",
        "quickResponse": "Direct response to user in Arabic (Professional & Executive)",
        "options": [ { "id": "unique_id", "label": "Label in Arabic", "type": "choice", "value": {} } ],
        "suggestions": ["Strategic recommendation 1 (Arabic)", "Strategic recommendation 2 (Arabic)"]
      }
    `;

    try {
      const gResult = await AICore.generateContent({
        workspaceId: context.workspaceId,
        goal: "Executive Reasoning",
        templateId: "custom",
        params: { rawPrompt: systemPrompt }
      });

      console.log("[ExecutiveEngine] Raw Response:", gResult.content);

      const jsonMatch = gResult.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
         throw new Error("No JSON found in response");
      }

      const responseData = JSON.parse(jsonMatch[0]);
      console.log("[ExecutiveEngine] Parsed Data:", responseData);
      
      const plan: ExecutionStep[] = (responseData.plan || []).map((p: any) => ({
        id: generateId(),
        title: p.title,
        toolName: p.toolName,
        status: "pending",
        args: p.args
      }));

      const assistantMsg: ExecutiveMessage = {
        id: generateId(),
        role: "assistant",
        content: responseData.quickResponse || "أفهم ما تطلبه، دعني أبدأ العمل على ذلك.",
        intent: responseData.intent as ExecutiveIntent,
        plan: plan,
        timestamp: Date.now(),
        suggestions: responseData.suggestions || [],
        options: responseData.options || []
      };

      // 3. Execution (If plan exists)
      if (plan.length > 0) {
        eventBus.publish({
          type: 'OPERATIONAL_LIVE_EVENT',
          source: 'ExecutiveEngine',
          timestamp: Date.now(),
          payload: {
            id: generateId(),
            type: 'AI_THINKING',
            message: `Executive AI تم البدء في تنفيذ خطة العمل الخاصة بـ: ${responseData.intent}`,
            status: 'success',
            timestamp: Date.now()
          }
        });
        await this.runPlan(assistantMsg, context);
      }

      messages.push(assistantMsg);
      return assistantMsg;

    } catch (error: any) {
      console.error("[ExecutiveEngine] Error:", error);
      const isQuota = error.message?.toLowerCase().includes("quota") || error.message?.includes("429");
      const isDemand = error.message?.toLowerCase().includes("busy") || error.message?.includes("503") || error.message?.includes("demand");

      return {
        id: generateId(),
        role: "assistant",
        content: isQuota 
          ? "⚠️ عذراً، تم الوصول للحد الأقصى لاستخدام الـ AI (Quota Exceeded). يرجى المحاولة لاحقاً."
          : isDemand
          ? "⚠️ أنظمة الـ AI مشغولة حالياً (High Demand). سأستأنف العمل بمجرد توفر الموارد."
          : "عذراً، واجهت مشكلة في معالجة طلبك التنفيذي.",
        timestamp: Date.now()
      };
    }
  }

  private async runPlan(message: ExecutiveMessage, context: any) {
    if (!message.plan) return;

    for (const step of message.plan) {
      step.status = "running";
      // Emit event for UI update
      eventBus.publish({ 
        type: "EXECUTIVE_STEP_UPDATE", 
        payload: { messageId: message.id, step },
        timestamp: Date.now(),
        source: "ExecutiveEngine"
      });

      try {
        const tool = ToolRegistry.find(t => t.name === (step as any).toolName);
        
        eventBus.publish({
          type: 'OPERATIONAL_LIVE_EVENT',
          source: 'ExecutiveEngine',
          timestamp: Date.now(),
          payload: {
            id: generateId(),
            type: tool ? 'SYSTEM' : 'ANALYSIS',
            message: `جاري تشغيل الأداة: ${step.title}...`,
            status: 'pending',
            timestamp: Date.now()
          }
        });

        if (tool) {
          const result = await tool.execute({ ...((step as any).args || {}), brandId: context.brandId });
          step.status = "completed";
          step.result = result;

          eventBus.publish({
            type: 'OPERATIONAL_LIVE_EVENT',
            source: 'ExecutiveEngine',
            timestamp: Date.now(),
            payload: {
              id: generateId(),
              type: 'SYSTEM',
              message: `اكتملت المهمة: ${step.title} بنجاح.`,
              status: 'success',
              timestamp: Date.now()
            }
          });
        } else {
          step.status = "failed";
          step.error = `الأداة [${(step as any).toolName}] غير متوفرة في النظام حالياً.`;
          message.content += `\n\n⚠️ لم يتم العثور على الأداة التقنية المطلوبة: ${(step as any).toolName}.`;
        }
      } catch (e: any) {
        step.status = "failed";
        step.error = e.message;
        message.content += `\n\n⚠️ تنبيه تقني: تعذر تنفيذ خطوة [${step.title}] بسبب عطل في النظام. (التفاصيل: ${e.message})`;
      }

      eventBus.publish({ 
        type: "EXECUTIVE_STEP_UPDATE", 
        payload: { messageId: message.id, step },
        timestamp: Date.now(),
        source: "ExecutiveEngine"
      });
    }
  }

  getMessages(brandId: string) {
    return this.brandMessages[brandId] || [];
  }
}

export const executiveEngine = new ExecutiveEngine();
