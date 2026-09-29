export type Area = 'arbeit' | 'familie' | 'gesundheit' | 'finanzen' | 'haushalt' | 'freizeit';
export type Source = 'chat' | 'email' | 'kalender' | 'whatsapp' | 'slack';
export type Status = 'todo' | 'progress' | 'blocked' | 'done';

export interface Task {
  id: string;
  title: string;
  area: Area;
  source: Source;
  /** Where exactly Agent-J picked the task up, e.g. "E-Mail von Frau Kaya, 24.09." */
  sourceDetail: string;
  status: Status;
  due?: string;
  /** Free-text dependency shown in the "Abhängig von" column. */
  dependsOn?: string;
  personId?: string;
  chatId?: string;
  notes?: string;
}

export interface Message {
  role: 'user' | 'agent';
  text: string;
  /** Task ids Agent-J extracted from this message. */
  taskIds?: string[];
}

export type ChatGroup = 'heute' | 'gestern' | 'woche' | 'aelter';

export interface Chat {
  id: string;
  title: string;
  group: ChatGroup;
  messages: Message[];
}

export type OutputChannel = 'push' | 'chat' | 'aufgabe' | 'email';

export interface Agent {
  id: string;
  kind: 'scheduled' | 'agent';
  name: string;
  description: string;
  triggerType: 'zeitplan' | 'ereignis';
  trigger: string;
  instruction: string;
  tools: Source[];
  outputs: OutputChannel[];
  enabled: boolean;
  lastRun: string;
  nextRun?: string;
  health: 'ok' | 'warn';
}

export type PersonGroup = 'familie' | 'freunde' | 'arbeit' | 'netzwerk';

export interface Person {
  id: string;
  name: string;
  group: PersonGroup;
  relation: string;
  lastContact: string;
  /** 1 (selten) … 5 (täglich) – drives node size in the graph. */
  frequency: number;
  note?: string;
}

export interface Fact {
  id: string;
  text: string;
  source: Source;
  learned: string;
}

export interface Model {
  id: string;
  name: string;
  description: string;
  tag?: string;
}
