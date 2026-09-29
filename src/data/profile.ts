import type { Fact, Model } from './types';

export const USER = {
  name: 'Martin',
  email: 'martin@example.com',
  knownSince: 142,
};

/** "Wer bin ich" – what Agent-J has understood about the person. */
export const IDENTITY: Array<{ label: string; value: string }> = [
  { label: 'Rollen', value: 'Product Lead, Vater von Emma & Paul, Hobbyläufer' },
  { label: 'Lebenssituation', value: 'Wohnt mit Julia und den Kindern in Nürnberg' },
  { label: 'Arbeitsrhythmus', value: 'Fokuszeit 9–12 Uhr, Meetings am Nachmittag' },
  { label: 'Aktuelle Ziele', value: 'Halbmarathon im November, mehr Zeit mit der Familie' },
];

export type Tone = 'direkt' | 'freundlich' | 'humorvoll' | 'formell';

export interface Preferences {
  address: 'du' | 'sie';
  tones: Tone[];
  detail: number; // 1 kurz … 5 ausführlich
  proactivity: 'anfrage' | 'vorschlaege' | 'selbststaendig';
  noGos: string[];
}

export const PREFERENCES: Preferences = {
  address: 'du',
  tones: ['direkt', 'freundlich'],
  detail: 2,
  proactivity: 'vorschlaege',
  noGos: ['Keine Termine vor 08:00', 'Keine Arbeitsthemen am Wochenende', 'Nie ohne Rückfrage in meinem Namen zusagen'],
};

export const FACTS: Fact[] = [
  { id: 'f1', text: 'Bevorzugt kurze Antworten mit Stichpunkten.', source: 'chat', learned: 'vor 2 Monaten' },
  { id: 'f2', text: 'Julia arbeitet dienstags und donnerstags nur bis 14 Uhr.', source: 'chat', learned: 'vor 3 Wochen' },
  { id: 'f3', text: 'Emma hat montags und mittwochs Tennis bei Mia.', source: 'whatsapp', learned: 'vor 1 Monat' },
  { id: 'f4', text: 'Steuerberaterin ist Frau Kaya, Unterlagen immer bis Anfang Oktober.', source: 'email', learned: 'vor 5 Tagen' },
  { id: 'f5', text: 'Mag keine Meetings am Freitagnachmittag.', source: 'kalender', learned: 'vor 6 Wochen' },
  { id: 'f6', text: 'Trinkt keinen Kaffee nach 15 Uhr – keine Kaffee-Termine am Nachmittag vorschlagen.', source: 'chat', learned: 'vor 2 Wochen' },
];

export const MODELS: Model[] = [
  { id: 'claude-sonnet-5-5', name: 'Claude Sonnet 5.5', description: 'Ausgewogen – schnell und klug für den Alltag.', tag: 'Empfohlen' },
  { id: 'claude-opus-5-5', name: 'Claude Opus 5.5', description: 'Am leistungsstärksten für komplexe Planung und Recherche.', tag: 'Plus' },
  { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', description: 'Am schnellsten, ideal für kurze Fragen und Agents.' },
];

export const CHANNELS: Array<{ id: string; name: string; detail: string; connected: boolean }> = [
  { id: 'gmail', name: 'Gmail', detail: 'martin@example.com', connected: true },
  { id: 'kalender', name: 'Google Kalender', detail: '3 Kalender synchronisiert', connected: true },
  { id: 'whatsapp', name: 'WhatsApp', detail: 'Über WhatsApp Business verbunden', connected: true },
  { id: 'slack', name: 'Slack', detail: 'Nicht verbunden', connected: false },
];

export const INVOICES = [
  { id: 'i3', date: '01.09.2026', amount: '19,00 €' },
  { id: 'i2', date: '01.08.2026', amount: '19,00 €' },
  { id: 'i1', date: '01.07.2026', amount: '19,00 €' },
];
