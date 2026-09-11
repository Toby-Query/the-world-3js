type Listener<T> = (event: T) => void;

/** Minimal typed event emitter. `Events` maps each event name to its payload. */
export class Emitter<Events extends object> {
  private readonly listeners: { [K in keyof Events]?: Set<Listener<Events[K]>> } = {};

  /** Subscribe; returns a function that unsubscribes. */
  on<K extends keyof Events>(type: K, listener: Listener<Events[K]>): () => void {
    const set = (this.listeners[type] ??= new Set());
    set.add(listener);
    return () => set.delete(listener);
  }

  emit<K extends keyof Events>(type: K, event: Events[K]): void {
    this.listeners[type]?.forEach((listener) => listener(event));
  }
}
