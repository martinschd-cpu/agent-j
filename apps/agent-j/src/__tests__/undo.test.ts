import { UndoController, type UndoableAction } from '@/state/undo';

function fakeAction(label: string, log: string[], fail = false): UndoableAction {
  return {
    label,
    apply: () => log.push(`apply ${label}`),
    revert: () => log.push(`revert ${label}`),
    commit: async () => {
      log.push(`commit ${label}`);
      if (fail) throw new Error('kaputt');
    },
  };
}

describe('UndoController', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('applies at once and commits only after 8 seconds', async () => {
    const log: string[] = [];
    const undo = new UndoController();
    void undo.run(fakeAction('a', log));

    expect(log).toEqual(['apply a']);
    expect(undo.getPending()?.label).toBe('a');

    await jest.advanceTimersByTimeAsync(7999);
    expect(log).toEqual(['apply a']);

    await jest.advanceTimersByTimeAsync(1);
    expect(log).toEqual(['apply a', 'commit a']);
    expect(undo.getPending()).toBeNull();
  });

  it('undo reverts and never calls the API', async () => {
    const log: string[] = [];
    const undo = new UndoController();
    void undo.run(fakeAction('a', log));

    expect(undo.undo()).toBe(true);
    await jest.advanceTimersByTimeAsync(10_000);

    expect(log).toEqual(['apply a', 'revert a']);
    expect(undo.getPending()).toBeNull();
    expect(undo.undo()).toBe(false);
  });

  it('commits the pending action when a new one starts', async () => {
    const log: string[] = [];
    const undo = new UndoController();
    void undo.run(fakeAction('a', log));
    await jest.advanceTimersByTimeAsync(3000);
    await undo.run(fakeAction('b', log));

    expect(log).toEqual(['apply a', 'commit a', 'apply b']);
    expect(undo.getPending()?.label).toBe('b');

    // The timer of "a" must not commit "b" early.
    await jest.advanceTimersByTimeAsync(5000);
    expect(log).not.toContain('commit b');
    await jest.advanceTimersByTimeAsync(3000);
    expect(log).toContain('commit b');
  });

  it('reverts and reports when the commit fails', async () => {
    const log: string[] = [];
    const onError = jest.fn();
    const undo = new UndoController({ onError });
    void undo.run(fakeAction('a', log, true));
    await undo.flush();

    expect(log).toEqual(['apply a', 'commit a', 'revert a']);
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ label: 'a' }),
    );
  });

  it('uses an injected timer and notifies subscribers', () => {
    const scheduled: { fn: () => void; ms: number }[] = [];
    const timer = {
      setTimeout: (fn: () => void, ms: number) => scheduled.push({ fn, ms }),
      clearTimeout: jest.fn(),
    };
    const listener = jest.fn();
    const undo = new UndoController({ timer, delayMs: 500 });
    undo.subscribe(listener);
    void undo.run(fakeAction('a', []));

    expect(scheduled).toHaveLength(1);
    expect(scheduled[0]?.ms).toBe(500);
    expect(listener).toHaveBeenCalled();
  });
});
