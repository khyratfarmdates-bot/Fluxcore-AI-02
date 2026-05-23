import { SystemEvent } from "../types";

type EventHandler = (event: SystemEvent) => void;

class EventBus {
  private listeners: Map<string, EventHandler[]> = new Map();

  public subscribe(eventType: string, handler: EventHandler) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(handler);
    
    return () => this.unsubscribe(eventType, handler);
  }

  public unsubscribe(eventType: string, handler: EventHandler) {
    if (!this.listeners.has(eventType)) return;
    const handlers = this.listeners.get(eventType)!.filter(h => h !== handler);
    this.listeners.set(eventType, handlers);
  }

  public publish(event: SystemEvent) {
    // console.log(`[EventBus] Publishing ${event.type} from ${event.source}`);
    const handlers = this.listeners.get(event.type) || [];
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (err) {
        console.error(`[EventBus] Error in handler for ${event.type}:`, err);
      }
    });

    // Also publish to a wildcard listener if needed
    const wildcardHandlers = this.listeners.get("*") || [];
    wildcardHandlers.forEach(handler => {
       try { handler(event) } catch(e) {}
    });
  }
}

export const eventBus = new EventBus();
