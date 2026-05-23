import { eventBus } from '../core/events/EventBus';
import { automationService } from './automation';
import { workflowEngine } from './WorkflowExecutionEngine'; // We'll create this next
import { onSnapshot } from 'firebase/firestore';

class AutomationTriggerEngine {
  private activeWorkflows: any[] = [];

  public start() {
    console.log("[AutomationTriggerEngine] Starting listener...");
    
    // 1. Listen for system events that could trigger local workflows
    eventBus.subscribe('CONTENT_GENERATED', (event) => this.handleEvent('NewContent', event.payload));
    eventBus.subscribe('INTEGRATION_EXECUTION_SUCCESS', (event) => this.handleEvent('IntegrationAction', event.payload));
    
    // 2. Poll for scheduled workflows every minute (simple simulation of cron)
    setInterval(() => this.checkScheduledWorkflows(), 60000);
  }

  private async handleEvent(triggerType: string, payload: any) {
    if (!payload.workspaceId) return;
    
    // Fetch active workflows for this brand with this trigger
    const workflows = await automationService.getByField('brandId', payload.workspaceId);
    const triggering = workflows.filter(w => w.active && w.steps.some(s => s.type === 'trigger' && s.actionOrTriggerType === triggerType));
    
    for (const workflow of triggering) {
       console.log(`[AutomationTriggerEngine] Triggering workflow: ${workflow.title}`);
       workflowEngine.execute(workflow, payload);
    }
  }

  private async checkScheduledWorkflows() {
    // Real implementation would use a backend cron, 
    // here we just check if any active scheduled workflow is due
    console.log("[AutomationTriggerEngine] Checking scheduled workflows...");
  }
}

export const automationTriggerEngine = new AutomationTriggerEngine();
