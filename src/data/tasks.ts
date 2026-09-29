import type { Task } from './types';

export const TASKS: Task[] = [
  // Todo
  { id: 't1', title: 'Steuerunterlagen 2025 an Frau Kaya schicken', area: 'finanzen', source: 'email', sourceDetail: 'E-Mail von Frau Kaya, 24.09.', status: 'todo', due: 'Fr, 3. Okt', personId: 'kaya', notes: 'Fehlend: Handwerkerrechnungen und Spendenquittungen.' },
  { id: 't2', title: 'Geburtstagsgeschenk für Mama besorgen', area: 'familie', source: 'kalender', sourceDetail: 'Kalender: Geburtstag Ingrid, 14.10.', status: 'todo', due: 'Sa, 11. Okt', personId: 'ingrid', chatId: 'c2' },
  { id: 't3', title: 'Q4-Roadmap-Folien für Sabine vorbereiten', area: 'arbeit', source: 'slack', sourceDetail: 'Slack #product, Nachricht von Sabine', status: 'todo', due: 'Do, 2. Okt', personId: 'sabine' },
  { id: 't4', title: 'Zahnarzttermin für Paul vereinbaren', area: 'gesundheit', source: 'chat', sourceDetail: 'Im Chat „Wochenplanung“ besprochen', status: 'todo', due: 'diese Woche', personId: 'paul', chatId: 'c1' },
  { id: 't5', title: 'Padel-Platz für Samstag buchen', area: 'freizeit', source: 'whatsapp', sourceDetail: 'WhatsApp-Gruppe „Padel Crew“', status: 'todo', due: 'Do, 2. Okt', personId: 'mehmet' },
  { id: 't6', title: 'Winterreifen-Wechsel buchen', area: 'haushalt', source: 'chat', sourceDetail: 'Im Chat „Auto & Termine“ besprochen', status: 'todo', due: 'Mitte Okt', chatId: 'c4' },
  // In Progress
  { id: 't7', title: 'Nutzerinterviews auswerten & Insights teilen', area: 'arbeit', source: 'slack', sourceDetail: 'Slack DM von Priya', status: 'progress', due: 'Mi, 1. Okt', personId: 'priya', notes: '5 von 8 Interviews ausgewertet.' },
  { id: 't8', title: 'Herbstferien-Unterkunft vergleichen', area: 'freizeit', source: 'chat', sourceDetail: 'Im Chat „Herbstferien“ besprochen', status: 'progress', due: 'So, 5. Okt', personId: 'julia', chatId: 'c3' },
  { id: 't9', title: 'Stromanbieter wechseln', area: 'finanzen', source: 'chat', sourceDetail: 'Im Chat „Fixkosten senken“ besprochen', status: 'progress', chatId: 'c5', notes: 'Zwei Angebote liegen vor, Ersparnis ca. 210 €/Jahr.' },
  { id: 't10', title: 'Laufplan für den Halbmarathon anpassen', area: 'gesundheit', source: 'whatsapp', sourceDetail: 'WhatsApp von Sarah', status: 'progress', personId: 'sarah' },
  // Abhängig von
  { id: 't11', title: 'Heizungsthermostat reparieren lassen', area: 'haushalt', source: 'email', sourceDetail: 'E-Mail an Herrn Brandt, 22.09.', status: 'blocked', dependsOn: 'Freigabe von Herrn Brandt (Vermieter)', personId: 'brandt' },
  { id: 't12', title: 'Pricing-Konzept finalisieren', area: 'arbeit', source: 'slack', sourceDetail: 'Slack #pricing', status: 'blocked', dependsOn: 'Zahlen von Carla (Data)', personId: 'carla', due: 'Mo, 6. Okt' },
  { id: 't13', title: 'Elternabend-Protokoll verschicken', area: 'familie', source: 'email', sourceDetail: 'E-Mail von Sophie (Elternbeirat)', status: 'blocked', dependsOn: 'Notizen von Sophie', personId: 'sophie' },
  { id: 't14', title: 'Kita-Rechnung überweisen', area: 'finanzen', source: 'email', sourceDetail: 'E-Mail der Kita, 26.09.', status: 'blocked', dependsOn: 'Aufgabe „Stromanbieter wechseln“ (Kontoumstellung)' },
  // Erledigt
  { id: 't15', title: 'Tennistraining für Emma verlängern', area: 'familie', source: 'whatsapp', sourceDetail: 'WhatsApp von Mia', status: 'done', personId: 'mia' },
  { id: 't16', title: 'Kfz-Versicherung kündigen', area: 'finanzen', source: 'chat', sourceDetail: 'Im Chat „Fixkosten senken“ besprochen', status: 'done', chatId: 'c5' },
  { id: 't17', title: 'Feedback zum Onboarding-Flow an Nina', area: 'arbeit', source: 'slack', sourceDetail: 'Slack DM von Nina', status: 'done', personId: 'nina' },
  { id: 't18', title: 'Blutabnahme bei Dr. Weber', area: 'gesundheit', source: 'kalender', sourceDetail: 'Kalender-Termin, 23.09.', status: 'done', personId: 'weber' },
];
