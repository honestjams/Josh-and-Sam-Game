/**
 * Lightweight typed event bus for cross-scene communication. Scenes emit and
 * subscribe here instead of reaching into one another. Keep the event map
 * authoritative — every cross-scene message has a typed payload.
 */
export interface GameEvents {
  'dialogue:start': { dialogueId: string };
  'dialogue:end': { dialogueId: string };
  'shop:open': { shopId: string };
  'battle:start': { enemyIds: string[]; isMiniboss?: boolean };
  'battle:end': { victory: boolean };
  'game:saved': { slotId: string };
  'game:loaded': { slotId: string };
  'toast': { message: string };
}

type Handler<T> = (payload: T) => void;
type AnyHandler = Handler<GameEvents[keyof GameEvents]>;

class EventBus {
  private handlers = new Map<keyof GameEvents, Set<AnyHandler>>();

  on<K extends keyof GameEvents>(event: K, handler: Handler<GameEvents[K]>): () => void {
    let set = this.handlers.get(event);
    if (!set) this.handlers.set(event, (set = new Set()));
    set.add(handler as AnyHandler);
    // Return an unsubscribe function so callers can clean up on scene shutdown.
    return () => this.off(event, handler);
  }

  off<K extends keyof GameEvents>(event: K, handler: Handler<GameEvents[K]>): void {
    this.handlers.get(event)?.delete(handler as AnyHandler);
  }

  emit<K extends keyof GameEvents>(event: K, payload: GameEvents[K]): void {
    this.handlers.get(event)?.forEach((h) => (h as Handler<GameEvents[K]>)(payload));
  }
}

/** Process-wide event bus singleton. */
export const eventBus = new EventBus();
