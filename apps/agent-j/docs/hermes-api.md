# Hermes API (Referenz für HttpApi)

"Hermes" ist der Open-Source-Agent NousResearch/hermes-agent. Sein API-Server
(`gateway/platforms/api_server.py`, aiohttp) startet nur mit einem starken `API_SERVER_KEY`.
Auth: `Authorization: Bearer <API_SERVER_KEY>`. Eine OpenAPI-Spezifikation gibt es nicht; diese
Notizen stammen aus dem Quellcode (Stand Oktober 2026).

**Sicherheit:** Der Schlüssel erlaubt Terminal-fähige Agent-Arbeit. Er darf nicht in einem
ausgelieferten Client landen (`EXPO_PUBLIC_*` wird gebündelt). Für Produktion braucht es eine
dünne Zwischenschicht (BFF), die den Schlüssel serverseitig hält. CORS für die Web-Version muss
im API-Server konfiguriert werden.

## Routen (Auszug, alle auch unter `/p/{profile}/...`)

| Methode | Pfad | Zweck |
|---|---|---|
| GET | `/health`, `/v1/health` | Status |
| GET | `/v1/capabilities` | Fähigkeiten |
| GET | `/api/sessions?limit&offset&source` | Sessions (Chats), sortiert nach `last_active` |
| POST | `/api/sessions` | Session anlegen, Body `{id?, title?, source?, system_prompt?}` |
| GET/PATCH/DELETE | `/api/sessions/{id}` | Session lesen, ändern (z. B. Titel), löschen |
| GET | `/api/sessions/{id}/messages?limit&offset&order=oldest\|latest` | Nachrichten |
| POST | `/api/sessions/{id}/chat` | Nachricht senden, Antwort am Stück |
| POST | `/api/sessions/{id}/chat/stream` | Nachricht senden, SSE-Stream, Body `{message}` |
| POST | `/v1/runs` | Run starten, Body `{input, instructions?, conversation_history?}` |
| GET | `/v1/runs/{id}/events` | SSE-Events eines Runs |
| POST | `/v1/runs/{id}/approval` | Body `{choice: once\|session\|always\|deny}` |
| POST | `/v1/runs/{id}/stop`, `/steer` | Run stoppen oder lenken |
| GET/POST | `/api/jobs` | Cron-Jobs (Grundlage für Flows) |
| GET/PATCH/DELETE | `/api/jobs/{id}` | Job lesen, ändern, löschen |
| POST | `/api/jobs/{id}/pause`, `/resume`, `/run` | Job pausieren, fortsetzen, sofort ausführen |

## Antwortformen

Session-Liste: `{object: "list", data: Session[], limit, offset, has_more}`.
Session: `id, source, title, started_at, ended_at, last_active, message_count, preview, pinned,
archived, hidden, parent_session_id, ...` (Zeitstempel als Unix-Sekunden).

Nachrichten: `{object: "list", session_id, data: Message[], pagination}`.
Message: `id, session_id, role (user|assistant|tool|system), content, tool_calls, tool_name,
timestamp, finish_reason, display_kind`.

## SSE von `/api/sessions/{id}/chat/stream`

Frames: `event: <name>\ndata: <json>\n\n`, dazwischen `: keepalive`. Jede Payload hat
`session_id, run_id, seq, ts`.

| Event | Payload | Abbildung in der App |
|---|---|---|
| `run.started` | | |
| `message.started` | `{message: {id, role}}` | |
| `assistant.delta` | `{message_id, delta}` | `delta` |
| `tool.started` | `{tool_name, preview, args}` | `step` (running) |
| `tool.completed` / `tool.failed` | `{tool_name, preview}` | `step` (done) |
| `tool.progress` | `{tool_name, delta}` (Denken) | ignoriert |
| `assistant.completed` | `{message_id, content}` | Text der Antwort |
| `run.completed` | `{messages, usage}` | `done` |
| `error` | `{message}` | `error` |
| `done` | `{}` | Ende des Streams |

Freigaben (`approval.request`) kommen nur über `/v1/runs/{id}/events` und betreffen gefährliche
Befehle während eines Runs. Fachliche Freigabe-Tickets (Empfänger, Entwurf, Protokollkette) kennt
Hermes nicht.

## Was fehlt (bleibt im MockApi)

Workspaces, Requests-Queue, Freigabe-Tickets mit Audit-Trail und Entwurf ändern, persönliche
Aufgaben (Hermes-Kanban sind Worker-Aufträge), Flow-Details (Schritte, schreibt nach außen,
Kosten), Flowhub, Kontakte und Graph, Fakten mit Status und Quelle, verbundene Accounts,
Settings, Nutzerprofil, strukturierte Nachrichtenteile (Karten, Briefing).
