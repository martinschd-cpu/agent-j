import { Fragment, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { Sheet } from '../../components/ui';
import { AREAS } from '../../data/meta';
import { MODELS } from '../../data/profile';
import type { Task } from '../../data/types';
import { useStore } from '../../lib/store';

/** Tiny markdown subset: paragraphs, "- " bullet lists and **bold**. */
export function RichText({ text }: { text: string }) {
  const inline = (s: string): ReactNode[] =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
    );
  return (
    <>
      {text.split('\n\n').map((block, i) => {
        const lines = block.split('\n');
        if (lines.every((l) => l.startsWith('- '))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.slice(2))}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{inline(block)}</p>;
      })}
    </>
  );
}

export function TaskHint({ tasks }: { tasks: Task[] }) {
  if (!tasks.length) return null;
  return (
    <div className="task-hint">
      <div className="task-hint-head">
        <Icon name="sparkle" size={16} />
        {tasks.length === 1 ? '1 Aufgabe' : `${tasks.length} Aufgaben`} erkannt
      </div>
      {tasks.map((t) => (
        <div key={t.id} className="task-hint-item">
          <span className={`status-dot st-${t.status}`} />
          <span className="task-hint-title">{t.title}</span>
          <span className="task-hint-area" style={{ color: `var(--area-${t.area})` }}>
            {AREAS[t.area].label}
          </span>
        </div>
      ))}
      <Link to="/tasks" className="task-hint-link">
        Zu Aufgaben <Icon name="arrow" size={16} />
      </Link>
    </div>
  );
}

export function Composer({ onSend, autoFocus }: { onSend: (text: string) => void; autoFocus?: boolean }) {
  const { modelId } = useStore();
  const [text, setText] = useState('');
  const [modelOpen, setModelOpen] = useState(false);
  const model = MODELS.find((m) => m.id === modelId) ?? MODELS[0];

  const send = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText('');
  };

  return (
    <div className="composer">
      <textarea
        value={text}
        autoFocus={autoFocus}
        rows={1}
        placeholder="Schreib Agent-J …"
        onChange={(e) => {
          setText(e.target.value);
          e.target.style.height = 'auto';
          e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
      />
      <div className="composer-bar">
        <button className="icon-btn" aria-label="Datei anhängen" title="Datei anhängen">
          <Icon name="clip" />
        </button>
        <button className="model-chip" onClick={() => setModelOpen(true)}>
          {model.name.replace('Claude ', '')} <Icon name="down" size={14} />
        </button>
        <button className="send-btn" onClick={send} disabled={!text.trim()} aria-label="Senden">
          <Icon name="send" size={18} />
        </button>
      </div>
      <ModelSheet open={modelOpen} onClose={() => setModelOpen(false)} />
    </div>
  );
}

export function ModelSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { modelId, setModel } = useStore();
  return (
    <Sheet open={open} onClose={onClose} title="Modell wählen">
      <ModelList
        value={modelId}
        onChange={(id) => {
          setModel(id);
          onClose();
        }}
      />
    </Sheet>
  );
}

export function ModelList({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="model-list">
      {MODELS.map((m) => (
        <button key={m.id} className={`model-option${m.id === value ? ' active' : ''}`} onClick={() => onChange(m.id)}>
          <span className="radio" />
          <span className="model-option-main">
            <span className="model-option-name">
              {m.name}
              {m.tag && <span className="tag">{m.tag}</span>}
            </span>
            <span className="model-option-desc">{m.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
