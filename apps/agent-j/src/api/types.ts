/**
 * Contract between the Agent-J app and its backend.
 *
 * Every screen reads and writes data only through these types and the AgentJApi interface.
 * Timestamps are ISO 8601 strings, dates without time are `YYYY-MM-DD`.
 */

export type ID = string;
export type ISODateTime = string;
export type ISODate = string;

// ---------------------------------------------------------------------------
// Workspaces and user
// ---------------------------------------------------------------------------

export type WorkspaceName = 'Privat' | 'Arbeit';

export interface Workspace {
  id: ID;
  name: WorkspaceName;
  description?: string;
}

export interface User {
  id: ID;
  firstName: string;
  displayName: string;
  email: string;
  initials: string;
  twoFactorEnabled: boolean;
}

// ---------------------------------------------------------------------------
// Chats and messages
// ---------------------------------------------------------------------------

/** Content types of the side panel. */
export type PanelType = 'tasks' | 'flows' | 'network' | 'profile';

export interface PanelRef {
  type: PanelType;
  /** e.g. a flow id or a contact id that should be selected in the panel. */
  refId?: ID;
}

export interface Chat {
  id: ID;
  workspaceId: ID;
  title: string;
  updatedAt: ISODateTime;
  defaultPanel?: PanelRef;
}

export interface TextPart {
  type: 'text';
  text: string;
}

/** A card in an agent message that opens the matching side panel. */
export interface CardPart {
  type: 'card';
  card: PanelType;
  refId?: ID;
  title: string;
  subtitle?: string;
}

export interface ApprovalPart {
  type: 'approval';
  approvalId: ID;
}

export interface BriefingRow {
  label: string;
  value: string;
}

export interface BriefingPart {
  type: 'briefing';
  title: string;
  subtitle?: string;
  rows: BriefingRow[];
  firstStep?: { label: string; taskId: ID };
}

export type MessagePart = TextPart | CardPart | ApprovalPart | BriefingPart;

export type MessageRole = 'user' | 'agent';

export interface Message {
  id: ID;
  chatId: ID;
  role: MessageRole;
  createdAt: ISODateTime;
  parts: MessagePart[];
}

// ---------------------------------------------------------------------------
// Chat streaming
// ---------------------------------------------------------------------------

export type ChatStreamEvent =
  /** A work step, e.g. "Kalender gelesen · 2 Termine". Same id = update of that step. */
  | { type: 'step'; id: string; label: string; status: 'running' | 'done' }
  /** A piece of the agent's answer text. */
  | { type: 'delta'; text: string }
  | { type: 'card'; part: CardPart }
  | { type: 'approval'; approval: Approval }
  /** The stream is finished; `message` is the persisted agent message. */
  | { type: 'done'; message: Message }
  | { type: 'error'; message: string };

export interface SendMessageOptions {
  signal?: AbortSignal;
}

// ---------------------------------------------------------------------------
// Approvals (Human in the Loop)
// ---------------------------------------------------------------------------

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface AuditEntry {
  at: ISODateTime;
  actor: 'agent' | 'user' | 'system';
  text: string;
}

export interface Approval {
  id: ID;
  workspaceId: ID;
  chatId?: ID;
  /** External system that would be written to: Gmail, Slack, Kalender ... */
  system: string;
  recipient: string;
  body: string;
  status: ApprovalStatus;
  auditTrail: AuditEntry[];
}

// ---------------------------------------------------------------------------
// Requests (dialog queue)
// ---------------------------------------------------------------------------

export type RequestKind = 'approval' | 'question' | 'hint';

export type RequestAction =
  /** Approve the linked approval. */
  | { type: 'approve' }
  /** Reject the linked approval. */
  | { type: 'reject' }
  /** Open the related chat, nothing is answered. */
  | { type: 'open_chat' }
  /** Answer a question or hint with this value. */
  | { type: 'answer'; value: string };

export interface RequestOption {
  label: string;
  action: RequestAction;
  /** Short confirmation shown after the answer, e.g. "Zahnarzttermin zugesagt". */
  confirmation?: string;
}

export interface AgentRequest {
  id: ID;
  workspaceId: ID;
  kind: RequestKind;
  text: string;
  options: RequestOption[];
  relatedChatId?: ID;
  approvalId?: ID;
  createdAt: ISODateTime;
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export type TaskStatus = 'open' | 'in_progress' | 'waiting' | 'done';
export type TaskSource = 'Gmail' | 'Chat' | 'Kalender' | 'Slack' | 'WhatsApp';
export type TaskRange = 'today' | 'week' | 'all';

export interface Task {
  id: ID;
  workspaceId: ID;
  title: string;
  status: TaskStatus;
  /** Newly detected by Agent-J, not yet confirmed by the user. */
  isDraft: boolean;
  due?: ISODate;
  /** Optional time of day, `HH:mm`. */
  dueTime?: string;
  waitingFor?: string;
  progress?: { done: number; total: number };
  source: TaskSource;
  sourceRef?: string;
  completedAt?: ISODateTime;
}

export type TaskPatch = Partial<Pick<Task, 'title' | 'status' | 'due' | 'dueTime' | 'waitingFor'>>;

// ---------------------------------------------------------------------------
// Flows
// ---------------------------------------------------------------------------

export type FlowKind = 'standard' | 'custom' | 'hub';

export interface FlowStep {
  label: string;
  tool: string;
}

export interface Flow {
  id: ID;
  name: string;
  kind: FlowKind;
  /** Human readable trigger, e.g. "werktags um 07:00". */
  trigger: string;
  /** The instruction in natural language. */
  instruction: string;
  steps: FlowStep[];
  /** Systems the flow writes to. Empty = writes nothing. Every write still needs an approval. */
  writesExternally: string[];
  /** Estimated cost per run in EUR, null if unknown. */
  costPerRun: number | null;
  enabled: boolean;
  lastRun: ISODateTime | null;
}

export type FlowPatch = Partial<Pick<Flow, 'enabled' | 'name'>>;

export interface FlowTemplate {
  id: ID;
  name: string;
  description: string;
  adoptions: number;
  adopted: boolean;
}

// ---------------------------------------------------------------------------
// Network
// ---------------------------------------------------------------------------

export type ContactGroup = 'Familie' | 'Arbeit' | 'Freunde' | 'Dienstleister';

/** Optional layout hint for the graph, both values from 0 to 1. */
export interface GraphPoint {
  x: number;
  y: number;
}

export interface Contact {
  id: ID;
  name: string;
  role: string;
  group: ContactGroup;
  lastContact: string;
  openItem?: string;
  note?: string;
  source: string;
  layout?: GraphPoint;
}

export interface Relation {
  fromId: ID;
  toId: ID;
}

export interface ContactGraph {
  /** The user in the center of the graph. */
  me: { id: ID; name: string; initials: string; layout?: GraphPoint };
  contacts: Contact[];
  relations: Relation[];
}

// ---------------------------------------------------------------------------
// Profile ("Über mich")
// ---------------------------------------------------------------------------

export type FactStatus = 'confirmed' | 'derived' | 'pending';

export interface ProfileFact {
  id: ID;
  label: string;
  value: string;
  source: string;
  sourceQuote?: string;
  status: FactStatus;
  confidence?: number;
}

export interface ProfileRole {
  label: string;
  workspaceId: ID;
}

export interface Profile {
  facts: ProfileFact[];
  roles: ProfileRole[];
  preferences: string[];
}

// ---------------------------------------------------------------------------
// Accounts and settings
// ---------------------------------------------------------------------------

export interface ConnectedAccount {
  id: ID;
  name: string;
  workspaceId: ID;
  connected: boolean;
}

export interface Settings {
  readAloud: boolean;
  collectQuestions: boolean;
  pushForApprovals: boolean;
  quietHours: { enabled: boolean; from: string; to: string };
  language: 'de';
}

export type SettingsPatch = Partial<Settings>;

export interface Billing {
  monthLabel: string;
  spentEur: number | null;
  limitEur: number | null;
  paymentMethod: string | null;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
