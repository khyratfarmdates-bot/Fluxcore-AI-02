export type ServiceStatus = 'connected' | 'disconnected' | 'mocked' | 'degraded' | 'initializing' | 'error';

export interface ServiceInfo {
  id: string;
  name: string;
  category: 'database' | 'ai' | 'automation' | 'integration' | 'marketing' | 'media' | 'analytics';
  status: ServiceStatus;
  lastChecked: number;
  error?: string;
  isReal: boolean;
  version?: string;
}

export interface RuntimeEvent {
  id: string;
  timestamp: number;
  type: 'service_change' | 'execution_failure' | 'mock_detected' | 'sync_error' | 'health_check';
  severity: 'info' | 'warning' | 'error' | 'critical';
  serviceId?: string;
  message: string;
  metadata?: any;
}

export interface ExecutionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  executionTime: number;
  isMocked: boolean;
  timestamp: number;
}
