import type { Chat } from './types';

export const CHATS: Chat[] = [
  {
    id: 'c1',
    title: 'Wochenplanung',
    group: 'heute',
    messages: [
      { role: 'user', text: 'Was steht diese Woche alles an? Ich hab das Gefühl, ich verliere den Überblick.' },
      {
        role: 'agent',
        text:
          'Verständlich – es ist eine volle Woche. Hier das Wichtigste:\n\n' +
          '- **Mi:** Insights aus den Nutzerinterviews an Priya\n' +
          '- **Do:** Q4-Roadmap-Folien für Sabine, Padel-Platz buchen\n' +
          '- **Fr:** Steuerunterlagen an Frau Kaya\n\n' +
          'Zwei Dinge hängen gerade an anderen: das Pricing-Konzept wartet auf Carlas Zahlen, der Thermostat auf Herrn Brandt. Soll ich bei beiden freundlich nachhaken?',
      },
      { role: 'user', text: 'Ja, bitte. Und Paul muss noch zum Zahnarzt, das hab ich total vergessen.' },
      {
        role: 'agent',
        text:
          'Erledigt: Ich habe Carla auf Slack und Herrn Brandt per E-Mail eine kurze Erinnerung geschickt.\n\n' +
          'Den Zahnarzttermin für Paul habe ich als Aufgabe angelegt. Dienstags und donnerstags ist Julia früher zu Hause – soll ich dort nach freien Terminen suchen?',
        taskIds: ['t4', 't12', 't11'],
      },
    ],
  },
  {
    id: 'c2',
    title: 'Geschenkideen für Mama',
    group: 'heute',
    messages: [
      { role: 'user', text: 'Mama hat bald Geburtstag. Hast du eine Idee?' },
      {
        role: 'agent',
        text:
          'Ingrid wird am 14. Oktober 68. Aus euren letzten Gesprächen weiß ich, dass sie gerade viel im Garten ist und gern mit Klaus ins Theater geht. Drei Ideen:\n\n' +
          '- **Theater-Gutschein** für das Staatstheater (zu zweit mit Klaus)\n' +
          '- **Hochbeet-Set** mit Kräutern\n' +
          '- **Fotobuch** mit Bildern von Emma und Paul aus dem Sommer\n\n' +
          'Ich habe „Geschenk besorgen“ bis Samstag, 11.10. auf deine Liste gesetzt.',
        taskIds: ['t2'],
      },
    ],
  },
  {
    id: 'c3',
    title: 'Herbstferien',
    group: 'gestern',
    messages: [
      { role: 'user', text: 'Wir wollen in den Herbstferien 4 Nächte weg, max. 3 Stunden Fahrt, kinderfreundlich.' },
      {
        role: 'agent',
        text:
          'Ich habe drei Unterkünfte gefunden, die zu euch passen – alle mit Familienzimmer und unter 3 Stunden:\n\n' +
          '- **Ferienhof im Allgäu** – Tiere, Spielscheune, 2:40 h\n' +
          '- **Waldhotel im Fichtelgebirge** – Schwimmbad, 1:30 h\n' +
          '- **Apartment am Chiemsee** – Seezugang, 2:50 h\n\n' +
          'Julia hatte letzte Woche den Ferienhof erwähnt. Soll ich dort eine unverbindliche Anfrage stellen?',
        taskIds: ['t8'],
      },
    ],
  },
  { id: 'c4', title: 'Auto & Termine', group: 'gestern', messages: [
    { role: 'user', text: 'Erinnere mich an die Winterreifen.' },
    { role: 'agent', text: 'Mache ich. Ich habe „Winterreifen-Wechsel buchen“ für Mitte Oktober eingeplant und schlage dir nächste Woche zwei freie Werkstatt-Termine vor.', taskIds: ['t6'] },
  ] },
  { id: 'c5', title: 'Fixkosten senken', group: 'woche', messages: [
    { role: 'user', text: 'Wo können wir monatlich sparen?' },
    { role: 'agent', text: 'Ich sehe drei Hebel: Stromanbieter (ca. 210 €/Jahr), Kfz-Versicherung (ca. 140 €/Jahr) und zwei ungenutzte Streaming-Abos (ca. 25 €/Monat). Die Versicherung ist bereits gekündigt.', taskIds: ['t9', 't16'] },
  ] },
  { id: 'c6', title: 'Feedback für Nina formulieren', group: 'woche', messages: [
    { role: 'user', text: 'Hilf mir, Nina Feedback zum Onboarding-Flow zu geben – ehrlich, aber wertschätzend.' },
    { role: 'agent', text: 'Gern. Ein Vorschlag: Starte mit dem, was stark ist (der klare erste Screen), benenne dann konkret die Stelle, an der Nutzer abspringen (Schritt 3), und schließe mit einer offenen Frage statt einer Lösung.' },
  ] },
  { id: 'c7', title: 'Halbmarathon-Vorbereitung', group: 'woche', messages: [
    { role: 'user', text: 'Wie viele Wochen habe ich noch bis zum Halbmarathon?' },
    { role: 'agent', text: 'Noch 7 Wochen. Sarah hat vorgeschlagen, die langen Läufe auf Sonntag zu legen – ich habe deinen Plan entsprechend angepasst.' },
  ] },
  { id: 'c8', title: 'Elternabend Notizen', group: 'aelter', messages: [
    { role: 'user', text: 'Fass mir den Elternabend kurz zusammen.' },
    { role: 'agent', text: 'Klassenfahrt im Mai, neue Hausaufgabenregel ab November, Sophie verschickt das Protokoll. Ich warte darauf und lege es dann in deine Familienaufgaben.' },
  ] },
  { id: 'c9', title: 'Pricing-Workshop vorbereiten', group: 'aelter', messages: [
    { role: 'user', text: 'Welche Fragen sollte ich im Pricing-Workshop stellen?' },
    { role: 'agent', text: 'Drei Leitfragen: Welches Kundensegment zahlt heute am meisten pro genutztem Feature? Wo verlieren wir Deals wegen Preis? Was würde passieren, wenn wir den Einstiegsplan streichen?' },
  ] },
];
