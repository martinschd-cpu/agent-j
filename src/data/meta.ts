import type { IconName } from '../components/Icon';
import type { Area, OutputChannel, PersonGroup, Source, Status } from './types';

export const AREAS: Record<Area, { label: string; icon: IconName }> = {
  arbeit: { label: 'Arbeit', icon: 'briefcase' },
  familie: { label: 'Familie', icon: 'users' },
  gesundheit: { label: 'Gesundheit', icon: 'heart' },
  finanzen: { label: 'Finanzen', icon: 'euro' },
  haushalt: { label: 'Haushalt', icon: 'home' },
  freizeit: { label: 'Freizeit', icon: 'music' },
};

export const SOURCES: Record<Source, { label: string; icon: IconName }> = {
  chat: { label: 'Chat', icon: 'chat' },
  email: { label: 'E-Mail', icon: 'mail' },
  kalender: { label: 'Kalender', icon: 'calendar' },
  whatsapp: { label: 'WhatsApp', icon: 'phone' },
  slack: { label: 'Slack', icon: 'hash' },
};

export const STATUSES: Array<{ id: Status; label: string; short: string }> = [
  { id: 'todo', label: 'Todo', short: 'Todo' },
  { id: 'progress', label: 'In Progress', short: 'In Arbeit' },
  { id: 'blocked', label: 'Abhängig von', short: 'Abhängig' },
  { id: 'done', label: 'Erledigt', short: 'Erledigt' },
];

export const OUTPUTS: Record<OutputChannel, { label: string; icon: IconName }> = {
  push: { label: 'Push', icon: 'bell' },
  chat: { label: 'Chat', icon: 'chat' },
  aufgabe: { label: 'Aufgabe', icon: 'kanban' },
  email: { label: 'E-Mail', icon: 'mail' },
};

export const PERSON_GROUPS: Record<PersonGroup, { label: string }> = {
  familie: { label: 'Familie' },
  freunde: { label: 'Freunde' },
  arbeit: { label: 'Arbeit' },
  netzwerk: { label: 'Netzwerk' },
};
