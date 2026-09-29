import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { IconButton, Section, Toggle, TopBar } from '../../components/ui';
import { SOURCES } from '../../data/meta';
import type { Agent } from '../../data/types';
import { useStore } from '../../lib/store';

export function AgentsScreen() {
  const { agents } = useStore();
  const navigate = useNavigate();
  const scheduled = agents.filter((a) => a.kind === 'scheduled');
  const reactive = agents.filter((a) => a.kind === 'agent');
  const active = agents.filter((a) => a.enabled).length;

  return (
    <div className="page">
      <TopBar
        title="Agents"
        subtitle={`${active} von ${agents.length} aktiv`}
        actions={<IconButton icon="plus" label="Neuer Agent" variant="primary" onClick={() => navigate('/agents/new-agent')} />}
      />
      <div className="page-body page-narrow">
        <div className="intro-card">
          <Icon name="zap" size={22} />
          <div>
            <strong>Agent-J arbeitet für dich im Hintergrund.</strong>
            <span>Geplante Tasks laufen nach Zeitplan, Agents reagieren auf Ereignisse in deinen Kanälen.</span>
          </div>
        </div>

        <Section
          title="Geplante Tasks"
          action={
            <button className="link-btn" onClick={() => navigate('/agents/new-scheduled')}>
              <Icon name="plus" size={16} /> Neu
            </button>
          }
        >
          <div className="card-list">
            {scheduled.map((a) => (
              <AgentRow key={a.id} agent={a} />
            ))}
          </div>
        </Section>

        <Section
          title="Agents"
          action={
            <button className="link-btn" onClick={() => navigate('/agents/new-agent')}>
              <Icon name="plus" size={16} /> Neu
            </button>
          }
        >
          <div className="card-list">
            {reactive.map((a) => (
              <AgentRow key={a.id} agent={a} />
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function AgentRow({ agent }: { agent: Agent }) {
  const { toggleAgent } = useStore();
  const navigate = useNavigate();
  return (
    <div className={`agent-card${agent.enabled ? '' : ' is-off'}`} onClick={() => navigate(`/agents/${agent.id}`)} role="button" tabIndex={0}>
      <span className={`agent-icon ${agent.kind}`}>
        <Icon name={agent.kind === 'scheduled' ? 'clock' : 'zap'} />
      </span>
      <span className="agent-main">
        <span className="agent-name">
          {agent.name}
          {agent.health === 'warn' && agent.enabled && (
            <span className="warn-pill">
              <Icon name="alert" size={12} /> Prüfen
            </span>
          )}
        </span>
        <span className="agent-trigger">{agent.trigger}</span>
        <span className="agent-meta">
          <span className="agent-when">
            {agent.kind === 'scheduled'
              ? `Nächster Lauf: ${agent.enabled ? agent.nextRun : 'pausiert'}`
              : `Zuletzt aktiv: ${agent.lastRun}`}
          </span>
          <span className="agent-tools">
            {agent.tools.map((t) => (
              <Icon key={t} name={SOURCES[t].icon} size={13} />
            ))}
          </span>
        </span>
      </span>
      <Toggle checked={agent.enabled} onChange={() => toggleAgent(agent.id)} label={`${agent.name} aktiv`} />
    </div>
  );
}
