import { MockApi, chunkText, isInRange } from '@/api/mock/MockApi';
import { ApiError, type ChatStreamEvent } from '@/api/types';
import { toISODate } from '@/lib/dates';

// A Tuesday, like in the clickdummy.
const NOW = new Date(2026, 9, 20, 9, 0);

function createApi() {
  return new MockApi({ now: () => NOW, latencyMs: 0, stepDelayMs: 0, deltaDelayMs: 0 });
}

async function collect(stream: AsyncIterable<ChatStreamEvent>) {
  const events: ChatStreamEvent[] = [];
  for await (const ev of stream) events.push(ev);
  return events;
}

describe('MockApi', () => {
  it('serves the clickdummy data per workspace with dates relative to today', async () => {
    const api = createApi();
    const chats = await api.getChats('privat');
    expect(chats[0]).toMatchObject({ id: 'c0', title: 'Guten Morgen, Martin' });
    expect(chats.find((c) => c.id === 'c1')?.title).toBe('Wochenplanung KW 43');
    expect((await api.getChats('arbeit')).map((c) => c.id)).toEqual(['w1', 'w2']);

    const [greeting] = await api.getMessages('c0');
    expect(greeting?.parts[0]).toEqual({
      type: 'text',
      text: 'Guten Morgen, Martin. Hier ist dein Dienstag.',
    });
    expect(greeting?.parts[1]).toMatchObject({
      type: 'briefing',
      title: 'Morgenbriefing · Di, 20.10.',
    });

    const today = await api.getTasks('privat', 'today');
    expect(today.every((t) => t.isDraft || t.due === toISODate(NOW))).toBe(true);
  });

  it('returns copies, so callers cannot change the database by accident', async () => {
    const api = createApi();
    const [flow] = await api.getFlows();
    flow!.name = 'kaputt';
    expect((await api.getFlows())[0]?.name).toBe('Morgenbriefing');
  });

  it('streams steps, then text, then done, and persists both messages', async () => {
    const api = createApi();
    const events = await collect(api.sendMessage('c0', 'Was weißt du über mich?'));
    const types = events.map((e) => e.type);

    expect(types[0]).toBe('step');
    expect(types.indexOf('delta')).toBeGreaterThan(types.lastIndexOf('step'));
    expect(types.slice(-2)).toEqual(['card', 'done']);
    const text = events.flatMap((e) => (e.type === 'delta' ? [e.text] : [])).join('');
    expect(text).toBe('Hier ist, was ich über dich weiß, jeweils mit Quelle.');

    const messages = await api.getMessages('c0');
    expect(messages.slice(-2).map((m) => m.role)).toEqual(['user', 'agent']);
  });

  it('a mail request creates an approval and a request; approving removes the request', async () => {
    const api = createApi();
    const events = await collect(
      api.sendMessage('c0', 'Schreib Herrn Adler, dass die Miete kommt.'),
    );
    const ev = events.find((e) => e.type === 'approval');
    if (ev?.type !== 'approval') throw new Error('no approval');
    expect(ev.approval).toMatchObject({
      system: 'Gmail',
      recipient: 'Herr Adler',
      status: 'pending',
    });

    const requests = await api.getRequests('privat');
    const request = requests.find((r) => r.approvalId === ev.approval.id);
    expect(request?.text).toBe('E-Mail an Herr Adler senden');

    await api.answerRequest(request!.id, { type: 'approve' });
    expect((await api.getApproval(ev.approval.id)).status).toBe('approved');
    expect((await api.getRequests('privat')).some((r) => r.id === request!.id)).toBe(false);
    await expect(api.approve(ev.approval.id)).rejects.toBeInstanceOf(ApiError);
  });

  it('"verschieb" moves the task to the named weekday', async () => {
    const api = createApi();
    const events = await collect(
      api.sendMessage('c0', 'Verschieb das Krimi-Dinner auf Donnerstag.'),
    );
    const done = events.at(-1);
    expect(done?.type).toBe('done');
    const task = (await api.getTasks('privat', 'all')).find((t) => t.id === 't1');
    expect(task?.due).toBe('2026-10-22');
  });

  it('"jeden" creates a paused custom flow and opens it', async () => {
    const api = createApi();
    const events = await collect(
      api.sendMessage('c0', 'Jeden Freitag um 16 Uhr fass mir die Woche zusammen.'),
    );
    const card = events.find((e) => e.type === 'card');
    if (card?.type !== 'card') throw new Error('no card');
    const flow = (await api.getFlows()).find((f) => f.id === card.part.refId);
    expect(flow).toMatchObject({ kind: 'custom', enabled: false, trigger: 'freitags um 16:00' });
  });

  it('sets the title of a new chat from the first message', async () => {
    const api = createApi();
    const chat = await api.createChat('arbeit');
    await collect(api.sendMessage(chat.id, 'Hallo'));
    expect((await api.getChats('arbeit'))[0]).toMatchObject({ id: chat.id, title: 'Hallo' });
  });

  it('stops quietly when the stream is aborted', async () => {
    const api = new MockApi({ now: () => NOW, latencyMs: 0, stepDelayMs: 50, deltaDelayMs: 0 });
    const ctrl = new AbortController();
    const it = api.sendMessage('c0', 'Hallo', { signal: ctrl.signal })[Symbol.asyncIterator]();
    expect((await it.next()).value).toMatchObject({ type: 'step', status: 'running' });
    ctrl.abort();
    expect((await it.next()).done).toBe(true);
  });

  it('task lifecycle: confirm, done, discard', async () => {
    const api = createApi();
    expect((await api.confirmTask('n1')).isDraft).toBe(false);
    expect((await api.updateTask('t1', { status: 'done' })).completedAt).toBe(NOW.toISOString());
    await api.discardTask('n2');
    const all = await api.getTasks('privat', 'all');
    expect(all.find((t) => t.id === 'n2')).toBeUndefined();
  });

  it('adopting a template adds a flow once', async () => {
    const api = createApi();
    const flow = await api.adoptTemplate('h1');
    expect(flow).toMatchObject({ kind: 'hub', name: 'Wochenrückblick' });
    await expect(api.adoptTemplate('h1')).rejects.toBeInstanceOf(ApiError);
  });
});

describe('helpers', () => {
  it('chunkText keeps every character', () => {
    const text = 'Hallo Martin,\nwie geht es?';
    expect(chunkText(text).join('')).toBe(text);
  });

  it('isInRange', () => {
    const base = {
      id: 't',
      workspaceId: 'privat',
      title: 'x',
      isDraft: false,
      source: 'Chat' as const,
    };
    expect(isInRange({ ...base, status: 'open', due: '2026-10-19' }, 'today', NOW)).toBe(true);
    expect(isInRange({ ...base, status: 'done', due: '2026-10-19' }, 'today', NOW)).toBe(false);
    expect(isInRange({ ...base, status: 'open', due: '2026-10-26' }, 'week', NOW)).toBe(true);
    expect(isInRange({ ...base, status: 'open', due: '2026-10-27' }, 'week', NOW)).toBe(false);
    expect(isInRange({ ...base, status: 'open' }, 'week', NOW)).toBe(false);
    expect(isInRange({ ...base, status: 'open', isDraft: true }, 'today', NOW)).toBe(true);
  });
});
