import { 
  IntegrationAccount, 
  IntegrationProvider, 
  BaseConnector, 
  ExecutionResult 
} from './types';
import { BaseService } from '../services/base';
import { eventBus } from '../core/events/EventBus';

export class IntegrationCoreEngine {
  private static instance: IntegrationCoreEngine;
  private connectors: Map<IntegrationProvider, BaseConnector> = new Map();
  private db = new BaseService<IntegrationAccount>('integrations');
  private logs = new BaseService<any>('integration_logs');

  private constructor() {}

  public static getInstance(): IntegrationCoreEngine {
    if (!IntegrationCoreEngine.instance) {
      IntegrationCoreEngine.instance = new IntegrationCoreEngine();
    }
    return IntegrationCoreEngine.instance;
  }

  public registerConnector(connector: BaseConnector) {
    this.connectors.set(connector.provider, connector);
    console.log(`[IntegrationCore] Registered connector for: ${connector.provider}`);
  }

  public async getActiveIntegrations(brandId: string): Promise<IntegrationAccount[]> {
    return await this.db.getByField('brandId', brandId);
  }

  public async executeAction(
    brandId: string, 
    provider: IntegrationProvider, 
    action: string, 
    params: any
  ): Promise<ExecutionResult> {
    const connectors = this.connectors.get(provider);
    if (!connectors) {
      return { success: false, error: `Connector for ${provider} not found.` };
    }

    const accounts = await this.db.getByField('brandId', brandId);
    const account = accounts.find(a => a.provider === provider && a.status === 'connected');

    if (!account) {
      return { success: false, error: `No active connection for ${provider}.` };
    }

    try {
      const result = await connectors.execute(action, params, account);
      
      // Log the execution
      await this.logs.create({
        integrationId: account.id,
        action,
        status: result.success ? 'success' : 'failure',
        payload: params,
        response: result.data,
        error: result.error,
        timestamp: new Date()
      });

      if (result.success) {
        eventBus.publish({
          type: 'INTEGRATION_EXECUTION_SUCCESS',
          source: provider,
          payload: { action, result: result.data },
          timestamp: Date.now()
        });
      }

      return result;
    } catch (error: any) {
      console.error(`[IntegrationCore] Execution error:`, error);
      return { success: false, error: error.message };
    }
  }

  public async checkHealth(brandId: string): Promise<any> {
    const integrations = await this.getActiveIntegrations(brandId);
    const statusMap: Record<string, any> = {};

    for (const integration of integrations) {
      const connector = this.connectors.get(integration.provider);
      if (connector) {
        const isValid = await connector.validate(integration);
        statusMap[integration.provider] = {
          status: isValid ? 'healthy' : 'degraded',
          lastChecked: new Date()
        };
      }
    }

    return statusMap;
  }
}

export const IntegrationEngine = IntegrationCoreEngine.getInstance();
