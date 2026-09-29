# Agent-J – Clickdummy

Klickbarer Prototyp für **Agent-J**, den persönlichen Assistenten für die täglichen Todos.
Nur Frontend mit Mock-Daten – kein Backend, keine echten Konten. Klicks (Aufgaben verschieben,
Agents an/aus, Modell, Theme …) merkt sich der Browser per `localStorage`; unter
*Einstellungen → Demo zurücksetzen* geht alles zurück auf die Beispieldaten.

## Bereiche

| Route | Bereich |
| --- | --- |
| `/chat`, `/chat/:id`, `/chat/new` | Chat wie bei Claude – Verlauf links, Unterhaltung rechts |
| `/tasks` | Aufgaben-Dashboard: Todo · In Progress · Abhängig von · Erledigt, Filter nach Lebensbereich und Quelle |
| `/agents`, `/agents/:id` | Geplante Tasks und Agents inkl. Editor |
| `/me`, `/me/netzwerk` | Was Agent-J über mich weiß: Profil & Umgangsformen, Netzwerk-Graph (Obsidian-Stil) |
| `/settings` | Account, Abo & Zahlung, Modell, Kanäle, Darstellung, Version |

Mobile-first PWA; ab 900 px Breite gibt es eine Seitenleiste statt der Tab-Leiste.

## Entwicklung

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # Typecheck + Produktions-Build nach dist/
npm run start      # liefert dist/ aus (PORT, Standard 3000)
```

## Deployment & Versionen

Railway baut jeden Commit auf `main` (`railway.json`: `npm run build`, dann `npm run start`).
Jeder Merge nach `main` ist damit eine neue, in Railway abrufbare Version; ältere Deployments
lassen sich dort per Rollback wiederherstellen. Die App zeigt unter *Einstellungen → Über* die
Version aus `package.json` und den Commit (`RAILWAY_GIT_COMMIT_SHA`). Meilensteine bekommen
zusätzlich einen Git-Tag (`v0.1.0`, `v0.2.0`, …).

## Struktur

```
src/
  App.tsx, main.tsx        Router + Layout (TabBar mobil, SideNav desktop)
  styles/                  Design-Tokens (hell/dunkel) und Styles
  components/              Icon-Set, Navigation, UI-Bausteine (Sheet, Segmented, Chip, Toggle …)
  data/                    Mock-Daten: Chats, Aufgaben, Agents, Profil, Netzwerk
  lib/                     Demo-Store, Theme, Mock-Antworten, Versionsinfo
  screens/                 chat/, tasks/, agents/, me/, settings/
```
