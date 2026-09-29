import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { Chip, Row, Section, Segmented, Sheet, TopBar } from '../../components/ui';
import { PERSON_GROUPS, SOURCES, STATUSES } from '../../data/meta';
import { LINKS, PEOPLE, personById } from '../../data/network';
import { IDENTITY, USER, type Preferences, type Tone } from '../../data/profile';
import type { PersonGroup } from '../../data/types';
import { useStore } from '../../lib/store';
import { NetworkGraph } from './NetworkGraph';

export function MeScreen() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const tab = pathname.endsWith('/netzwerk') ? 'netzwerk' : 'about';

  return (
    <div className={`page me-page${tab === 'netzwerk' ? ' is-network' : ''}`}>
      <TopBar title="Was Agent-J über dich weiß" />
      <div className="me-tabs">
        <Segmented
          value={tab}
          onChange={(v) => navigate(v === 'netzwerk' ? '/me/netzwerk' : '/me')}
          options={[
            { id: 'about', label: 'Über mich' },
            { id: 'netzwerk', label: 'Netzwerk' },
          ]}
        />
      </div>
      {tab === 'about' ? <AboutMe /> : <Network />}
    </div>
  );
}

/* ---------------------------------------------------------------- Über mich */

const TONES: Array<{ id: Tone; label: string }> = [
  { id: 'direkt', label: 'Direkt' },
  { id: 'freundlich', label: 'Freundlich' },
  { id: 'humorvoll', label: 'Humorvoll' },
  { id: 'formell', label: 'Formell' },
];

const DETAIL_LABELS = ['', 'Sehr knapp', 'Kurz & knapp', 'Ausgewogen', 'Ausführlich', 'Sehr ausführlich'];

function previewSentence(p: Preferences) {
  const du = p.address === 'du';
  const hi = p.tones.includes('formell') ? 'Guten Morgen.' : p.tones.includes('humorvoll') ? 'Moin! Kaffee schon da? ☕' : 'Guten Morgen!';
  const body = du ? 'Du hast heute 3 Termine und 2 fällige Aufgaben.' : 'Sie haben heute 3 Termine und 2 fällige Aufgaben.';
  const extra =
    p.detail >= 4
      ? du
        ? ' Der wichtigste Punkt sind die Roadmap-Folien für Sabine – ich habe dir die Zahlen aus dem letzten Quartal schon zusammengestellt.'
        : ' Der wichtigste Punkt sind die Roadmap-Folien – die Zahlen aus dem letzten Quartal habe ich bereits zusammengestellt.'
      : '';
  const ask =
    p.proactivity === 'selbststaendig'
      ? ' Die Erinnerung an Carla habe ich schon verschickt.'
      : p.proactivity === 'vorschlaege'
        ? ' Soll ich Carla wegen der Zahlen erinnern?'
        : '';
  return `${hi} ${body}${extra}${ask}`;
}

function AboutMe() {
  const { prefs, setPrefs, facts, setFacts, tasks } = useStore();
  const [newNoGo, setNewNoGo] = useState('');
  const [newFact, setNewFact] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const set = (p: Partial<Preferences>) => setPrefs({ ...prefs, ...p });

  return (
    <div className="page-body page-narrow">
      <div className="profile-hero">
        <span className="initials initials-lg">{USER.name[0]}</span>
        <div>
          <div className="profile-name">{USER.name}</div>
          <div className="profile-meta">
            Agent-J kennt dich seit {USER.knownSince} Tagen · {facts.length} Fakten · {PEOPLE.length} Personen ·{' '}
            {tasks.length} Aufgaben
          </div>
        </div>
      </div>

      <Section title="Wer bin ich">
        <div className="card">
          {IDENTITY.map((i) => (
            <div key={i.label} className="kv">
              <span className="kv-label">{i.label}</span>
              <span className="kv-value">{i.value}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Wie ich behandelt werden will">
        <div className="card pref-card">
          <div className="pref">
            <span className="pref-label">Anrede</span>
            <Segmented
              size="sm"
              value={prefs.address}
              onChange={(v) => set({ address: v })}
              options={[
                { id: 'du', label: 'Du' },
                { id: 'sie', label: 'Sie' },
              ]}
            />
          </div>
          <div className="pref">
            <span className="pref-label">Tonalität</span>
            <div className="chip-wrap">
              {TONES.map((t) => (
                <Chip
                  key={t.id}
                  active={prefs.tones.includes(t.id)}
                  onClick={() =>
                    set({ tones: prefs.tones.includes(t.id) ? prefs.tones.filter((x) => x !== t.id) : [...prefs.tones, t.id] })
                  }
                >
                  {t.label}
                </Chip>
              ))}
            </div>
          </div>
          <div className="pref">
            <span className="pref-label">
              Antwortlänge <span className="pref-value">{DETAIL_LABELS[prefs.detail]}</span>
            </span>
            <input
              type="range"
              min={1}
              max={5}
              value={prefs.detail}
              onChange={(e) => set({ detail: Number(e.target.value) })}
              className="range"
            />
          </div>
          <div className="pref">
            <span className="pref-label">Eigeninitiative</span>
            <Segmented
              size="sm"
              value={prefs.proactivity}
              onChange={(v) => set({ proactivity: v })}
              options={[
                { id: 'anfrage', label: 'Nur auf Anfrage' },
                { id: 'vorschlaege', label: 'Vorschläge' },
                { id: 'selbststaendig', label: 'Selbstständig' },
              ]}
            />
          </div>
          <div className="pref">
            <span className="pref-label">No-Gos</span>
            <div className="nogo-list">
              {prefs.noGos.map((n) => (
                <span key={n} className="nogo">
                  {n}
                  <button aria-label={`${n} entfernen`} onClick={() => set({ noGos: prefs.noGos.filter((x) => x !== n) })}>
                    <Icon name="x" size={14} />
                  </button>
                </span>
              ))}
            </div>
            <form
              className="inline-add"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newNoGo.trim()) return;
                set({ noGos: [...prefs.noGos, newNoGo.trim()] });
                setNewNoGo('');
              }}
            >
              <input value={newNoGo} onChange={(e) => setNewNoGo(e.target.value)} placeholder="No-Go hinzufügen …" />
              <button className="icon-btn icon-btn-soft" aria-label="Hinzufügen">
                <Icon name="plus" size={18} />
              </button>
            </form>
          </div>
          <div className="preview-box">
            <span className="preview-label">
              <Icon name="sparkle" size={14} /> So klingt Agent-J für dich
            </span>
            <p>{previewSentence(prefs)}</p>
          </div>
        </div>
      </Section>

      <Section title={`Gelernte Fakten (${facts.length})`}>
        <div className="card fact-list">
          {facts.map((f) => (
            <div key={f.id} className="fact">
              <span className="fact-source" title={SOURCES[f.source].label}>
                <Icon name={SOURCES[f.source].icon} size={16} />
              </span>
              <div className="fact-main">
                {editing === f.id ? (
                  <input
                    autoFocus
                    defaultValue={f.text}
                    onBlur={(e) => {
                      setFacts(facts.map((x) => (x.id === f.id ? { ...x, text: e.target.value } : x)));
                      setEditing(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                  />
                ) : (
                  <span className="fact-text">{f.text}</span>
                )}
                <span className="fact-meta">
                  aus {SOURCES[f.source].label} · {f.learned}
                </span>
              </div>
              <button className="icon-btn" aria-label="Bearbeiten" onClick={() => setEditing(f.id)}>
                <Icon name="pencil" size={16} />
              </button>
              <button className="icon-btn" aria-label="Vergessen" onClick={() => setFacts(facts.filter((x) => x.id !== f.id))}>
                <Icon name="trash" size={16} />
              </button>
            </div>
          ))}
          <form
            className="inline-add"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newFact.trim()) return;
              setFacts([...facts, { id: `f${Date.now()}`, text: newFact.trim(), source: 'chat', learned: 'gerade eben' }]);
              setNewFact('');
            }}
          >
            <input value={newFact} onChange={(e) => setNewFact(e.target.value)} placeholder="Agent-J etwas über dich beibringen …" />
            <button className="icon-btn icon-btn-soft" aria-label="Hinzufügen">
              <Icon name="plus" size={18} />
            </button>
          </form>
        </div>
      </Section>
    </div>
  );
}

/* ----------------------------------------------------------------- Netzwerk */

function Network() {
  const [params, setParams] = useSearchParams();
  const [hidden, setHidden] = useState<PersonGroup[]>([]);
  const selectedId = params.get('person');
  const visible = useMemo(() => PEOPLE.filter((p) => !hidden.includes(p.group)), [hidden]);
  const select = (id: string | null) => setParams(id ? { person: id } : {}, { replace: true });

  return (
    <div className="network">
      <div className="graph-overlay">
        <div className="graph-stats">
          {visible.length} Personen · {LINKS.length + PEOPLE.length} Verbindungen
        </div>
        <div className="graph-legend">
          {(Object.keys(PERSON_GROUPS) as PersonGroup[]).map((g) => (
            <button
              key={g}
              className={`legend-item grp-${g}${hidden.includes(g) ? ' off' : ''}`}
              onClick={() => setHidden(hidden.includes(g) ? hidden.filter((x) => x !== g) : [...hidden, g])}
            >
              <span className="legend-dot" />
              {PERSON_GROUPS[g].label}
            </button>
          ))}
        </div>
      </div>
      <NetworkGraph people={visible} selectedId={selectedId} onSelect={select} />
      <PersonSheet personId={selectedId} onClose={() => select(null)} />
    </div>
  );
}

function PersonSheet({ personId, onClose }: { personId: string | null; onClose: () => void }) {
  const { tasks, createChat } = useStore();
  const navigate = useNavigate();
  const person = personId ? personById(personId) : undefined;
  if (!person) return null;
  const related = tasks.filter((t) => t.personId === person.id);

  const draft = () => {
    const id = `c${Date.now()}`;
    createChat({ id, title: `Nachricht an ${person.name}`, group: 'heute', messages: [{ role: 'user', text: `Hilf mir, ${person.name} zu schreiben.` }] });
    navigate(`/chat/${id}`);
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={<span className={`group-pill grp-${person.group}`}>{PERSON_GROUPS[person.group].label}</span>}
      footer={
        <button className="btn btn-primary btn-block" onClick={draft}>
          <Icon name="chat" size={18} /> Nachricht mit Agent-J entwerfen
        </button>
      }
    >
      <div className="person-head">
        <span className={`initials initials-lg grp-bg-${person.group}`}>{person.name.replace(/^(Dr\.|Frau|Herr)\s/, '')[0]}</span>
        <div>
          <h3 className="sheet-heading">{person.name}</h3>
          <div className="muted">{person.relation}</div>
        </div>
      </div>
      <div className="detail-rows">
        <Row icon="clock" title="Letzter Kontakt" detail={person.lastContact} />
        <Row
          icon="chat"
          title="Kontakthäufigkeit"
          trailing={
            <span className="freq">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={i <= person.frequency ? 'on' : ''} />
              ))}
            </span>
          }
        />
        {person.note && <Row icon="brain" title="Agent-J weiß" detail={person.note} />}
      </div>
      <div className="person-tasks">
        <div className="field-label">Aufgaben mit {person.name}</div>
        {related.length ? (
          related.map((t) => (
            <Link key={t.id} to="/tasks" className="person-task">
              <span className={`status-dot st-${t.status}`} />
              <span>{t.title}</span>
              <span className="muted">{STATUSES.find((s) => s.id === t.status)!.short}</span>
            </Link>
          ))
        ) : (
          <p className="muted">Keine offenen Aufgaben.</p>
        )}
      </div>
    </Sheet>
  );
}
