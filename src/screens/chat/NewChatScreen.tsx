import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { Logo, TopBar } from '../../components/ui';
import { USER } from '../../data/profile';
import { useStore } from '../../lib/store';
import { Composer } from './parts';

const SUGGESTIONS = [
  { icon: 'sun', text: 'Was steht heute an?' },
  { icon: 'calendar', text: 'Plane meine Woche' },
  { icon: 'kanban', text: 'Erinnere mich, Pauls Turnbeutel zu waschen' },
  { icon: 'users', text: 'Welche Aufgaben warten auf andere?' },
] as const;

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Guten Morgen';
  if (h < 18) return 'Hallo';
  return 'Guten Abend';
}

export function NewChatScreen() {
  const { tasks, createChat } = useStore();
  const navigate = useNavigate();
  const todo = tasks.filter((t) => t.status === 'todo').length;
  const blocked = tasks.filter((t) => t.status === 'blocked').length;

  const start = (text: string) => {
    const id = `c${Date.now()}`;
    createChat({
      id,
      title: text.length > 42 ? `${text.slice(0, 40)}…` : text,
      group: 'heute',
      messages: [{ role: 'user', text }],
    });
    navigate(`/chat/${id}`);
  };

  return (
    <div className="conversation new-chat">
      <TopBar back="/chat" title="Neuer Chat" />
      <div className="new-chat-body">
        <div className="welcome">
          <Logo size={72} />
          <h2>
            {greeting()}, {USER.name}
          </h2>
          <p>Wobei kann ich dir heute helfen?</p>
        </div>
        <div className="composer-wrap composer-inline">
          <Composer onSend={start} />
        </div>
        <div className="suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s.text} className="suggestion" onClick={() => start(s.text)}>
              <Icon name={s.icon} size={16} />
              {s.text}
            </button>
          ))}
        </div>
        <button className="today-card" onClick={() => navigate('/tasks')}>
          <span className="today-card-icon">
            <Icon name="kanban" />
          </span>
          <span>
            <strong>{todo} offene Aufgaben</strong> · {blocked} warten auf andere
          </span>
          <Icon name="next" size={18} />
        </button>
      </div>
    </div>
  );
}
