export type TriggerType = 'Schedule' | 'Trend' | 'NewContent' | 'VideoUpload' | 'ManualIdea' | 'Webhook';
export type ActionType = 'GenerateContent' | 'GenerateScript' | 'GenerateHashtags' | 'GenerateCaption' | 'PublishPost' | 'SaveDraft' | 'SendNotification' | 'AnalyzeContent';
export type WorkflowStatus = 'Running' | 'Waiting' | 'Failed' | 'Completed' | 'Idle';

export interface WorkflowStep {
  id: string;
  type: 'trigger' | 'action';
  actionOrTriggerType: TriggerType | ActionType;
  title: string;
  config: Record<string, any>;
}

export interface Workflow {
  id: string;
  brandId: string;
  title: string;
  description: string;
  active: boolean;
  steps: WorkflowStep[];
  status: WorkflowStatus;
  lastRun?: Date;
}

export interface ActivityLog {
  id: string;
  workflowId: string;
  workflowTitle: string;
  action: string;
  status: 'Success' | 'Failed' | 'Warning';
  timestamp: Date;
  details?: string;
}
