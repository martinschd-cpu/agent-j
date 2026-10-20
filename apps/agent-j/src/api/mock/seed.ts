import type {
  AgentRequest,
  Approval,
  Billing,
  Chat,
  ConnectedAccount,
  ContactGraph,
  Flow,
  FlowTemplate,
  ID,
  ISODateTime,
  Message,
  MessagePart,
  Profile,
  Settings,
  Task,
  User,
  Workspace,
} from '../types';
import {
  addDays,
  formatDayMonthLong,
  formatDayShort,
  formatMonth,
  formatWeekdayLong,
  isoWeek,
  nextWeekday,
  toISODate,
} from '@/lib/dates';

/** The complete in-memory state of the MockApi. */
export interface MockDb {
  user: User;
  workspaces: Workspace[];
  chats: Chat[];
  messages: Message[];
  approvals: Approval[];
  requests: AgentRequest[];
  tasks: Task[];
  flows: Flow[];
  templates: FlowTemplate[];
  graph: ContactGraph;
  profile: Profile;
  accounts: ConnectedAccount[];
  settings: Settings;
  billing: Billing;
}

export const WS_PRIVAT = 'privat';
export const WS_ARBEIT = 'arbeit';

/**
 * Sample data from clickdummy v3 (docs/clickdummy-v3/Main.dc.html), with every date relative
 * to `now` so the app always looks like "today".
 */
export function createSeed(now: Date): MockDb {
  const hoursAgo = (h: number): ISODateTime =>
    new Date(now.getTime() - h * 3_600_000).toISOString();
  const minutesAgo = (m: number): ISODateTime => new Date(now.getTime() - m * 60_000).toISOString();
  const today = toISODate(now);
  const yesterday = addDays(now, -1);
  const tomorrow = addDays(now, 1);
  const inDays = (n: number) => toISODate(addDays(now, n));
  const weekday = (dow: number) => toISODate(nextWeekday(now, dow));
  const at = (d: Date, hh: number, mm = 0) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm).toISOString();

  const mamaBirthday = addDays(now, 10);
  const lastCallMama = addDays(now, -9);
  const factSourceDay = addDays(now, -4);

  const messages: Message[] = [];
  let msgSeq = 0;
  const msg = (
    chatId: ID,
    role: Message['role'],
    createdAt: ISODateTime,
    ...parts: MessagePart[]
  ) => {
    messages.push({ id: `${chatId}-m${msgSeq++}`, chatId, role, createdAt, parts });
  };
  const text = (t: string): MessagePart => ({ type: 'text', text: t });

  const approvals: Approval[] = [
    {
      id: 'a-adler',
      workspaceId: WS_PRIVAT,
      chatId: 'c1',
      system: 'Gmail',
      recipient: 'Herr Adler',
      body: 'Guten Tag Herr Adler,\nkönnten Sie mir die Nebenkostenabrechnung für 2025 bis Ende Oktober zukommen lassen?\nViele Grüße, Martin',
      status: 'pending',
      auditTrail: [
        { at: hoursAgo(25), actor: 'user', text: 'Auftrag im Chat „Wochenplanung“' },
        { at: hoursAgo(25), actor: 'agent', text: 'Entwurf erstellt' },
      ],
    },
    {
      id: 'a-produkt',
      workspaceId: WS_ARBEIT,
      chatId: 'w2',
      system: 'Slack',
      recipient: '#produkt',
      body: 'Kurzes Update: Der Onboarding-Flow ist im Review, Feedback bitte bis Mittwoch.',
      status: 'pending',
      auditTrail: [
        { at: hoursAgo(27), actor: 'user', text: 'Auftrag im Chat „Update fürs Team“' },
        { at: hoursAgo(27), actor: 'agent', text: 'Entwurf erstellt' },
      ],
    },
  ];

  const chats: Chat[] = [
    {
      id: 'c0',
      workspaceId: WS_PRIVAT,
      title: `Guten Morgen, Martin`,
      updatedAt: hoursAgo(1),
      defaultPanel: { type: 'tasks' },
    },
    {
      id: 'c1',
      workspaceId: WS_PRIVAT,
      title: `Wochenplanung KW ${isoWeek(now)}`,
      updatedAt: hoursAgo(25),
      defaultPanel: { type: 'tasks' },
    },
    {
      id: 'c5',
      workspaceId: WS_PRIVAT,
      title: `Tagesabschluss ${formatWeekdayLong(yesterday)}`,
      updatedAt: hoursAgo(26),
    },
    {
      id: 'c2',
      workspaceId: WS_PRIVAT,
      title: 'Morgenbriefing einrichten',
      updatedAt: hoursAgo(28),
      defaultPanel: { type: 'flows', refId: 'f1' },
    },
    {
      id: 'c3',
      workspaceId: WS_PRIVAT,
      title: 'Geburtstag Mama',
      updatedAt: hoursAgo(24 * 4),
      defaultPanel: { type: 'network', refId: 'mama' },
    },
    {
      id: 'c4',
      workspaceId: WS_PRIVAT,
      title: 'Was weißt du über mich?',
      updatedAt: hoursAgo(24 * 5),
      defaultPanel: { type: 'profile' },
    },
    {
      id: 'w1',
      workspaceId: WS_ARBEIT,
      title: 'Q4-Roadmap',
      updatedAt: hoursAgo(2),
      defaultPanel: { type: 'tasks' },
    },
    { id: 'w2', workspaceId: WS_ARBEIT, title: 'Update fürs Team', updatedAt: hoursAgo(27) },
  ];

  msg(
    'c0',
    'agent',
    at(now, 7),
    text(`Guten Morgen, Martin. Hier ist dein ${formatWeekdayLong(now)}.`),
    {
      type: 'briefing',
      title: `Morgenbriefing · ${formatDayShort(now)}`,
      subtitle: 'aus Kalender, Aufgaben und Gmail',
      rows: [
        { label: 'Termine heute', value: '14:30 Call mit Dr. Hofmann, 18:00 Laufen' },
        { label: 'Fällig heute', value: 'Zahnarzttermin bestätigen, Einkauf Wochenmarkt' },
        { label: 'Wartet auf dich', value: '1 Freigabe und 2 Fragen unter „Requests“' },
      ],
      firstStep: { label: 'Zahnarzttermin bestätigen, dauert 2 Minuten', taskId: 't2' },
    },
  );

  msg(
    'c1',
    'user',
    hoursAgo(25.5),
    text('Was steht diese Woche an? Donnerstag ist das Onboarding, Freitag der Elternabend.'),
  );
  msg(
    'c1',
    'agent',
    hoursAgo(25.5),
    text(
      'Diese Woche hast du vier feste Termine und neun offene Aufgaben. Mein Vorschlag:\n\nMo: Steuerunterlagen sortieren\nDi: Zahnarzt bestätigen und Krimi-Dinner buchen\nMi: Zahnarzt um 08:30\nDo: Onboarding, sonst nichts\nFr: Elternabend, vorher Fragen notieren',
    ),
    {
      type: 'card',
      card: 'tasks',
      title: 'Aufgaben diese Woche',
      subtitle: '9 offen · 2 neu erkannt',
    },
  );
  msg(
    'c1',
    'user',
    hoursAgo(25),
    text(
      'Schick Herrn Adler eine kurze Mail, dass ich die Nebenkostenabrechnung bis Ende Oktober brauche.',
    ),
  );
  msg(
    'c1',
    'agent',
    hoursAgo(25),
    text('Hier ist der Entwurf. Ich sende erst, wenn du freigibst.'),
    {
      type: 'approval',
      approvalId: 'a-adler',
    },
  );

  msg('c5', 'agent', at(yesterday, 18, 30), text('Starker Tag, Martin. Hier ist dein Abschluss.'), {
    type: 'briefing',
    title: `Tagesabschluss · ${formatDayShort(yesterday)}`,
    subtitle: 'Bilanz und Ausblick',
    rows: [
      { label: 'Erledigt', value: '5 von 6 Aufgaben' },
      { label: 'Verschoben', value: 'Winterreifen-Termin auf Donnerstag' },
      { label: 'Morgen', value: '14:30 Call mit Dr. Hofmann, Zahnarzt bestätigen' },
    ],
  });

  msg('c2', 'user', hoursAgo(28), text('Ich will jeden Morgen wissen, was ansteht.'));
  msg(
    'c2',
    'agent',
    hoursAgo(28),
    text(
      'Dafür gibt es den Flow Morgenbriefing. Ich habe ihn so eingerichtet: jeden Werktag um 07:00 deine Termine, fälligen Aufgaben und wichtigen E-Mails, höchstens zehn Zeilen, als Push-Nachricht.',
    ),
    {
      type: 'card',
      card: 'flows',
      refId: 'f1',
      title: 'Flow: Morgenbriefing',
      subtitle: 'werktags 07:00 · aktiv',
    },
  );

  msg(
    'c3',
    'user',
    hoursAgo(24 * 4),
    text(`Mama hat am ${formatDayMonthLong(mamaBirthday)} Geburtstag. Was schenken wir?`),
  );
  msg(
    'c3',
    'agent',
    hoursAgo(24 * 4),
    text(
      `Sie gärtnert gerne und liest Krimis. Drei Ideen:\n\n1. Hochbeet-Set für den Balkon\n2. Krimi-Dinner für zwei\n3. Gutschein für ihre Gärtnerei\n\nEuer letztes Telefonat war am ${formatDayMonthLong(lastCallMama)}.`,
    ),
    {
      type: 'card',
      card: 'network',
      refId: 'mama',
      title: 'Kontakt: Mama',
      subtitle: `Familie · Geburtstag ${formatDayShort(mamaBirthday).slice(4)}`,
    },
  );

  msg('c4', 'user', hoursAgo(24 * 5), text('Was weißt du eigentlich über mich?'));
  msg(
    'c4',
    'agent',
    hoursAgo(24 * 5),
    text(
      'Einiges, und alles davon kannst du ändern oder löschen. Zu jedem Punkt siehst du, woher ich ihn habe. Drei neue Punkte warten auf deine Bestätigung.',
    ),
    { type: 'card', card: 'profile', title: 'Über mich', subtitle: '142 Fakten · 3 neu gelernt' },
  );

  msg('w1', 'user', hoursAgo(2), text('Fass mir die Slack-Diskussion zur Q4-Roadmap zusammen.'));
  msg(
    'w1',
    'agent',
    hoursAgo(2),
    text(
      'Seit Montag 34 Nachrichten in #produkt. Die Kernpunkte:\n\n1. Anna will den Entwurf bis Donnerstag\n2. Tobias priorisiert die Plattform-Migration\n3. Lea braucht Feedback zum Onboarding-Flow\n\nDie Roadmap steht ganz oben auf deiner Liste.',
    ),
    { type: 'card', card: 'tasks', title: 'Aufgaben Arbeit', subtitle: '4 offen · 1 neu erkannt' },
  );

  msg('w2', 'user', hoursAgo(27), text('Poste ein kurzes Update in #produkt.'));
  msg('w2', 'agent', hoursAgo(27), text('Entwurf ist fertig.'), {
    type: 'approval',
    approvalId: 'a-produkt',
  });

  const requests: AgentRequest[] = [
    {
      id: 'o1',
      workspaceId: WS_PRIVAT,
      kind: 'approval',
      text: 'E-Mail an Herrn Adler zur Nebenkostenabrechnung senden',
      approvalId: 'a-adler',
      relatedChatId: 'c1',
      createdAt: hoursAgo(25),
      options: [
        {
          label: 'Freigeben',
          action: { type: 'approve' },
          confirmation: 'E-Mail an Herrn Adler gesendet',
        },
        { label: 'Ansehen', action: { type: 'open_chat' } },
      ],
    },
    {
      id: 'o2',
      workspaceId: WS_PRIVAT,
      kind: 'question',
      text: `Praxis Dr. Lang bietet ${formatDayShort(tomorrow)}, 08:30 an. Soll ich zusagen?`,
      createdAt: hoursAgo(3),
      options: [
        {
          label: 'Zusagen',
          action: { type: 'answer', value: 'Zusagen' },
          confirmation: 'Zahnarzttermin zugesagt',
        },
        {
          label: 'Anderer Termin',
          action: { type: 'answer', value: 'Anderer Termin' },
          confirmation: 'Ich frage nach einem anderen Termin',
        },
      ],
    },
    {
      id: 'o3',
      workspaceId: WS_PRIVAT,
      kind: 'hint',
      text: 'Firma Meier antwortet seit fünf Tagen nicht. Soll ich nachhaken?',
      createdAt: hoursAgo(5),
      options: [
        {
          label: 'Nachhaken',
          action: { type: 'answer', value: 'Nachhaken' },
          confirmation: 'Nachfrage an Firma Meier als Entwurf erstellt',
        },
        {
          label: 'Ignorieren',
          action: { type: 'answer', value: 'Ignorieren' },
          confirmation: 'Hinweis ausgeblendet',
        },
      ],
    },
    {
      id: 'o4',
      workspaceId: WS_ARBEIT,
      kind: 'approval',
      text: 'Update in #produkt posten',
      approvalId: 'a-produkt',
      relatedChatId: 'w2',
      createdAt: hoursAgo(27),
      options: [
        {
          label: 'Freigeben',
          action: { type: 'approve' },
          confirmation: 'Update in #produkt gepostet',
        },
        { label: 'Ansehen', action: { type: 'open_chat' } },
      ],
    },
    {
      id: 'o5',
      workspaceId: WS_ARBEIT,
      kind: 'question',
      text: 'Mittwoch 09 bis 11 Uhr Fokuszeit für die Roadmap blocken?',
      createdAt: hoursAgo(2),
      options: [
        {
          label: 'Blocken',
          action: { type: 'answer', value: 'Blocken' },
          confirmation: 'Fokuszeit eingetragen',
        },
        {
          label: 'Nein',
          action: { type: 'answer', value: 'Nein' },
          confirmation: 'Kein Block gesetzt',
        },
      ],
    },
  ];

  // Due dates of the week: "Do", "Fr", "Mi" from the clickdummy, always in the coming days.
  const thu = weekday(4);
  const fri = weekday(5);
  const wed = weekday(3);
  const tasks: Task[] = [
    {
      id: 'n1',
      workspaceId: WS_PRIVAT,
      title: 'Rückruf Versicherung wegen Wasserschaden',
      status: 'open',
      isDraft: true,
      source: 'Gmail',
    },
    {
      id: 'n2',
      workspaceId: WS_PRIVAT,
      title: 'Kuchen für das Kita-Fest backen',
      status: 'open',
      isDraft: true,
      source: 'WhatsApp',
    },
    {
      id: 'x0',
      workspaceId: WS_PRIVAT,
      title: 'Mama zurückrufen',
      status: 'done',
      isDraft: false,
      due: today,
      source: 'Chat',
      completedAt: hoursAgo(0.5),
    },
    {
      id: 't2',
      workspaceId: WS_PRIVAT,
      title: 'Zahnarzttermin bestätigen',
      status: 'open',
      isDraft: false,
      due: today,
      source: 'Gmail',
    },
    {
      id: 't1',
      workspaceId: WS_PRIVAT,
      title: 'Krimi-Dinner buchen',
      status: 'open',
      isDraft: false,
      due: today,
      source: 'Chat',
    },
    {
      id: 't4',
      workspaceId: WS_PRIVAT,
      title: 'Winterreifen-Termin buchen',
      status: 'open',
      isDraft: false,
      due: thu,
      source: 'Kalender',
    },
    {
      id: 't5',
      workspaceId: WS_PRIVAT,
      title: 'Fragen für Elternabend notieren',
      status: 'open',
      isDraft: false,
      due: fri,
      source: 'Chat',
    },
    {
      id: 'p1',
      workspaceId: WS_PRIVAT,
      title: 'Einkauf Wochenmarkt',
      status: 'in_progress',
      isDraft: false,
      due: today,
      progress: { done: 5, total: 9 },
      source: 'WhatsApp',
    },
    {
      id: 'p2',
      workspaceId: WS_PRIVAT,
      title: 'Handwerkerangebote vergleichen',
      status: 'in_progress',
      isDraft: false,
      due: wed,
      progress: { done: 2, total: 3 },
      source: 'Gmail',
    },
    {
      id: 'b1',
      workspaceId: WS_PRIVAT,
      title: 'Herbstferien-Unterkunft buchen',
      status: 'waiting',
      isDraft: false,
      due: inDays(3),
      waitingFor: 'Sophie',
      source: 'Chat',
    },
    {
      id: 'b2',
      workspaceId: WS_PRIVAT,
      title: 'Nebenkostenabrechnung prüfen',
      status: 'waiting',
      isDraft: false,
      waitingFor: 'Herrn Adler',
      source: 'Gmail',
    },
    {
      id: 'n3',
      workspaceId: WS_ARBEIT,
      title: 'Feedback zum Onboarding-Flow an Lea',
      status: 'open',
      isDraft: true,
      source: 'Slack',
    },
    {
      id: 'a1',
      workspaceId: WS_ARBEIT,
      title: 'Q4-Roadmap Entwurf erstellen',
      status: 'open',
      isDraft: false,
      due: today,
      source: 'Slack',
    },
    {
      id: 'a2',
      workspaceId: WS_ARBEIT,
      title: 'Jour-fixe-Agenda vorbereiten',
      status: 'open',
      isDraft: false,
      due: today,
      dueTime: '10:00',
      source: 'Kalender',
    },
    {
      id: 'a3',
      workspaceId: WS_ARBEIT,
      title: 'Onboarding-Unterlagen zusammenstellen',
      status: 'in_progress',
      isDraft: false,
      due: wed,
      progress: { done: 3, total: 5 },
      source: 'Chat',
    },
    {
      id: 'a4',
      workspaceId: WS_ARBEIT,
      title: 'Vertrag unterschreiben',
      status: 'waiting',
      isDraft: false,
      due: inDays(4),
      waitingFor: 'HR',
      source: 'Gmail',
    },
  ];

  const flows: Flow[] = [
    {
      id: 'f1',
      name: 'Morgenbriefing',
      kind: 'standard',
      trigger: 'werktags um 07:00',
      instruction:
        'Fass mir jeden Werktag um 07:00 Termine, fällige Aufgaben und wichtige E-Mails zusammen. Höchstens zehn Zeilen, als Push-Nachricht.',
      steps: [
        { label: 'Termine lesen', tool: 'Kalender' },
        { label: 'Fällige Aufgaben holen', tool: 'Aufgaben' },
        { label: 'Wichtige E-Mails finden', tool: 'Gmail' },
        { label: 'Briefing schreiben und senden', tool: 'Push' },
      ],
      writesExternally: [],
      costPerRun: 0.02,
      enabled: true,
      lastRun: at(now, 7),
    },
    {
      id: 'f2',
      name: 'Posteingang-Triage',
      kind: 'standard',
      trigger: 'bei neuer E-Mail',
      instruction:
        'Lies neue E-Mails, erkenne Aufgaben und Fristen und lege sie als „neu erkannt“ in meine Aufgaben.',
      steps: [
        { label: 'Neue E-Mail lesen', tool: 'Gmail' },
        { label: 'Aufgaben erkennen', tool: 'Agent-J' },
        { label: 'Als neu erkannt ablegen', tool: 'Aufgaben' },
      ],
      writesExternally: [],
      costPerRun: 0.01,
      enabled: true,
      lastRun: minutesAgo(12),
    },
    {
      id: 'f3',
      name: 'Rechnungen',
      kind: 'custom',
      trigger: 'bei Rechnung im Posteingang',
      instruction:
        'Leg Rechnungen im Ordner Finanzen ab und merke die Zahlung im Budget vor. Niemals selbst überweisen.',
      steps: [
        { label: 'Rechnung erkennen', tool: 'Gmail' },
        { label: 'PDF ablegen', tool: 'Drive' },
        { label: 'Zahlung vormerken', tool: 'Budget' },
      ],
      writesExternally: ['Drive', 'Budget'],
      costPerRun: 0.03,
      enabled: true,
      lastRun: at(yesterday, 16, 12),
    },
    {
      id: 'f4',
      name: 'Geburtstage',
      kind: 'standard',
      trigger: 'täglich um 08:00',
      instruction:
        'Sag mir eine Woche vorher, wer Geburtstag hat, und schlag eine kurze Nachricht vor.',
      steps: [
        { label: 'Geburtstage prüfen', tool: 'Kontakte' },
        { label: 'Nachricht vorschlagen', tool: 'Chat' },
      ],
      writesExternally: [],
      costPerRun: 0.01,
      enabled: false,
      lastRun: at(addDays(now, -12), 8),
    },
  ];

  const templates: FlowTemplate[] = [
    { id: 'h1', name: 'Wochenrückblick', description: 'sonntags', adoptions: 4050, adopted: false },
    {
      id: 'h2',
      name: 'Abo-Wächter',
      description: 'quartalsweise',
      adoptions: 2870,
      adopted: false,
    },
    {
      id: 'h3',
      name: 'Meeting-Vorbereitung',
      description: 'vor Terminen',
      adoptions: 3410,
      adopted: false,
    },
  ];

  // Positions from the clickdummy graph (420 x 290 px), normalized.
  const pos = (x: number, y: number) => ({ x: x / 420, y: y / 290 });
  const graph: ContactGraph = {
    me: { id: 'me', name: 'Du', initials: 'MS', layout: pos(210, 145) },
    contacts: [
      {
        id: 'sophie',
        name: 'Sophie',
        group: 'Familie',
        role: 'Partnerin',
        lastContact: 'Heute, WhatsApp',
        openItem: 'Herbstferien planen',
        source: 'du, bestätigt',
        note: 'Plant die Herbstferien mit dir. Mag italienische Küche.',
        layout: pos(130, 95),
      },
      {
        id: 'emma',
        name: 'Emma',
        group: 'Familie',
        role: 'Tochter',
        lastContact: 'Heute',
        openItem: 'Elternabend am Freitag',
        source: 'du, bestätigt',
        note: 'Schwimmkurs samstags.',
        layout: pos(78, 52),
      },
      {
        id: 'mama',
        name: 'Mama',
        group: 'Familie',
        role: 'Mutter',
        lastContact: `${formatDayShort(lastCallMama)}, Telefon`,
        openItem: 'Krimi-Dinner buchen',
        source: 'Chat, Kalender',
        note: `Geburtstag am ${formatDayShort(mamaBirthday).slice(4)} Gärtnert gerne, liest Krimis, mag keine Überraschungspartys.`,
        layout: pos(52, 145),
      },
      {
        id: 'jonas',
        name: 'Jonas',
        group: 'Familie',
        role: 'Bruder',
        lastContact: 'vor 2 Wochen',
        source: 'WhatsApp',
        note: 'Wohnt in Leipzig.',
        layout: pos(160, 32),
      },
      {
        id: 'anna',
        name: 'Anna Weber',
        group: 'Arbeit',
        role: 'Teamlead Produkt',
        lastContact: 'Gestern, Slack',
        openItem: 'Roadmap bis Donnerstag',
        source: 'Slack',
        note: 'Jour fixe montags um 10:00.',
        layout: pos(300, 88),
      },
      {
        id: 'tobias',
        name: 'Tobias',
        group: 'Arbeit',
        role: 'CTO',
        lastContact: 'Mo, Meeting',
        source: 'Kalender',
        note: 'Priorisiert die Plattform-Migration.',
        layout: pos(365, 42),
      },
      {
        id: 'lea',
        name: 'Lea',
        group: 'Arbeit',
        role: 'Product Designerin',
        lastContact: 'Gestern, Slack',
        openItem: 'Feedback Onboarding-Flow',
        source: 'Slack',
        note: 'Arbeitet mit dir am Onboarding.',
        layout: pos(378, 130),
      },
      {
        id: 'max',
        name: 'Max',
        group: 'Freunde',
        role: 'Freund',
        lastContact: 'Mi, Laufen',
        source: 'WhatsApp',
        note: 'Laufpartner am Mittwoch.',
        layout: pos(118, 218),
      },
      {
        id: 'julia',
        name: 'Julia',
        group: 'Freunde',
        role: 'Freundin',
        lastContact: 'vor 10 Tagen',
        source: 'WhatsApp',
        note: 'Hat gute Rezepttipps.',
        layout: pos(48, 236),
      },
      {
        id: 'hofmann',
        name: 'Dr. Hofmann',
        group: 'Dienstleister',
        role: 'Steuerberater',
        lastContact: 'Fr, Call',
        openItem: 'Steuerunterlagen bis Ende Oktober',
        source: 'Gmail, abgeleitet',
        note: 'Kontakt meist per E-Mail.',
        layout: pos(262, 222),
      },
      {
        id: 'adler',
        name: 'Herr Adler',
        group: 'Dienstleister',
        role: 'Vermieter',
        lastContact: 'Mo, E-Mail',
        openItem: 'Nebenkostenabrechnung',
        source: 'Gmail',
        note: 'Mail zur Abrechnung wartet auf deine Freigabe.',
        layout: pos(200, 250),
      },
      {
        id: 'meier',
        name: 'Firma Meier',
        group: 'Dienstleister',
        role: 'Handwerk',
        lastContact: 'vor 5 Tagen',
        openItem: 'Angebot Bad fehlt',
        source: 'Gmail',
        note: 'Antwortet seit fünf Tagen nicht.',
        layout: pos(340, 235),
      },
    ],
    relations: (
      [
        ['me', 'sophie'],
        ['me', 'mama'],
        ['me', 'emma'],
        ['me', 'anna'],
        ['me', 'tobias'],
        ['me', 'max'],
        ['me', 'hofmann'],
        ['me', 'adler'],
        ['sophie', 'emma'],
        ['emma', 'mama'],
        ['jonas', 'mama'],
        ['jonas', 'emma'],
        ['anna', 'tobias'],
        ['anna', 'lea'],
        ['tobias', 'lea'],
        ['max', 'julia'],
        ['sophie', 'max'],
        ['hofmann', 'adler'],
        ['adler', 'meier'],
        ['hofmann', 'meier'],
      ] as const
    ).map(([fromId, toId]) => ({ fromId, toId })),
  };

  const profile: Profile = {
    facts: [
      {
        id: 'fa1',
        label: 'Rolle',
        value: 'Product Leader',
        source: 'von dir im Chat',
        status: 'confirmed',
      },
      {
        id: 'fa2',
        label: 'Wohnort',
        value: 'Nürnberg',
        source: 'von dir im Chat',
        status: 'confirmed',
      },
      {
        id: 'fa3',
        label: 'Sprachen',
        value: 'Deutsch, Englisch',
        source: 'aus Gmail',
        status: 'derived',
        confidence: 0.9,
      },
      {
        id: 'fa4',
        label: 'Arbeitszeit',
        value: 'Mo bis Fr, 08:30 bis 18:00',
        source: 'aus Kalender',
        status: 'derived',
        confidence: 0.8,
      },
      {
        id: 'fa5',
        label: 'Sport',
        value: 'Laufen, dreimal pro Woche',
        source: 'von dir im Chat',
        status: 'confirmed',
      },
      {
        id: 'l1',
        label: 'Vorliebe',
        value: 'Du bevorzugst Termine am Vormittag.',
        source: 'aus Chat „Wochenplanung“, gestern',
        status: 'pending',
        confidence: 0.7,
      },
      {
        id: 'l2',
        label: 'Kontakt',
        value: 'Dr. Hofmann ist dein Steuerberater.',
        source: `aus Gmail, ${formatDayShort(factSourceDay)}`,
        status: 'pending',
        confidence: 0.85,
      },
      {
        id: 'l3',
        label: 'Workspace',
        value: 'Im Workspace Arbeit willst du keine privaten Termine sehen.',
        source: 'aus Chat „Update fürs Team“, gestern',
        status: 'pending',
        confidence: 0.75,
      },
    ],
    roles: [
      { label: 'Vater', workspaceId: WS_PRIVAT },
      { label: 'Partner', workspaceId: WS_PRIVAT },
      { label: 'Läufer', workspaceId: WS_PRIVAT },
      { label: 'Product Lead', workspaceId: WS_ARBEIT },
    ],
    preferences: ['Du', 'Direkt', 'Kurz', 'Wichtigstes zuerst', 'Keine Gedankenstriche'],
  };

  return {
    user: {
      id: 'u1',
      firstName: 'Martin',
      displayName: 'Martin S.',
      email: 'martin@example.com',
      initials: 'MS',
      twoFactorEnabled: true,
    },
    workspaces: [
      { id: WS_PRIVAT, name: 'Privat', description: 'Aufgaben, Kontakte, Budget, Wallet, Wissen' },
      {
        id: WS_ARBEIT,
        name: 'Arbeit',
        description:
          'Enterprise-Workspace deiner Firma, vom Admin verwaltet. Aufgaben, Kontakte, Wissen',
      },
    ],
    chats,
    messages,
    approvals,
    requests,
    tasks,
    flows,
    templates,
    graph,
    profile,
    accounts: [
      { id: 'gmail', name: 'Gmail', workspaceId: WS_PRIVAT, connected: true },
      { id: 'gcal', name: 'Google Kalender', workspaceId: WS_PRIVAT, connected: true },
      { id: 'whatsapp', name: 'WhatsApp', workspaceId: WS_PRIVAT, connected: false },
      { id: 'slack', name: 'Slack', workspaceId: WS_ARBEIT, connected: true },
      { id: 'gws', name: 'Google Workspace', workspaceId: WS_ARBEIT, connected: true },
    ],
    settings: {
      readAloud: true,
      collectQuestions: true,
      pushForApprovals: true,
      quietHours: { enabled: true, from: '22:00', to: '07:00' },
      language: 'de',
    },
    billing: {
      monthLabel: formatMonth(now),
      spentEur: 4.12,
      limitEur: 20,
      paymentMethod: 'Visa, endet auf 4242',
    },
  };
}
