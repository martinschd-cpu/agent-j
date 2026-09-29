import type { Person } from './types';

export const ME_ID = 'me';

export const PEOPLE: Person[] = [
  // Familie
  { id: 'julia', name: 'Julia', group: 'familie', relation: 'Partnerin', lastContact: 'heute', frequency: 5, note: 'Mag keine Überraschungstermine am Wochenende.' },
  { id: 'emma', name: 'Emma', group: 'familie', relation: 'Tochter, 9', lastContact: 'heute', frequency: 5 },
  { id: 'paul', name: 'Paul', group: 'familie', relation: 'Sohn, 6', lastContact: 'heute', frequency: 5 },
  { id: 'ingrid', name: 'Ingrid', group: 'familie', relation: 'Mutter', lastContact: 'vor 4 Tagen', frequency: 3, note: 'Geburtstag am 14. Oktober.' },
  { id: 'klaus', name: 'Klaus', group: 'familie', relation: 'Vater', lastContact: 'vor 4 Tagen', frequency: 3 },
  { id: 'lena', name: 'Lena', group: 'familie', relation: 'Schwester', lastContact: 'vor 2 Wochen', frequency: 2 },
  { id: 'tom', name: 'Tom', group: 'familie', relation: 'Schwager', lastContact: 'vor 1 Monat', frequency: 1 },
  // Freunde
  { id: 'jonas', name: 'Jonas', group: 'freunde', relation: 'Bester Freund', lastContact: 'gestern', frequency: 4 },
  { id: 'sarah', name: 'Sarah', group: 'freunde', relation: 'Freundin, Laufgruppe', lastContact: 'vor 3 Tagen', frequency: 3 },
  { id: 'mehmet', name: 'Mehmet', group: 'freunde', relation: 'Freund, Padel', lastContact: 'vor 5 Tagen', frequency: 3 },
  { id: 'anna', name: 'Anna', group: 'freunde', relation: 'Freundin', lastContact: 'vor 2 Wochen', frequency: 2 },
  { id: 'felix', name: 'Felix', group: 'freunde', relation: 'Studienfreund', lastContact: 'vor 6 Wochen', frequency: 1 },
  { id: 'katrin', name: 'Katrin', group: 'freunde', relation: 'Nachbarin', lastContact: 'vor 1 Woche', frequency: 2 },
  { id: 'david', name: 'David', group: 'freunde', relation: 'Freund, Laufgruppe', lastContact: 'vor 3 Tagen', frequency: 2 },
  // Arbeit
  { id: 'sabine', name: 'Sabine', group: 'arbeit', relation: 'Chefin', lastContact: 'heute', frequency: 5 },
  { id: 'lukas', name: 'Lukas', group: 'arbeit', relation: 'Engineering Lead', lastContact: 'heute', frequency: 5 },
  { id: 'nina', name: 'Nina', group: 'arbeit', relation: 'Designerin', lastContact: 'gestern', frequency: 4 },
  { id: 'oliver', name: 'Oliver', group: 'arbeit', relation: 'Sales', lastContact: 'vor 3 Tagen', frequency: 3 },
  { id: 'carla', name: 'Carla', group: 'arbeit', relation: 'Data Analyst', lastContact: 'gestern', frequency: 3 },
  { id: 'stefan', name: 'Stefan', group: 'arbeit', relation: 'CFO', lastContact: 'vor 1 Woche', frequency: 2 },
  { id: 'priya', name: 'Priya', group: 'arbeit', relation: 'Product Managerin', lastContact: 'heute', frequency: 4 },
  // Netzwerk / Dienstleister
  { id: 'weber', name: 'Dr. Weber', group: 'netzwerk', relation: 'Hausarzt', lastContact: 'vor 3 Monaten', frequency: 1 },
  { id: 'kaya', name: 'Frau Kaya', group: 'netzwerk', relation: 'Steuerberaterin', lastContact: 'vor 5 Tagen', frequency: 2 },
  { id: 'brandt', name: 'Herr Brandt', group: 'netzwerk', relation: 'Vermieter', lastContact: 'vor 2 Wochen', frequency: 1 },
  { id: 'mia', name: 'Mia', group: 'netzwerk', relation: 'Tennistrainerin von Emma', lastContact: 'vor 1 Woche', frequency: 2 },
  { id: 'tim', name: 'Tim', group: 'netzwerk', relation: 'Handwerker', lastContact: 'vor 3 Tagen', frequency: 1 },
  { id: 'sophie', name: 'Sophie', group: 'netzwerk', relation: 'Elternbeirat', lastContact: 'vor 1 Woche', frequency: 2 },
  { id: 'robert', name: 'Robert', group: 'netzwerk', relation: 'Mentor', lastContact: 'vor 1 Monat', frequency: 1 },
];

/** Links between people (everyone is additionally linked to "Ich"). */
export const LINKS: Array<[string, string]> = [
  ['julia', 'emma'], ['julia', 'paul'], ['emma', 'paul'], ['ingrid', 'klaus'], ['ingrid', 'lena'],
  ['klaus', 'lena'], ['lena', 'tom'], ['julia', 'ingrid'], ['emma', 'ingrid'], ['paul', 'klaus'],
  ['jonas', 'mehmet'], ['sarah', 'david'], ['sarah', 'julia'], ['anna', 'julia'], ['katrin', 'julia'],
  ['felix', 'jonas'], ['katrin', 'anna'], ['jonas', 'lukas'],
  ['sabine', 'lukas'], ['sabine', 'stefan'], ['sabine', 'priya'], ['lukas', 'nina'], ['lukas', 'priya'],
  ['nina', 'priya'], ['carla', 'priya'], ['oliver', 'stefan'], ['carla', 'stefan'],
  ['mia', 'emma'], ['sophie', 'emma'], ['sophie', 'paul'], ['sophie', 'katrin'], ['robert', 'sabine'],
  ['brandt', 'tim'], ['kaya', 'stefan'],
];

export const personById = (id: string) => PEOPLE.find((p) => p.id === id);
