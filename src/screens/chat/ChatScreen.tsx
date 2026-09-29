import { useEffect, useRef, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Logo, TopBar } from '../../components/ui';
import { MODELS } from '../../data/profile';
import { mockReply } from '../../lib/mockReply';
import { useStore } from '../../lib/store';
import { Composer, RichText, TaskHint } from './parts';

export function ChatScreen() {
  const { chatId } = useParams();
  const { chats, tasks, modelId, addMessage, addTask } = useStore();
  const chat = chats.find((c) => c.id === chatId);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const model = MODELS.find((m) => m.id === modelId) ?? MODELS[0];

  const last = chat?.messages[chat.messages.length - 1];

  // Whenever the user has the last word, Agent-J "thinks" briefly and answers with a canned reply.
  useEffect(() => {
    if (!chat || last?.role !== 'user') return;
    setTyping(true);
    const timer = window.setTimeout(() => {
      const { message, newTask } = mockReply(last.text, tasks, model.name);
      if (newTask) addTask(newTask);
      addMessage(chat.id, message);
      setTyping(false);
    }, 1100);
    return () => {
      window.clearTimeout(timer);
      setTyping(false);
    };
  }, [chat?.id, chat?.messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat?.messages.length, typing]);

  if (!chat) return <Navigate to="/chat" replace />;

  return (
    <div className="conversation">
      <TopBar back="/chat" title={chat.title} subtitle={model.name} />
      <div className="messages" ref={scrollRef}>
        <div className="messages-inner">
          {chat.messages.map((m, i) =>
            m.role === 'user' ? (
              <div key={i} className="msg msg-user">
                <div className="bubble">{m.text}</div>
              </div>
            ) : (
              <div key={i} className="msg msg-agent">
                <Logo size={28} />
                <div className="msg-agent-body">
                  <RichText text={m.text} />
                  <TaskHint tasks={tasks.filter((t) => m.taskIds?.includes(t.id))} />
                </div>
              </div>
            ),
          )}
          {typing && (
            <div className="msg msg-agent">
              <Logo size={28} />
              <div className="typing" aria-label="Agent-J schreibt">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="composer-wrap">
        <Composer onSend={(text) => addMessage(chat.id, { role: 'user', text })} />
        <div className="composer-note">Agent-J kann Fehler machen. Wichtige Infos bitte prüfen.</div>
      </div>
    </div>
  );
}
