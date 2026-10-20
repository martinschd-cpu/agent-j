import type { Approval, CardPart, Chat, Flow, ID } from '../types';
import type { MockDb } from './seed';
import {
  daysBetween,
  formatWeekdayLong,
  nextWeekday,
  parseISODate,
  parseWeekday,
  toISODate,
  weekdayName,
} from '@/lib/dates';
import { numberWord } from '@/lib/format';

/** What the simulated agent does with a user message. Effects are already applied to the db. */
export interface PlannedReply {
  steps: string[];
  text: string;
  card?: CardPart;
  approval?: Approval;
}

interface ReplyContext {
  db: MockDb;
  chat: Chat;
  now: Date;
  newId: (prefix: string) => ID;
}

/** Port of `reply()` from clickdummy v3, with real side effects on the mock database. */
export function planReply(input: string, ctx: ReplyContext): PlannedReply {
  const low = input.toLowerCase();
  if (/schick|mail|schreib|poste|sende/.test(low)) return draftMessage(input, ctx);
  if (/verschieb/.test(low)) return moveTask(input, ctx);
  if (/jeden|flow|regelmäßig|immer wenn/.test(low)) return createFlow(input, ctx);
  if (/über mich|weißt du|profil/.test(low)) {
    const facts = ctx.db.profile.facts.filter((f) => f.status !== 'pending').length;
    return {
      steps: [`Wissen geladen · ${facts} Fakten`],
      text: 'Hier ist, was ich über dich weiß, jeweils mit Quelle.',
      card: { type: 'card', card: 'profile', title: 'Über mich', subtitle: `${facts} Fakten` },
    };
  }
  if (/kontakt|netzwerk|mama|sophie|anna|wer ist/.test(low)) {
    const { contacts } = ctx.db.graph;
    const named =
      contacts.find((c) => low.includes(c.name.toLowerCase().split(' ')[0] ?? '')) ??
      contacts.find((c) => c.id === 'mama');
    return {
      steps: [`Kontakte durchsucht · ${contacts.length} Personen`],
      text: 'Ich habe dir dein Netzwerk geöffnet.',
      card: {
        type: 'card',
        card: 'network',
        refId: named?.id,
        title: 'Netzwerk',
        subtitle: `${contacts.length} Personen`,
      },
    };
  }
  if (/aufgabe|heute|woche|todo|steht an/.test(low)) {
    const open = ctx.db.tasks.filter(
      (t) => t.workspaceId === ctx.chat.workspaceId && !t.isDraft && t.status !== 'done',
    );
    return {
      steps: ['Kalender gelesen · 2 Termine', `Aufgaben geprüft · ${open.length} offen`],
      text: 'Hier sind deine Aufgaben.',
      card: { type: 'card', card: 'tasks', title: 'Aufgaben', subtitle: 'nach Zeitraum gefiltert' },
    };
  }
  return {
    steps: ['Nachricht verstanden'],
    text: 'Verstanden. Ich kümmere mich darum und melde mich unter „Requests“, falls ich etwas von dir brauche.',
  };
}

const RECIPIENT = /\b(?:[Aa]n|[Hh]errn?|[Ff]rau)\s+((?:Dr\.\s+)?[A-ZÄÖÜ][\wäöüß-]*)/;

function draftMessage(input: string, { db, chat, now, newId }: ReplyContext): PlannedReply {
  const low = input.toLowerCase();
  const channel = input.match(/#[\w-]+/)?.[0];
  const system = channel || /slack|poste/.test(low) ? 'Slack' : 'Gmail';
  const contact = db.graph.contacts.find((c) => {
    const key = c.name.replace(/^(Dr\.|Herr|Firma)\s+/, '');
    return input.includes(key);
  });
  const named = input.match(RECIPIENT);
  const recipient =
    channel ??
    contact?.name ??
    (named?.[1]
      ? /^[Hh]errn?$/.test(named[0].split(/\s+/)[0] ?? '')
        ? `Herr ${named[1]}`
        : named[1]
      : 'Empfänger offen');

  const approval: Approval = {
    id: newId('a'),
    workspaceId: chat.workspaceId,
    chatId: chat.id,
    system,
    recipient,
    body: input,
    status: 'pending',
    auditTrail: [
      { at: now.toISOString(), actor: 'user', text: `Auftrag im Chat „${chat.title}“` },
      { at: now.toISOString(), actor: 'agent', text: 'Entwurf erstellt' },
    ],
  };
  db.approvals.push(approval);
  const what = system === 'Slack' ? `Nachricht an ${recipient}` : `E-Mail an ${recipient}`;
  db.requests.unshift({
    id: newId('r'),
    workspaceId: chat.workspaceId,
    kind: 'approval',
    text: `${what} senden`,
    approvalId: approval.id,
    relatedChatId: chat.id,
    createdAt: now.toISOString(),
    options: [
      { label: 'Freigeben', action: { type: 'approve' }, confirmation: `${what} gesendet` },
      { label: 'Ansehen', action: { type: 'open_chat' } },
    ],
  });
  return {
    steps: ['Empfänger in Kontakte gefunden', 'Entwurf geschrieben'],
    text: 'Hier ist mein Entwurf. Ich sende erst, wenn du freigibst.',
    approval,
  };
}

function moveTask(input: string, { db, chat, now }: ReplyContext): PlannedReply {
  const low = input.toLowerCase();
  const target = nextWeekday(now, parseWeekday(input) ?? 4);
  const dayName = formatWeekdayLong(target);
  const candidates = db.tasks.filter(
    (t) => t.workspaceId === chat.workspaceId && !t.isDraft && t.status !== 'done',
  );
  const words = (title: string) =>
    title
      .toLowerCase()
      .split(/[\s-]+/)
      .filter((w) => w.length > 3);
  const task =
    candidates.find((t) => words(t.title).some((w) => low.includes(w))) ??
    candidates.find((t) => t.due && daysBetween(now, parseISODate(t.due)) === 0);
  if (!task) {
    return {
      steps: ['Aufgaben geprüft'],
      text: 'Ich habe keine passende offene Aufgabe gefunden. Welche meinst du?',
    };
  }
  task.due = toISODate(target);
  delete task.dueTime;
  const leftToday = candidates.filter(
    (t) => t.due && daysBetween(now, parseISODate(t.due)) === 0,
  ).length;
  return {
    steps: ['Aufgaben geprüft', `Kalender für ${dayName} geprüft · 1 Termin`],
    text: `Erledigt. „${task.title}“ steht jetzt am ${dayName}. Heute ${leftToday === 1 ? 'bleibt dir damit eine Aufgabe' : `bleiben dir damit ${numberWord(leftToday)} Aufgaben`}.`,
  };
}

function createFlow(input: string, { db, newId }: ReplyContext): PlannedReply {
  const dow = parseWeekday(input);
  const hour = input.match(/(\d{1,2})(?::(\d{2}))?\s*uhr/i);
  const time = hour ? `${hour[1]?.padStart(2, '0')}:${hour[2] ?? '00'}` : undefined;
  const day = dow === undefined ? 'täglich' : `${weekdayName(dow).toLowerCase()}s`;
  const trigger = time ? `${day} um ${time}` : day;

  const flow: Flow = {
    id: newId('f'),
    name: 'Neuer Flow',
    kind: 'custom',
    trigger,
    instruction: input,
    steps: [
      { label: 'Daten sammeln', tool: 'Agent-J' },
      { label: 'Zusammenfassung schreiben', tool: 'Agent-J' },
      { label: 'Ergebnis senden', tool: 'Push' },
    ],
    writesExternally: [],
    costPerRun: null,
    enabled: false,
    lastRun: null,
  };
  db.flows.push(flow);
  return {
    steps: ['Beschreibung verstanden', `Ablauf zusammengestellt · ${flow.steps.length} Schritte`],
    text: 'Daraus mache ich einen Flow. Schau ihn dir rechts an, du kannst ihn sofort aktivieren.',
    card: {
      type: 'card',
      card: 'flows',
      refId: flow.id,
      title: `Flow: ${flow.name}`,
      subtitle: 'neuer Entwurf · pausiert',
    },
  };
}
