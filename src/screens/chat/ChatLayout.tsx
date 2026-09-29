import { useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { IconButton, Logo, TopBar } from '../../components/ui';
import type { ChatGroup } from '../../data/types';
import { useStore } from '../../lib/store';

const GROUPS: Array<{ id: ChatGroup; label: string }> = [
  { id: 'heute', label: 'Heute' },
  { id: 'gestern', label: 'Gestern' },
  { id: 'woche', label: 'Letzte 7 Tage' },
  { id: 'aelter', label: 'Älter' },
];

/**
 * Claude-style chat area: history on the left, conversation on the right. On phones only one of
 * the two panes is visible at a time (list at /chat, conversation at /chat/:id or /chat/new).
 */
export function ChatLayout() {
  const { chatId } = useParams();
  const { pathname } = useLocation();
  const hasChat = !!chatId || pathname === '/chat/new';
  return (
    <div className={`chat-layout${hasChat ? ' has-chat' : ''}`}>
      <ChatList />
      <div className="chat-pane">
        <Outlet />
      </div>
    </div>
  );
}

function ChatList() {
  const { chats } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(
      (c) => c.title.toLowerCase().includes(q) || c.messages.some((m) => m.text.toLowerCase().includes(q)),
    );
  }, [chats, query]);

  return (
    <div className="chat-list">
      <TopBar
        leading={<Logo size={32} />}
        title={
          <>
            <span className="only-mobile">Agent-J</span>
            <span className="only-desktop">Chats</span>
          </>
        }
        actions={<IconButton icon="plus" label="Neuer Chat" variant="soft" onClick={() => navigate('/chat/new')} />}
      />
      <div className="chat-list-body">
        <button className="new-chat-btn" onClick={() => navigate('/chat/new')}>
          <Icon name="plus" size={18} /> Neuer Chat
        </button>
        <label className="search">
          <Icon name="search" size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Chats durchsuchen" />
        </label>
        {GROUPS.map((g) => {
          const items = filtered.filter((c) => c.group === g.id);
          if (!items.length) return null;
          return (
            <div key={g.id} className="chat-group">
              <div className="chat-group-label">{g.label}</div>
              {items.map((c) => (
                <NavLink key={c.id} to={`/chat/${c.id}`} className="chat-item">
                  <span className="chat-item-title">{c.title}</span>
                  <span className="chat-item-preview">{c.messages[c.messages.length - 1]?.text.replace(/\*\*/g, '')}</span>
                </NavLink>
              ))}
            </div>
          );
        })}
        {!filtered.length && <p className="empty">Keine Chats gefunden.</p>}
      </div>
    </div>
  );
}
