import { IntegrationEngine } from './CoreEngine';
import { SocialConnector, AIConnector } from './PlatformConnectors';

export function initializeIntegrationInfrastructure() {
  // Social Platforms
  IntegrationEngine.registerConnector(new SocialConnector('x'));
  IntegrationEngine.registerConnector(new SocialConnector('linkedin'));
  IntegrationEngine.registerConnector(new SocialConnector('facebook'));
  IntegrationEngine.registerConnector(new SocialConnector('instagram'));
  IntegrationEngine.registerConnector(new SocialConnector('tiktok'));
  IntegrationEngine.registerConnector(new SocialConnector('youtube'));

  // AI & Media Providers
  IntegrationEngine.registerConnector(new AIConnector('gemini'));
  IntegrationEngine.registerConnector(new AIConnector('openai'));
  IntegrationEngine.registerConnector(new AIConnector('claude'));
  
  console.log('[Integrations] Full Infrastructure Initialized.');
}
