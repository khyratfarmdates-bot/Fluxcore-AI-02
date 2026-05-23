import { FluxcoreAI02Extension, ExtensionManifest } from './SDK';
import { BaseService } from '../services/base';

export interface ExtensionInstance {
  id: string;
  status: 'enabled' | 'disabled' | 'error';
  manifest: ExtensionManifest;
}

class ExtensionRuntime {
  private activeExtensions: Map<string, FluxcoreAI02Extension> = new Map();
  private hooks: Map<string, ((payload: any) => Promise<any>)[]> = new Map();

  async registerExtension(extension: FluxcoreAI02Extension) {
    const manifest = extension.getManifest();
    
    // Security check: validate permissions
    this.validatePermissions(manifest.permissions);

    await extension.onInit();
    this.activeExtensions.set(manifest.id, extension);
    
    console.log(`[ExtensionRuntime] Extension ${manifest.name} v${manifest.version} loaded.`);
  }

  private validatePermissions(permissions: string[]) {
    // In a real system, we would check against an OS-level security policy
    // For now, we log it
    console.log(`[Security] Validating permissions: ${permissions.join(', ')}`);
  }

  // Hook system for extensibility
  public subscribeToHook(hookName: string, callback: (payload: any) => Promise<any>) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    this.hooks.get(hookName)!.push(callback);
  }

  public async callHook(hookName: string, payload: any): Promise<any> {
    const callbacks = this.hooks.get(hookName) || [];
    let currentPayload = payload;

    for (const cb of callbacks) {
      try {
        currentPayload = await cb(currentPayload);
      } catch (err) {
        console.error(`[ExtensionRuntime] Hook ${hookName} failed:`, err);
      }
    }

    return currentPayload;
  }

  public getActiveExtensions() {
    return Array.from(this.activeExtensions.values()).map(e => e.getManifest());
  }
}

export const extensionRuntime = new ExtensionRuntime();
