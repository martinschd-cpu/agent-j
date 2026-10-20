# Agent-J App

React Native + Expo App für Agent-J, den persönlichen KI-Assistenten. Läuft im Browser, auf iOS
und auf Android aus einer Codebasis. Vorlage ist Clickdummy v3
([`docs/clickdummy-v3`](docs/clickdummy-v3)), Texte, Farben, Maße und Beispieldaten sind daraus
übernommen.

Stack: Expo SDK 58, Expo Router (Routen in `src/app`), TypeScript strict, react-native-web,
TanStack Query, Zustand, Jest (jest-expo), ESLint und Prettier.

## Starten

Alle Befehle im Ordner `apps/agent-j`.

```bash
npm install
npx expo start          # Dev-Server, dann w (Web), i (iOS-Simulator) oder a (Android)
npm run web             # direkt im Browser
npm run ios             # iOS-Simulator
npm run android         # Android-Emulator
```

Auf dem Handy reicht die App Expo Go: QR-Code aus `npx expo start` scannen.

Prüfen und bauen:

```bash
npm run lint
npm run typecheck
npm test
npm run build:web       # statischer Web-Build nach dist/
```

## Mocks oder Backend

Die App spricht nur über das Interface `AgentJApi` ([`src/api/AgentJApi.ts`](src/api/AgentJApi.ts))
mit einem Backend. Zwei Implementierungen:

|           | Was                                                                                                             | Wann                                                            |
| --------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `MockApi` | Alles im Speicher, Beispieldaten aus dem Clickdummy, Daten relativ zu heute, simuliertes Streaming              | Standard                                                        |
| `HttpApi` | Chats und Streaming gegen Hermes (oder einen BFF mit denselben Routen), alles andere fällt auf `MockApi` zurück | `EXPO_PUBLIC_USE_MOCKS=false` und `EXPO_PUBLIC_API_URL` gesetzt |

Umschalten über Umgebungsvariablen. Vorlage ist [`env.example`](env.example) (so benannt, weil
`.env`-Dateien in der lokalen Umgebung gesperrt sind). Kopieren nach `.env.local`, anpassen,
Dev-Server neu starten:

```bash
cp env.example .env.local
```

```
EXPO_PUBLIC_USE_MOCKS=false
EXPO_PUBLIC_API_URL=http://127.0.0.1:8642
EXPO_PUBLIC_API_TOKEN=<nur lokal, siehe Sicherheit>
```

Hermes kennt keine Workspaces. Die App legt Sessions deshalb mit `source=agent-j-<workspace>` an
und filtert die Liste danach. Für die Web-Version muss CORS im Hermes-API-Server freigegeben sein.

## Sicherheit

Der Hermes-Schlüssel (`API_SERVER_KEY`) erlaubt Agent-Arbeit mit Terminalzugriff. Alles mit
`EXPO_PUBLIC_` wird in die App gebündelt und ist für jeden lesbar, der sie hat. Deshalb:

- `EXPO_PUBLIC_API_TOKEN` nur lokal gegen einen eigenen Hermes zum Entwickeln nutzen.
- Für alles, was ausgeliefert wird, braucht es einen dünnen BFF (Backend for Frontend) zwischen
  App und Hermes. Er hält den Schlüssel serverseitig, meldet Nutzer an, liefert die fehlenden
  Endpunkte (siehe unten) und baut die strukturierten Nachrichtenteile (Karten, Briefing,
  Freigaben). `HttpApi` zeigt dann einfach auf den BFF.

## Was im Backend fehlt

Details und Routen: [`docs/hermes-api.md`](docs/hermes-api.md). Diese Teile laufen vorerst im
`MockApi`:

- **Workspaces** (Privat und Arbeit getrennt), Nutzerprofil
- **Requests**, die Warteschlange mit Fragen, Hinweisen und Freigaben
- **Freigabe-Tickets** mit Empfänger, Entwurf ändern und Protokollkette (Audit-Trail). Hermes kennt
  nur Freigaben für gefährliche Befehle während eines Runs.
- **Aufgaben** des Nutzers mit Status, Fälligkeit, „neu erkannt“ und Quelle. Hermes-Kanban sind
  Worker-Aufträge.
- **Flows**: Schritte, „schreibt nach außen“, Kosten pro Ausführung. Grundlage könnten die
  Hermes-Cron-Jobs (`/api/jobs`) sein.
- **Flowhub** mit Vorlagen
- **Kontakte** und Beziehungsgraph
- **Fakten über den Nutzer** mit Status (bestätigt, abgeleitet, neu) und Quelle
- **Verbundene Accounts**, Einstellungen, Abrechnung
- **Strukturierte Nachrichtenteile**: Karten, Morgenbriefing, Freigabe im Chat. Hermes liefert
  reinen Text.

## Aufbau

```
src/
  app/            Routen (Expo Router): index (Chat), settings
  api/            Vertrag (types.ts, AgentJApi.ts), mock/, http/ (Hermes, SSE)
  state/          UI-Store (Zustand), Queries, Aktionen, Undo, Chat-Streaming
  components/     Sidebar, Chat, Seitenfenster, Einstellungen, UI-Bausteine
  theme/          Farben, Schriften, Maße
  lib/            Datums- und Zahlenformate
```

**Rückgängig:** Freigeben, Ablehnen, Requests beantworten, Aufgaben erledigen, übernehmen und
verwerfen, Flows pausieren und Fakten bestätigen ändern die Oberfläche sofort. Der API-Aufruf
kommt erst nach 8 Sekunden, solange steht unten „Rückgängig“. Startet vorher eine neue Aktion
oder geht die App in den Hintergrund, wird die offene sofort ausgeführt
([`src/state/undo.ts`](src/state/undo.ts)).

**Layout:** ab 1280 px Navigation (264 px), Chat (max. 680 px) und Seitenfenster (460 px)
nebeneinander. Darunter legt sich das Seitenfenster über den Chat. Unter 900 px wird die
Navigation zur Schublade und das Seitenfenster zum Vollbild.

**Noch nicht echt:** Sprechen (zeigt nur den Sprachmodus mit Beispielsatz), Datei anhängen,
Abmelden.
