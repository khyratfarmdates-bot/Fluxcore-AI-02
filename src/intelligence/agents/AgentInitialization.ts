import { agentOrchestrator } from './ExecutiveAgentOrchestrator';
import { 
  ContentStrategistAgent, 
  PublishingOfficerAgent, 
  AnalyticsDirectorAgent, 
  AutomationArchitectAgent, 
  MediaProducerAgent,
  YouTubeGrowthSpecialistAgent
} from './SpecializedAgents';

export function initializeExecutiveAgents() {
  agentOrchestrator.registerAgent(new ContentStrategistAgent());
  agentOrchestrator.registerAgent(new PublishingOfficerAgent());
  agentOrchestrator.registerAgent(new AnalyticsDirectorAgent());
  agentOrchestrator.registerAgent(new AutomationArchitectAgent());
  agentOrchestrator.registerAgent(new MediaProducerAgent());
  agentOrchestrator.registerAgent(new YouTubeGrowthSpecialistAgent());
  
  console.log('[Agents] Multi-Agent Architecture Initialized');
}
