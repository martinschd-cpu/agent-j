import type { AgentJApi } from '../AgentJApi';
import {
  ApiError,
  type Chat,
  type ChatStreamEvent,
  type ID,
  type Message,
  type RequestAction,
  type SendMessageOptions,
  type SettingsPatch,
  type TaskPatch,
  type TaskRange,
  type FlowPatch,
} from '../types';
import {
  HermesStreamMapper,
  mapMessage,
  mapSession,
  sourceForWorkspace,
  type HermesList,
  type HermesMessage,
  type HermesSession,
} from './hermes';
import { SseParser } from './sse';

/** The subset of `fetch` HttpApi needs. `expo/fetch` provides a streaming body on all platforms. */
export type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string; signal?: AbortSignal },
) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
  body: ReadableStream<Uint8Array> | null;
}>;

export interface HttpApiOptions {
  baseUrl: string;
  token?: string;
  fetch: FetchLike;
  /** Handles everything Hermes does not offer yet (see docs/hermes-api.md). */
  fallback: AgentJApi;
}

/**
 * Talks to the Hermes API server (or a BFF with the same routes) for chats and streaming.
 * All other calls go to the fallback, usually a MockApi.
 */
export class HttpApi implements AgentJApi {
  private readonly baseUrl: string;

  constructor(private readonly options: HttpApiOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json', ...extra };
    if (this.options.token) h.Authorization = `Bearer ${this.options.token}`;
    return h;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    let res: Awaited<ReturnType<FetchLike>>;
    try {
      res = await this.options.fetch(`${this.baseUrl}${path}`, {
        method,
        headers: this.headers(),
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (e) {
      throw new ApiError(
        `Backend nicht erreichbar: ${e instanceof Error ? e.message : String(e)}`,
        0,
        'network',
      );
    }
    if (!res.ok) throw await toApiError(res);
    return (await res.json()) as T;
  }

  // Chats (Hermes) -------------------------------------------------------------

  async getChats(workspaceId: ID): Promise<Chat[]> {
    const source = encodeURIComponent(sourceForWorkspace(workspaceId));
    const list = await this.request<HermesList<HermesSession>>(
      'GET',
      `/api/sessions?limit=50&source=${source}`,
    );
    return list.data.map((s) => mapSession(s, workspaceId));
  }

  async createChat(workspaceId: ID): Promise<Chat> {
    const session = await this.request<HermesSession>('POST', '/api/sessions', {
      title: 'Neuer Chat',
      source: sourceForWorkspace(workspaceId),
    });
    return mapSession(session, workspaceId);
  }

  async getMessages(chatId: ID): Promise<Message[]> {
    const list = await this.request<HermesList<HermesMessage>>(
      'GET',
      `/api/sessions/${encodeURIComponent(chatId)}/messages?limit=200&order=oldest`,
    );
    return list.data.map(mapMessage).filter((m): m is Message => m !== null);
  }

  async *sendMessage(
    chatId: ID,
    text: string,
    options: SendMessageOptions = {},
  ): AsyncIterable<ChatStreamEvent> {
    const mapper = new HermesStreamMapper(chatId);
    let res: Awaited<ReturnType<FetchLike>>;
    try {
      res = await this.options.fetch(
        `${this.baseUrl}/api/sessions/${encodeURIComponent(chatId)}/chat/stream`,
        {
          method: 'POST',
          headers: this.headers({ Accept: 'text/event-stream' }),
          body: JSON.stringify({ message: text }),
          signal: options.signal,
        },
      );
    } catch (e) {
      if (options.signal?.aborted) return;
      yield {
        type: 'error',
        message: `Backend nicht erreichbar: ${e instanceof Error ? e.message : String(e)}`,
      };
      return;
    }
    if (!res.ok) {
      yield { type: 'error', message: (await toApiError(res)).message };
      return;
    }
    if (!res.body) {
      yield { type: 'error', message: 'Das Backend liefert keinen Stream' };
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    const parser = new SseParser();
    try {
      while (!mapper.isFinished) {
        const { done, value } = await reader.read();
        const frames = done ? parser.end() : parser.feed(decoder.decode(value, { stream: true }));
        for (const frame of frames) yield* mapper.map(frame);
        if (done) break;
      }
      yield* mapper.end();
    } catch (e) {
      if (options.signal?.aborted) return;
      yield {
        type: 'error',
        message: `Stream abgebrochen: ${e instanceof Error ? e.message : String(e)}`,
      };
    } finally {
      reader.cancel().catch(() => undefined);
    }
  }

  // Everything else: not in Hermes yet --------------------------------------------

  getMe = () => this.options.fallback.getMe();
  getWorkspaces = () => this.options.fallback.getWorkspaces();
  getRequests = (workspaceId: ID) => this.options.fallback.getRequests(workspaceId);
  answerRequest = (requestId: ID, action: RequestAction) =>
    this.options.fallback.answerRequest(requestId, action);
  getApproval = (approvalId: ID) => this.options.fallback.getApproval(approvalId);
  approve = (approvalId: ID) => this.options.fallback.approve(approvalId);
  reject = (approvalId: ID) => this.options.fallback.reject(approvalId);
  updateApprovalDraft = (approvalId: ID, body: string) =>
    this.options.fallback.updateApprovalDraft(approvalId, body);
  getTasks = (workspaceId: ID, range: TaskRange) =>
    this.options.fallback.getTasks(workspaceId, range);
  updateTask = (taskId: ID, patch: TaskPatch) => this.options.fallback.updateTask(taskId, patch);
  confirmTask = (taskId: ID) => this.options.fallback.confirmTask(taskId);
  discardTask = (taskId: ID) => this.options.fallback.discardTask(taskId);
  getFlows = () => this.options.fallback.getFlows();
  updateFlow = (flowId: ID, patch: FlowPatch) => this.options.fallback.updateFlow(flowId, patch);
  getFlowhub = () => this.options.fallback.getFlowhub();
  adoptTemplate = (templateId: ID) => this.options.fallback.adoptTemplate(templateId);
  getContactGraph = () => this.options.fallback.getContactGraph();
  getProfile = () => this.options.fallback.getProfile();
  confirmFact = (factId: ID) => this.options.fallback.confirmFact(factId);
  rejectFact = (factId: ID) => this.options.fallback.rejectFact(factId);
  getAccounts = () => this.options.fallback.getAccounts();
  connectAccount = (accountId: ID) => this.options.fallback.connectAccount(accountId);
  disconnectAccount = (accountId: ID) => this.options.fallback.disconnectAccount(accountId);
  getSettings = () => this.options.fallback.getSettings();
  updateSettings = (patch: SettingsPatch) => this.options.fallback.updateSettings(patch);
  getBilling = () => this.options.fallback.getBilling();
}

async function toApiError(res: { status: number; text(): Promise<string> }): Promise<ApiError> {
  let detail = '';
  try {
    const raw = await res.text();
    try {
      const body = JSON.parse(raw) as { error?: string | { message?: string }; message?: string };
      detail =
        typeof body.error === 'string' ? body.error : (body.error?.message ?? body.message ?? raw);
    } catch {
      detail = raw;
    }
  } catch {
    // No body.
  }
  if (res.status === 401 || res.status === 403)
    return new ApiError('Nicht angemeldet oder Schlüssel ungültig', res.status, 'unauthorized');
  return new ApiError(
    detail ? `Fehler ${res.status}: ${detail}` : `Fehler ${res.status}`,
    res.status,
  );
}
