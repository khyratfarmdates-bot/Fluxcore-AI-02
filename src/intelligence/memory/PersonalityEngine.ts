import { brandService } from '../../services/brand';
import { aiMemory } from './AIMemoryService';

export interface BrandPersonality {
  voice: string;
  tone: "Creative" | "Strategic" | "Analytical" | "Aggressive Growth" | "Luxury Brand" | "Corporate";
  values: string[];
  identityGuidelines: string;
}

class PersonalityEngine {
  public async getPersonaForBrand(brandId: string): Promise<BrandPersonality> {
    // Default fallback
    const defaultPersona: BrandPersonality = {
      voice: "Professional & Professional",
      tone: "Corporate",
      values: ["Integrity", "Innovation"],
      identityGuidelines: "Maintain a clear and helpful tone."
    };

    if (!brandId || brandId === 'default') {
      return defaultPersona;
    }

    const brand = await brandService.getById(brandId); // Assuming getById exists or similar
    
    if (!brand) return defaultPersona;

    // Enhance with learned preferences from memory
    const memory = await aiMemory.getRelevantMemory(brandId, 'preference', 5);
    // In a real implementation, we would merge memory insights with brand data
    
    return {
      voice: brand.personality || defaultPersona.voice,
      tone: (brand.writingStyle as any) || defaultPersona.tone,
      values: brand.preferredWords || defaultPersona.values,
      identityGuidelines: brand.description || defaultPersona.identityGuidelines
    };
  }

  public async adaptExecutiveTone(persona: BrandPersonality, context: string) {
    // Logic to adjust tone based on the current context (e.g., critical failure vs success)
    if (context === "CRITICAL_ERROR") return "Serious & Urgency";
    return persona.tone;
  }
}

export const personalityEngine = new PersonalityEngine();
