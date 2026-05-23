import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { ConnectedApp, IntegrationProvider, IntegrationProviderId } from "./types";

export const AVAILABLE_PROVIDERS: IntegrationProvider[] = [
  { id: "google", name: "Google Workspace", category: "productivity", authType: "oauth2", capabilities: ["docs", "drive"] },
  { id: "meta", name: "Meta (FB/Insta)", category: "social", authType: "oauth2", capabilities: ["publish", "analytics", "messages"] },
  { id: "tiktok", name: "TikTok", category: "social", authType: "oauth2", capabilities: ["publish", "analytics"] },
  { id: "x", name: "X (Twitter)", category: "social", authType: "oauth2", capabilities: ["publish", "analytics", "trends"] },
  { id: "linkedin", name: "LinkedIn", category: "social", authType: "oauth2", capabilities: ["publish", "analytics"] },
  { id: "slack", name: "Slack", category: "messaging", authType: "oauth2", capabilities: ["notifications", "commands"] },
  { id: "notion", name: "Notion", category: "productivity", authType: "oauth2", capabilities: ["read", "write"] },
  { id: "shopify", name: "Shopify", category: "ecommerce", authType: "oauth2", capabilities: ["read_products", "read_orders"] },
  { id: "zapier", name: "Zapier", category: "automation", authType: "api_key", capabilities: ["trigger", "action"] },
];

export class IntegrationsManager {
  public async getConnectedApps(workspaceId: string): Promise<ConnectedApp[]> {
    if (!auth.currentUser) return [];
    try {
      const q = query(
        collection(db, "integrations"), 
        where("brandId", "==", workspaceId),
        where("userId", "==", auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConnectedApp));
      
      // If none found, we can return empty or mock if explicitly requested, 
      // but "production functionalization" means bringing from real DB.
      return data;
    } catch (err) {
      console.error('Error fetching integrations:', err);
      return [];
    }
  }
}

export const integrationsManager = new IntegrationsManager();
