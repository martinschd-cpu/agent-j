export interface Timer {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

export const systemTimer: Timer = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export interface UndoableAction {
  /** Toast text, e.g. "Erledigt: Krimi-Dinner buchen". */
  label: string;
  /** Optimistic update, runs immediately. */
  apply(): void;
  /** Restores the state from before `apply`. */
  revert(): void;
  /** The real API call. Runs only when the undo window expired or another action starts. */
  commit(): Promise<unknown>;
}

export interface PendingInfo {
  id: number;
  label: string;
}

export interface UndoControllerOptions {
  delayMs?: number;
  timer?: Timer;
  /** Called when a commit fails. The action has been reverted already. */
  onError?: (error: unknown, action: UndoableAction) => void;
}

/**
 * Runs actions with an undo window: the UI changes at once, the backend only after `delayMs`.
 * Only one action is pending at a time; starting a new one commits the previous one first.
 */
export class UndoController {
  private readonly delayMs: number;
  private readonly timer: Timer;
  private readonly onError?: UndoControllerOptions['onError'];
  private pending: { info: PendingInfo; action: UndoableAction; handle: unknown } | null = null;
  private seq = 0;
  private listeners = new Set<() => void>();

  constructor(options: UndoControllerOptions = {}) {
    this.delayMs = options.delayMs ?? 8000;
    this.timer = options.timer ?? systemTimer;
    this.onError = options.onError;
  }

  /** The action that can still be undone, for the toast. Stable between changes. */
  getPending = (): PendingInfo | null => this.pending?.info ?? null;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  run(action: UndoableAction): Promise<void> {
    const flushed = this.flush();
    action.apply();
    const info = { id: ++this.seq, label: action.label };
    const handle = this.timer.setTimeout(() => void this.flush(), this.delayMs);
    this.pending = { info, action, handle };
    this.emit();
    return flushed;
  }

  /** Cancels the pending action and restores the previous state. Returns false if nothing was pending. */
  undo(): boolean {
    const p = this.pending;
    if (!p) return false;
    this.timer.clearTimeout(p.handle);
    this.pending = null;
    p.action.revert();
    this.emit();
    return true;
  }

  /** Commits the pending action now, e.g. before the app goes to the background. */
  async flush(): Promise<void> {
    const p = this.pending;
    if (!p) return;
    this.timer.clearTimeout(p.handle);
    this.pending = null;
    this.emit();
    try {
      await p.action.commit();
    } catch (e) {
      p.action.revert();
      this.onError?.(e, p.action);
    }
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }
}
