import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { Chip, Row, Segmented, Sheet } from '../../components/ui';
import { AREAS, SOURCES, STATUSES } from '../../data/meta';
import { personById } from '../../data/network';
import type { Area, Status, Task } from '../../data/types';
import { useStore } from '../../lib/store';

export function TaskDetailSheet({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const { setTaskStatus, createChat } = useStore();
  const navigate = useNavigate();
  if (!task) return null;
  const person = task.personId ? personById(task.personId) : undefined;

  const discuss = () => {
    const id = `c${Date.now()}`;
    createChat({ id, title: task.title, group: 'heute', messages: [{ role: 'user', text: `Hilf mir bei: ${task.title}` }] });
    navigate(`/chat/${id}`);
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={
        <span className="area-label" style={{ color: `var(--area-${task.area})` }}>
          <Icon name={AREAS[task.area].icon} size={16} /> {AREAS[task.area].label}
        </span>
      }
      footer={
        <button className="btn btn-primary btn-block" onClick={discuss}>
          <Icon name="chat" size={18} /> Mit Agent-J besprechen
        </button>
      }
    >
      <h3 className="sheet-heading">{task.title}</h3>
      <Segmented<Status>
        size="sm"
        value={task.status}
        onChange={(s) => setTaskStatus(task.id, s)}
        options={STATUSES.map((s) => ({ id: s.id, label: s.short }))}
      />
      <div className="detail-rows">
        <Row
          icon={SOURCES[task.source].icon}
          title="Quelle"
          detail={task.sourceDetail}
          trailing={
            task.chatId ? (
              <Link className="row-link" to={`/chat/${task.chatId}`}>
                Chat öffnen
              </Link>
            ) : undefined
          }
        />
        {task.due && <Row icon="calendar" title="Fällig" detail={task.due} />}
        {task.dependsOn && <Row icon="clock" title="Abhängig von" detail={task.dependsOn} />}
        {person && (
          <Row
            icon="user"
            title={person.name}
            detail={person.relation}
            trailing={
              <Link className="row-link" to={`/me/netzwerk?person=${person.id}`}>
                Im Netzwerk
              </Link>
            }
          />
        )}
        {task.notes && <Row icon="pencil" title="Notizen" detail={task.notes} />}
      </div>
    </Sheet>
  );
}

export function AddTaskSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addTask } = useStore();
  const [title, setTitle] = useState('');
  const [area, setArea] = useState<Area>('haushalt');

  const save = () => {
    if (!title.trim()) return;
    addTask({
      id: `t${Date.now()}`,
      title: title.trim(),
      area,
      source: 'chat',
      sourceDetail: 'Manuell angelegt',
      status: 'todo',
    });
    setTitle('');
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Neue Aufgabe"
      footer={
        <button className="btn btn-primary btn-block" onClick={save} disabled={!title.trim()}>
          Hinzufügen
        </button>
      }
    >
      <label className="field">
        <span className="field-label">Was ist zu tun?</span>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder="z. B. Geschenk für Jonas besorgen"
        />
      </label>
      <div className="field">
        <span className="field-label">Lebensbereich</span>
        <div className="chip-wrap">
          {(Object.keys(AREAS) as Area[]).map((a) => (
            <Chip key={a} active={area === a} onClick={() => setArea(a)} color={`var(--area-${a})`}>
              {AREAS[a].label}
            </Chip>
          ))}
        </div>
      </div>
      <p className="hint">
        <Icon name="sparkle" size={14} /> Tipp: Aufgaben entstehen auch automatisch aus Chats, Mails und Messengern.
      </p>
    </Sheet>
  );
}
