import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { Chip, Segmented, Toggle, TopBar } from '../../components/ui';
import { blankAgent } from '../../data/agents';
import { OUTPUTS, SOURCES } from '../../data/meta';
import type { Agent, OutputChannel, Source } from '../../data/types';
import { useStore } from '../../lib/store';

const SCHEDULE_PRESETS = ['Täglich um 07:00', 'Werktags um 08:00', 'Sonntags um 18:00', 'Am 1. des Monats um 09:00'];
const EVENT_PRESETS = ['Bei neuer E-Mail', 'Bei neuer Nachricht', 'Bei Terminanfrage', 'Bei Rechnung im Posteingang'];

function toggleIn<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export function AgentEditorScreen() {
  const { agentId = '' } = useParams();
  const { agents, saveAgent, deleteAgent } = useStore();
  const navigate = useNavigate();
  const isNew = agentId.startsWith('new-');
  const existing = agents.find((a) => a.id === agentId);
  const [draft, setDraft] = useState<Agent | undefined>(() =>
    isNew ? blankAgent(agentId === 'new-scheduled' ? 'scheduled' : 'agent') : existing,
  );
  const [testState, setTestState] = useState<'idle' | 'running' | 'done'>('idle');

  useEffect(() => {
    if (testState !== 'running') return;
    const t = window.setTimeout(() => setTestState('done'), 1600);
    return () => window.clearTimeout(t);
  }, [testState]);

  if (!draft) return <Navigate to="/agents" replace />;

  const set = (p: Partial<Agent>) => setDraft({ ...draft, ...p });
  const presets = draft.triggerType === 'zeitplan' ? SCHEDULE_PRESETS : EVENT_PRESETS;

  const save = () => {
    saveAgent({ ...draft, name: draft.name.trim() || 'Neuer Agent' });
    navigate('/agents');
  };

  return (
    <div className="page editor">
      <TopBar
        back="/agents"
        title={isNew ? (draft.kind === 'scheduled' ? 'Neuer geplanter Task' : 'Neuer Agent') : draft.name}
        subtitle={draft.kind === 'scheduled' ? 'Geplanter Task' : 'Agent'}
        actions={
          <button className="btn btn-primary btn-sm" onClick={save}>
            Speichern
          </button>
        }
      />
      <div className="page-body page-narrow">
        <div className="form-card">
          <label className="field">
            <span className="field-label">Name</span>
            <input value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="z. B. Einkaufsliste pflegen" />
          </label>
          <label className="field">
            <span className="field-label">Kurzbeschreibung</span>
            <input value={draft.description} onChange={(e) => set({ description: e.target.value })} placeholder="Was macht dieser Agent?" />
          </label>
          <div className="field field-inline">
            <span className="field-label">Aktiv</span>
            <Toggle checked={draft.enabled} onChange={() => set({ enabled: !draft.enabled })} label="Aktiv" />
          </div>
        </div>

        <div className="form-card">
          <div className="form-card-title">
            <Icon name={draft.triggerType === 'zeitplan' ? 'clock' : 'zap'} size={18} /> Auslöser
          </div>
          <Segmented
            size="sm"
            value={draft.triggerType}
            onChange={(v) => set({ triggerType: v, trigger: v === 'zeitplan' ? SCHEDULE_PRESETS[0] : EVENT_PRESETS[0] })}
            options={[
              { id: 'zeitplan', label: 'Zeitplan' },
              { id: 'ereignis', label: 'Ereignis' },
            ]}
          />
          <div className="chip-wrap">
            {presets.map((p) => (
              <Chip key={p} active={draft.trigger === p} onClick={() => set({ trigger: p })}>
                {p}
              </Chip>
            ))}
          </div>
          <label className="field">
            <span className="field-label">{draft.triggerType === 'zeitplan' ? 'Eigener Zeitplan' : 'Eigenes Ereignis'}</span>
            <input value={draft.trigger} onChange={(e) => set({ trigger: e.target.value })} />
          </label>
        </div>

        <div className="form-card">
          <div className="form-card-title">
            <Icon name="pencil" size={18} /> Anweisung
          </div>
          <textarea
            className="instruction"
            rows={5}
            value={draft.instruction}
            onChange={(e) => set({ instruction: e.target.value })}
            placeholder="Beschreibe in eigenen Worten, was Agent-J tun soll …"
          />
        </div>

        <div className="form-card">
          <div className="form-card-title">
            <Icon name="link" size={18} /> Kanäle & Tools
          </div>
          <div className="chip-wrap">
            {(Object.keys(SOURCES) as Source[]).map((s) => (
              <Chip key={s} icon={SOURCES[s].icon} active={draft.tools.includes(s)} onClick={() => set({ tools: toggleIn(draft.tools, s) })}>
                {SOURCES[s].label}
              </Chip>
            ))}
          </div>
          <div className="form-card-title">
            <Icon name="send" size={18} /> Ergebnis als
          </div>
          <div className="chip-wrap">
            {(Object.keys(OUTPUTS) as OutputChannel[]).map((o) => (
              <Chip key={o} icon={OUTPUTS[o].icon} active={draft.outputs.includes(o)} onClick={() => set({ outputs: toggleIn(draft.outputs, o) })}>
                {OUTPUTS[o].label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="form-card">
          <div className="form-card-title">
            <Icon name="play" size={16} /> Testlauf
          </div>
          {testState === 'idle' && <p className="muted">Führe den Agent einmal mit echten Daten aus, ohne dass etwas verschickt wird.</p>}
          {testState === 'running' && (
            <div className="test-log">
              <span className="spinner" /> Agent-J liest {draft.tools.map((t) => SOURCES[t].label).join(', ') || 'deine Kanäle'} …
            </div>
          )}
          {testState === 'done' && (
            <div className="test-log done">
              <Icon name="check" size={16} /> Testlauf erfolgreich: 3 relevante Einträge gefunden, 1 Aufgabe würde angelegt.
            </div>
          )}
          <button className="btn btn-soft" onClick={() => setTestState('running')} disabled={testState === 'running'}>
            <Icon name="play" size={16} /> Jetzt testen
          </button>
        </div>

        {!isNew && (
          <button
            className="btn btn-danger-ghost btn-block"
            onClick={() => {
              deleteAgent(draft.id);
              navigate('/agents');
            }}
          >
            <Icon name="trash" size={16} /> Agent löschen
          </button>
        )}
      </div>
    </div>
  );
}
