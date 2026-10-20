import type { AgentJApi } from '../AgentJApi';
import {
  ApiError,
  type AgentRequest,
  type Approval,
  type Billing,
  type Chat,
  type ChatStreamEvent,
  type ConnectedAccount,
  type ContactGraph,
  type Flow,
  type FlowPatch,
  type FlowTemplate,
  type ID,
  type Message,
  type MessagePart,
  type Profile,
  type RequestAction,
  type SendMessageOptions,
  type Settings,
  type SettingsPatch,
  type Task,
  type TaskPatch,
  type TaskRange,
  type User,
  type Workspace,
} from '../types';
import { planReply } from './replies';
import { createSeed, type MockDb } from './seed';
import { daysBetween, parseISODate } from '@/lib/dates';

export interface MockApiOptions {
  now?: () => Date;
  /** Simulated network latency for every call. */
  latencyMs?: number;
  /** Pause between two work steps while streaming. */
  stepDelayMs?: number;
  /** Pause between two text deltas while streaming. */
  deltaDelayMs?: number;
  db?: MockDb;
}

const clone = <T>(v: T): T => (v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T));

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new ApiError('Abgebrochen', 0, 'aborted'));
    if (ms <= 0) return resolve();
    const t = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new ApiError('Abgebrochen', 0, 'aborted'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** Splits text into word-sized chunks, keeping whitespace and line breaks. */
export function chunkText(text: string): string[] {
  return text.match(/\S+\s*|\s+/g) ?? [];
}

/** In-app backend with the clickdummy sample data. State lives in memory until reload. */
export class MockApi implements AgentJApi {
  readonly db: MockDb;
  private readonly now: () => Date;
  private readonly latencyMs: number;
  private readonly stepDelayMs: number;
  private readonly deltaDelayMs: number;
  private seq = 0;

  constructor(options: MockApiOptions = {}) {
    this.now = options.now ?? (() => new Date());
    this.latencyMs = options.latencyMs ?? 150;
    this.stepDelayMs = options.stepDelayMs ?? 750;
    this.deltaDelayMs = options.deltaDelayMs ?? 25;
    this.db = options.db ?? createSeed(this.now());
  }

  private newId = (prefix: string): ID => `${prefix}-${Date.now().toString(36)}-${++this.seq}`;

  private async respond<T>(value: T): Promise<T> {
    await sleep(this.latencyMs);
    return clone(value);
  }

  private find<T extends { id: ID }>(list: T[], id: ID, what: string): T {
    const item = list.find((x) => x.id === id);
    if (!item) throw new ApiError(`${what} nicht gefunden`, 404, 'not_found');
    return item;
  }

  // Account ------------------------------------------------------------------

  async getMe(): Promise<User> {
    return this.respond(this.db.user);
  }

  async getWorkspaces(): Promise<Workspace[]> {
    return this.respond(this.db.workspaces);
  }

  // Chats --------------------------------------------------------------------

  async getChats(workspaceId: ID): Promise<Chat[]> {
    const chats = this.db.chats
      .filter((c) => c.workspaceId === workspaceId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return this.respond(chats);
  }

  async createChat(workspaceId: ID): Promise<Chat> {
    this.find(this.db.workspaces, workspaceId, 'Workspace');
    const chat: Chat = {
      id: this.newId('chat'),
      workspaceId,
      title: 'Neuer Chat',
      updatedAt: this.now().toISOString(),
    };
    this.db.chats.push(chat);
    return this.respond(chat);
  }

  async getMessages(chatId: ID): Promise<Message[]> {
    this.find(this.db.chats, chatId, 'Chat');
    return this.respond(this.db.messages.filter((m) => m.chatId === chatId));
  }

  async *sendMessage(
    chatId: ID,
    text: string,
    options: SendMessageOptions = {},
  ): AsyncIterable<ChatStreamEvent> {
    const { signal } = options;
    const chat = this.find(this.db.chats, chatId, 'Chat');
    const now = this.now();
    const isFirst = !this.db.messages.some((m) => m.chatId === chatId && m.role === 'user');
    this.db.messages.push({
      id: this.newId('m'),
      chatId,
      role: 'user',
      createdAt: now.toISOString(),
      parts: [{ type: 'text', text }],
    });
    if (isFirst && chat.title === 'Neuer Chat')
      chat.title = text.length > 60 ? `${text.slice(0, 57)}...` : text;
    chat.updatedAt = now.toISOString();

    try {
      const plan = planReply(text, { db: this.db, chat, now, newId: this.newId });

      for (const [i, label] of plan.steps.entries()) {
        const id = `s${i}`;
        yield { type: 'step', id, label, status: 'running' };
        await sleep(this.stepDelayMs, signal);
        yield { type: 'step', id, label, status: 'done' };
      }
      for (const chunk of chunkText(plan.text)) {
        yield { type: 'delta', text: chunk };
        await sleep(this.deltaDelayMs, signal);
      }

      const parts: MessagePart[] = [{ type: 'text', text: plan.text }];
      if (plan.card) {
        parts.push(plan.card);
        yield { type: 'card', part: clone(plan.card) };
      }
      if (plan.approval) {
        parts.push({ type: 'approval', approvalId: plan.approval.id });
        yield { type: 'approval', approval: clone(plan.approval) };
      }
      const message: Message = {
        id: this.newId('m'),
        chatId,
        role: 'agent',
        createdAt: this.now().toISOString(),
        parts,
      };
      this.db.messages.push(message);
      chat.updatedAt = message.createdAt;
      yield { type: 'done', message: clone(message) };
    } catch (e) {
      if (e instanceof ApiError && e.code === 'aborted') return;
      yield { type: 'error', message: e instanceof Error ? e.message : 'Unbekannter Fehler' };
    }
  }

  // Requests -----------------------------------------------------------------

  async getRequests(workspaceId: ID): Promise<AgentRequest[]> {
    return this.respond(this.db.requests.filter((r) => r.workspaceId === workspaceId));
  }

  async answerRequest(requestId: ID, action: RequestAction): Promise<void> {
    const request = this.find(this.db.requests, requestId, 'Request');
    if (action.type === 'open_chat') return this.respond(undefined);
    if (action.type === 'approve' || action.type === 'reject') {
      if (!request.approvalId)
        throw new ApiError('Request hat keine Freigabe', 400, 'invalid_action');
      await (action.type === 'approve'
        ? this.approve(request.approvalId)
        : this.reject(request.approvalId));
    }
    this.db.requests = this.db.requests.filter((r) => r.id !== requestId);
    return this.respond(undefined);
  }

  // Approvals ----------------------------------------------------------------

  async getApproval(approvalId: ID): Promise<Approval> {
    return this.respond(this.find(this.db.approvals, approvalId, 'Freigabe'));
  }

  private async decide(approvalId: ID, status: 'approved' | 'rejected'): Promise<Approval> {
    const approval = this.find(this.db.approvals, approvalId, 'Freigabe');
    if (approval.status !== 'pending')
      throw new ApiError('Freigabe ist bereits entschieden', 409, 'already_decided');
    const at = this.now().toISOString();
    approval.status = status;
    approval.auditTrail.push(
      { at, actor: 'user', text: status === 'approved' ? 'Freigegeben' : 'Abgelehnt' },
      status === 'approved'
        ? { at, actor: 'system', text: `An ${approval.recipient} über ${approval.system} gesendet` }
        : { at, actor: 'system', text: 'Nichts gesendet' },
    );
    this.db.requests = this.db.requests.filter((r) => r.approvalId !== approvalId);
    return this.respond(approval);
  }

  async approve(approvalId: ID): Promise<Approval> {
    return this.decide(approvalId, 'approved');
  }

  async reject(approvalId: ID): Promise<Approval> {
    return this.decide(approvalId, 'rejected');
  }

  async updateApprovalDraft(approvalId: ID, body: string): Promise<Approval> {
    const approval = this.find(this.db.approvals, approvalId, 'Freigabe');
    if (approval.status !== 'pending')
      throw new ApiError('Freigabe ist bereits entschieden', 409, 'already_decided');
    approval.body = body;
    approval.auditTrail.push({
      at: this.now().toISOString(),
      actor: 'user',
      text: 'Entwurf geändert',
    });
    return this.respond(approval);
  }

  // Tasks --------------------------------------------------------------------

  async getTasks(workspaceId: ID, range: TaskRange): Promise<Task[]> {
    const now = this.now();
    const tasks = this.db.tasks.filter(
      (t) => t.workspaceId === workspaceId && isInRange(t, range, now),
    );
    return this.respond(tasks);
  }

  async updateTask(taskId: ID, patch: TaskPatch): Promise<Task> {
    const task = this.find(this.db.tasks, taskId, 'Aufgabe');
    Object.assign(task, patch);
    if (patch.status === 'done') task.completedAt = this.now().toISOString();
    else if (patch.status) delete task.completedAt;
    return this.respond(task);
  }

  async confirmTask(taskId: ID): Promise<Task> {
    const task = this.find(this.db.tasks, taskId, 'Aufgabe');
    task.isDraft = false;
    return this.respond(task);
  }

  async discardTask(taskId: ID): Promise<void> {
    this.find(this.db.tasks, taskId, 'Aufgabe');
    this.db.tasks = this.db.tasks.filter((t) => t.id !== taskId);
    return this.respond(undefined);
  }

  // Flows --------------------------------------------------------------------

  async getFlows(): Promise<Flow[]> {
    return this.respond(this.db.flows);
  }

  async updateFlow(flowId: ID, patch: FlowPatch): Promise<Flow> {
    const flow = this.find(this.db.flows, flowId, 'Flow');
    Object.assign(flow, patch);
    return this.respond(flow);
  }

  async getFlowhub(): Promise<FlowTemplate[]> {
    return this.respond(this.db.templates);
  }

  async adoptTemplate(templateId: ID): Promise<Flow> {
    const template = this.find(this.db.templates, templateId, 'Vorlage');
    if (template.adopted)
      throw new ApiError('Vorlage ist bereits übernommen', 409, 'already_adopted');
    template.adopted = true;
    template.adoptions += 1;
    const flow: Flow = {
      id: this.newId('f'),
      name: template.name,
      kind: 'hub',
      trigger: template.description,
      instruction: `Vorlage „${template.name}“ aus dem Flowhub.`,
      steps: [],
      writesExternally: [],
      costPerRun: null,
      enabled: true,
      lastRun: null,
    };
    this.db.flows.push(flow);
    return this.respond(flow);
  }

  // Network and profile ------------------------------------------------------

  async getContactGraph(): Promise<ContactGraph> {
    return this.respond(this.db.graph);
  }

  async getProfile(): Promise<Profile> {
    return this.respond(this.db.profile);
  }

  async confirmFact(factId: ID): Promise<void> {
    this.find(this.db.profile.facts, factId, 'Fakt').status = 'confirmed';
    return this.respond(undefined);
  }

  async rejectFact(factId: ID): Promise<void> {
    this.find(this.db.profile.facts, factId, 'Fakt');
    this.db.profile.facts = this.db.profile.facts.filter((f) => f.id !== factId);
    return this.respond(undefined);
  }

  // Settings -----------------------------------------------------------------

  async getAccounts(): Promise<ConnectedAccount[]> {
    return this.respond(this.db.accounts);
  }

  async connectAccount(accountId: ID): Promise<ConnectedAccount> {
    const account = this.find(this.db.accounts, accountId, 'Account');
    account.connected = true;
    return this.respond(account);
  }

  async disconnectAccount(accountId: ID): Promise<ConnectedAccount> {
    const account = this.find(this.db.accounts, accountId, 'Account');
    account.connected = false;
    return this.respond(account);
  }

  async getSettings(): Promise<Settings> {
    return this.respond(this.db.settings);
  }

  async updateSettings(patch: SettingsPatch): Promise<Settings> {
    this.db.settings = { ...this.db.settings, ...patch };
    return this.respond(this.db.settings);
  }

  async getBilling(): Promise<Billing> {
    return this.respond(this.db.billing);
  }
}

/**
 * today: due today or overdue. week: due within the next seven days or overdue. all: everything.
 * Drafts ("neu erkannt") are always included so they can be confirmed from any filter.
 */
export function isInRange(task: Task, range: TaskRange, now: Date): boolean {
  if (range === 'all' || task.isDraft) return true;
  if (!task.due) return false;
  const diff = daysBetween(now, parseISODate(task.due));
  if (diff < 0 && task.status === 'done') return false;
  return range === 'today' ? diff <= 0 : diff < 7;
}
