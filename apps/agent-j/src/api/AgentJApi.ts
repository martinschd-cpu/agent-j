import type {
  AgentRequest,
  Approval,
  Billing,
  Chat,
  ChatStreamEvent,
  ConnectedAccount,
  ContactGraph,
  Flow,
  FlowPatch,
  FlowTemplate,
  ID,
  Message,
  Profile,
  RequestAction,
  SendMessageOptions,
  Settings,
  SettingsPatch,
  Task,
  TaskPatch,
  TaskRange,
  User,
  Workspace,
} from './types';

/**
 * The only way the app talks to a backend. Implemented by MockApi (in-app sample data)
 * and HttpApi (Hermes, missing parts fall back to MockApi).
 */
export interface AgentJApi {
  // Account
  getMe(): Promise<User>;
  getWorkspaces(): Promise<Workspace[]>;

  // Chats
  getChats(workspaceId: ID): Promise<Chat[]>;
  createChat(workspaceId: ID): Promise<Chat>;
  getMessages(chatId: ID): Promise<Message[]>;
  /**
   * Sends a user message and streams the agent's work steps and answer.
   * The user message is persisted before the first event is emitted.
   */
  sendMessage(
    chatId: ID,
    text: string,
    options?: SendMessageOptions,
  ): AsyncIterable<ChatStreamEvent>;

  // Requests
  getRequests(workspaceId: ID): Promise<AgentRequest[]>;
  answerRequest(requestId: ID, action: RequestAction): Promise<void>;

  // Approvals
  getApproval(approvalId: ID): Promise<Approval>;
  approve(approvalId: ID): Promise<Approval>;
  reject(approvalId: ID): Promise<Approval>;
  updateApprovalDraft(approvalId: ID, body: string): Promise<Approval>;

  // Tasks
  getTasks(workspaceId: ID, range: TaskRange): Promise<Task[]>;
  updateTask(taskId: ID, patch: TaskPatch): Promise<Task>;
  confirmTask(taskId: ID): Promise<Task>;
  discardTask(taskId: ID): Promise<void>;

  // Flows
  getFlows(): Promise<Flow[]>;
  updateFlow(flowId: ID, patch: FlowPatch): Promise<Flow>;
  getFlowhub(): Promise<FlowTemplate[]>;
  adoptTemplate(templateId: ID): Promise<Flow>;

  // Network and profile
  getContactGraph(): Promise<ContactGraph>;
  getProfile(): Promise<Profile>;
  confirmFact(factId: ID): Promise<void>;
  rejectFact(factId: ID): Promise<void>;

  // Settings
  getAccounts(): Promise<ConnectedAccount[]>;
  connectAccount(accountId: ID): Promise<ConnectedAccount>;
  disconnectAccount(accountId: ID): Promise<ConnectedAccount>;
  getSettings(): Promise<Settings>;
  updateSettings(patch: SettingsPatch): Promise<Settings>;
  getBilling(): Promise<Billing>;
}
