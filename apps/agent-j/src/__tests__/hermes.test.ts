import { HermesStreamMapper, mapMessage, mapSession } from '@/api/http/hermes';
import { HttpApi, type FetchLike } from '@/api/http/HttpApi';
import { MockApi } from '@/api/mock/MockApi';
import type { ChatStreamEvent } from '@/api/types';

const NOW = new Date('2026-10-20T08:00:00Z');
const frame = (event: string, data: object = {}) => ({ event, data: JSON.stringify(data) });

describe('Hermes mapping', () => {
  it('maps sessions and messages', () => {
    expect(
      mapSession({ id: 's1', title: null, preview: 'Hallo', last_active: 1_700_000_000 }, 'privat'),
    ).toEqual({
      id: 's1',
      workspaceId: 'privat',
      title: 'Hallo',
      updatedAt: new Date(1_700_000_000_000).toISOString(),
    });
    expect(
      mapMessage({ id: 3, session_id: 's1', role: 'assistant', content: 'Hi', timestamp: 1 }),
    ).toMatchObject({
      id: '3',
      role: 'agent',
      parts: [{ type: 'text', text: 'Hi' }],
    });
    expect(mapMessage({ id: 4, session_id: 's1', role: 'tool', content: '{}' })).toBeNull();
  });

  it('turns tool calls into steps and deltas into text, then emits one done', () => {
    const m = new HermesStreamMapper('s1', () => NOW);
    const events = [
      frame('run.started'),
      frame('message.started', { message: { id: 'm9', role: 'assistant' } }),
      frame('tool.started', { tool_name: 'web_search', preview: 'Wetter Nürnberg' }),
      frame('tool.progress', { tool_name: 'web_search', delta: 'denke' }),
      frame('tool.completed', { tool_name: 'web_search' }),
      frame('assistant.delta', { message_id: 'm9', delta: 'Es wird ' }),
      frame('assistant.delta', { message_id: 'm9', delta: 'sonnig.' }),
      frame('assistant.completed', { message_id: 'm9', content: 'Es wird sonnig.' }),
      frame('run.completed', { messages: [] }),
      frame('done'),
    ].flatMap((f) => m.map(f));

    expect(events).toEqual([
      { type: 'step', id: 'tool-1', label: 'web search · Wetter Nürnberg', status: 'running' },
      { type: 'step', id: 'tool-1', label: 'web search · Wetter Nürnberg', status: 'done' },
      { type: 'delta', text: 'Es wird ' },
      { type: 'delta', text: 'sonnig.' },
      {
        type: 'done',
        message: {
          id: 'm9',
          chatId: 's1',
          role: 'agent',
          createdAt: NOW.toISOString(),
          parts: [{ type: 'text', text: 'Es wird sonnig.' }],
        },
      },
    ]);
    expect(m.end()).toEqual([]);
  });

  it('maps errors and a stream that ends without answer', () => {
    const m = new HermesStreamMapper('s1');
    expect(m.map(frame('error', { message: 'Modell nicht erreichbar' }))).toEqual([
      { type: 'error', message: 'Modell nicht erreichbar' },
    ]);
    expect(new HermesStreamMapper('s1').end()).toEqual([
      { type: 'error', message: 'Verbindung beendet, bevor eine Antwort kam' },
    ]);
  });
});

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  let i = 0;
  return {
    getReader: () => ({
      read: async () =>
        i < chunks.length
          ? { done: false, value: enc.encode(chunks[i++]) }
          : { done: true, value: undefined },
      cancel: async () => undefined,
    }),
  } as unknown as ReadableStream<Uint8Array>;
}

describe('HttpApi', () => {
  const fallback = new MockApi({ latencyMs: 0, stepDelayMs: 0, deltaDelayMs: 0 });

  it('sends the bearer token and filters sessions by workspace', async () => {
    const fetch = jest.fn<ReturnType<FetchLike>, Parameters<FetchLike>>(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ data: [{ id: 's1', title: 'Plan', last_active: 1 }] }),
      text: async () => '',
      body: null,
    }));
    const api = new HttpApi({ baseUrl: 'http://hermes:8642/', token: 'geheim', fetch, fallback });
    const chats = await api.getChats('arbeit');

    expect(chats[0]).toMatchObject({ id: 's1', workspaceId: 'arbeit', title: 'Plan' });
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe('http://hermes:8642/api/sessions?limit=50&source=agent-j-arbeit');
    expect(init.headers.Authorization).toBe('Bearer geheim');
  });

  it('streams a chat answer over SSE', async () => {
    const fetch: FetchLike = async () => ({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '',
      body: streamOf([
        'event: tool.started\ndata: {"tool_name":"calendar"}\n\n',
        'event: tool.completed\ndata: {"tool_name":"calendar"}\n\nevent: assistant.de',
        'lta\ndata: {"message_id":"m1","delta":"Zwei Termine."}\n\n',
        'event: run.completed\ndata: {}\n\n',
      ]),
    });
    const api = new HttpApi({ baseUrl: 'http://hermes', fetch, fallback });
    const events: ChatStreamEvent[] = [];
    for await (const ev of api.sendMessage('s1', 'Was steht an?')) events.push(ev);

    expect(events.map((e) => e.type)).toEqual(['step', 'step', 'delta', 'done']);
    expect(events.at(-1)).toMatchObject({
      message: { id: 'm1', parts: [{ text: 'Zwei Termine.' }] },
    });
  });

  it('reports HTTP errors as stream errors', async () => {
    const fetch: FetchLike = async () => ({
      ok: false,
      status: 401,
      json: async () => ({}),
      text: async () => '{"error":"invalid key"}',
      body: null,
    });
    const api = new HttpApi({ baseUrl: 'http://hermes', fetch, fallback });
    const events: ChatStreamEvent[] = [];
    for await (const ev of api.sendMessage('s1', 'Hallo')) events.push(ev);
    expect(events).toEqual([
      { type: 'error', message: 'Nicht angemeldet oder Schlüssel ungültig' },
    ]);
  });

  it('delegates everything Hermes lacks to the fallback', async () => {
    const fetch = jest.fn();
    const api = new HttpApi({ baseUrl: 'http://hermes', fetch, fallback });
    expect((await api.getFlows()).length).toBeGreaterThan(0);
    expect(fetch).not.toHaveBeenCalled();
  });
});
