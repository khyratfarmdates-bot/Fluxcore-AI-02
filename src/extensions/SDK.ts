export type ExtensionPermission = 
  | 'read_memory' | 'write_memory' 
  | 'read_knowledge' | 'write_knowledge'
  | 'execute_workflow' 
  | 'publish_external'
  | 'ui_inject';

export interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  type: 'AGENT' | 'TOOL' | 'INTEGRATION' | 'UI';
  permissions: ExtensionPermission[];
  hooks: string[];
}

export abstract class FluxcoreAI02Extension {
  constructor(protected manifest: ExtensionManifest) {}

  public getManifest(): ExtensionManifest {
    return this.manifest;
  }

  abstract onInit(): Promise<void>;
  abstract onDestroy(): Promise<void>;
}

export interface ExtensionHook {
  name: string;
  callback: (payload: any) => Promise<any>;
}
