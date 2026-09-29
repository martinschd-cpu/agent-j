import { useMemo, useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Chip, IconButton, TopBar } from '../../components/ui';
import { AREAS, SOURCES, STATUSES } from '../../data/meta';
import { personById } from '../../data/network';
import type { Area, Source, Status, Task } from '../../data/types';
import { useStore } from '../../lib/store';
import { AddTaskSheet, TaskDetailSheet } from './TaskSheets';

export function TasksScreen() {
  const { tasks, setTaskStatus } = useStore();
  const [area, setArea] = useState<Area | 'all'>('all');
  const [source, setSource] = useState<Source | 'all'>('all');
  const [active, setActive] = useState<Status>('todo');
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [dragOver, setDragOver] = useState<Status | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => tasks.filter((t) => (area === 'all' || t.area === area) && (source === 'all' || t.source === source)),
    [tasks, area, source],
  );

  // On phones the board is a horizontal pager; the status tiles act as its tabs.
  const showColumn = (s: Status) => {
    setActive(s);
    const board = boardRef.current;
    const col = board?.querySelector<HTMLElement>(`[data-status="${s}"]`);
    if (board && col) board.scrollTo({ left: col.offsetLeft - board.offsetLeft, behavior: 'smooth' });
  };

  const onBoardScroll = () => {
    const board = boardRef.current;
    if (!board || board.scrollWidth <= board.clientWidth + 4) return;
    const cols = Array.from(board.querySelectorAll<HTMLElement>('[data-status]'));
    const idx = Math.round(board.scrollLeft / (cols[1].offsetLeft - cols[0].offsetLeft));
    const s = STATUSES[Math.min(Math.max(idx, 0), 3)].id;
    if (s !== active) setActive(s);
  };

  const openTask = tasks.find((t) => t.id === openId) ?? null;

  return (
    <div className="page tasks-page">
      <TopBar
        title="Aufgaben"
        subtitle="Aus Chats, E-Mails, Kalender & Messengern"
        actions={<IconButton icon="plus" label="Aufgabe hinzufügen" variant="primary" onClick={() => setAdding(true)} />}
      />
      <div className="page-body">
        <div className="stat-tiles">
          {STATUSES.map((s) => (
            <button
              key={s.id}
              className={`stat-tile st-${s.id}${active === s.id ? ' active' : ''}`}
              onClick={() => showColumn(s.id)}
            >
              <span className="stat-count">{filtered.filter((t) => t.status === s.id).length}</span>
              <span className="stat-label">{s.short}</span>
            </button>
          ))}
        </div>

        <div className="filters">
          <div className="chip-row">
            <Chip active={area === 'all'} onClick={() => setArea('all')}>
              Alle Bereiche
            </Chip>
            {(Object.keys(AREAS) as Area[]).map((a) => (
              <Chip key={a} active={area === a} onClick={() => setArea(a)} color={`var(--area-${a})`}>
                {AREAS[a].label}
              </Chip>
            ))}
          </div>
          <div className="chip-row">
            <Chip active={source === 'all'} onClick={() => setSource('all')}>
              Alle Quellen
            </Chip>
            {(Object.keys(SOURCES) as Source[]).map((s) => (
              <Chip key={s} active={source === s} onClick={() => setSource(s)} icon={SOURCES[s].icon}>
                {SOURCES[s].label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="board" ref={boardRef} onScroll={onBoardScroll}>
          {STATUSES.map((s) => {
            const items = filtered.filter((t) => t.status === s.id);
            return (
              <div
                key={s.id}
                data-status={s.id}
                className={`column${dragOver === s.id ? ' drag-over' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(s.id);
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData('text/plain');
                  if (id) setTaskStatus(id, s.id);
                  setDragOver(null);
                }}
              >
                <div className="column-head">
                  <span className={`status-dot st-${s.id}`} />
                  {s.label}
                  <span className="column-count">{items.length}</span>
                </div>
                <div className="column-body">
                  {items.map((t) => (
                    <TaskCard key={t.id} task={t} onOpen={() => setOpenId(t.id)} />
                  ))}
                  {!items.length && <div className="column-empty">Nichts hier</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <TaskDetailSheet task={openTask} onClose={() => setOpenId(null)} />
      <AddTaskSheet open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}

function TaskCard({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const person = task.personId ? personById(task.personId) : undefined;
  return (
    <button
      className={`task-card${task.status === 'done' ? ' is-done' : ''}`}
      style={{ '--area': `var(--area-${task.area})` } as React.CSSProperties}
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
      onClick={onOpen}
    >
      <span className="task-card-area">{AREAS[task.area].label}</span>
      <span className="task-card-title">{task.title}</span>
      {task.status === 'blocked' && task.dependsOn && (
        <span className="task-card-wait">
          <Icon name="clock" size={14} /> wartet auf {task.dependsOn}
        </span>
      )}
      <span className="task-card-meta">
        <span className="meta-item" title={SOURCES[task.source].label}>
          <Icon name={SOURCES[task.source].icon} size={14} />
          {SOURCES[task.source].label}
        </span>
        {task.due && (
          <span className="meta-item">
            <Icon name="calendar" size={14} />
            {task.due}
          </span>
        )}
        {person && (
          <span className="initials initials-sm" title={person.name}>
            {person.name.replace(/^(Dr\.|Frau|Herr)\s/, '')[0]}
          </span>
        )}
      </span>
    </button>
  );
}
