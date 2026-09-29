import type { Area, Message, Task } from '../data/types';

// Canned answers so the click dummy feels conversational. Deliberately keyword-based:
// the real product would call the selected model here.

const AREA_HINTS: Array<[RegExp, Area]> = [
  [/arzt|zahn|lauf|sport|training|gesund/i, 'gesundheit'],
  [/rechnung|steuer|geld|zahl|bank|versicherung|überweis/i, 'finanzen'],
  [/meeting|folie|kunde|projekt|slack|chef|arbeit|präsentation/i, 'arbeit'],
  [/mama|papa|kind|emma|paul|julia|geburtstag|schule|kita|familie/i, 'familie'],
  [/wasch|putz|einkauf|milch|reparatur|wohnung|müll|haushalt|turnbeutel/i, 'haushalt'],
];

function guessArea(text: string): Area {
  return AREA_HINTS.find(([re]) => re.test(text))?.[1] ?? 'freizeit';
}

function taskTitle(text: string): string {
  const t = text
    .replace(/^(bitte\s+)?(erinnere mich( daran)?,?\s*(an|dass|ich)?\s*|ich muss( noch)?\s*|nicht vergessen:?\s*|todo:?\s*|aufgabe:?\s*)/i, '')
    .replace(/[.!?]+$/, '')
    .trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function mockReply(input: string, tasks: Task[], modelName: string): { message: Message; newTask?: Task } {
  const text = input.toLowerCase();

  if (/erinner|ich muss|nicht vergessen|todo|aufgabe:/.test(text)) {
    const task: Task = {
      id: `t${Date.now()}`,
      title: taskTitle(input),
      area: guessArea(input),
      source: 'chat',
      sourceDetail: 'Gerade im Chat besprochen',
      status: 'todo',
      due: 'offen',
    };
    return {
      newTask: task,
      message: {
        role: 'agent',
        text: `Notiert! Ich habe **„${task.title}“** als Aufgabe angelegt. Soll ich dir eine Erinnerung mit Uhrzeit setzen?`,
        taskIds: [task.id],
      },
    };
  }

  if (/wart|abhängig|blockiert|hängt/.test(text)) {
    const blocked = tasks.filter((t) => t.status === 'blocked');
    return {
      message: {
        role: 'agent',
        text:
          `Aktuell warten ${blocked.length} Aufgaben auf andere:\n\n` +
          blocked.map((t) => `- **${t.title}** – ${t.dependsOn}`).join('\n') +
          '\n\nSoll ich bei allen einmal freundlich nachhaken?',
        taskIds: blocked.map((t) => t.id),
      },
    };
  }

  if (/heute|was steht|überblick|woche|plan/.test(text)) {
    const open = tasks.filter((t) => t.status === 'todo' || t.status === 'progress');
    const top = open.filter((t) => t.due).slice(0, 4);
    return {
      message: {
        role: 'agent',
        text:
          `Du hast ${open.length} offene Aufgaben. Das Wichtigste zuerst:\n\n` +
          top.map((t) => `- **${t.due}:** ${t.title}`).join('\n') +
          '\n\nIch würde mit den Roadmap-Folien starten – deine Fokuszeit ist bis 12 Uhr frei.',
        taskIds: top.map((t) => t.id),
      },
    };
  }

  return {
    message: {
      role: 'agent',
      text:
        `Gute Frage! In der fertigen Version beantwortet Agent-J das mit **${modelName}** und deinem Kontext aus Kalender, Mails und Aufgaben.\n\n` +
        'Probier im Clickdummy zum Beispiel:\n\n- „Was steht heute an?“\n- „Erinnere mich, Pauls Turnbeutel zu waschen“\n- „Welche Aufgaben warten auf andere?“',
    },
  };
}
