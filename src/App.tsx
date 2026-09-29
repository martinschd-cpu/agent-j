import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { SideNav, TabBar } from './components/Nav';
import { useStore } from './lib/store';
import { useApplyTheme } from './lib/useTheme';
import { AgentEditorScreen } from './screens/agents/AgentEditorScreen';
import { AgentsScreen } from './screens/agents/AgentsScreen';
import { ChatLayout } from './screens/chat/ChatLayout';
import { ChatScreen } from './screens/chat/ChatScreen';
import { NewChatScreen } from './screens/chat/NewChatScreen';
import { MeScreen } from './screens/me/MeScreen';
import { SettingsScreen } from './screens/settings/SettingsScreen';
import { TasksScreen } from './screens/tasks/TasksScreen';

// Detail views get the full phone screen, like in the Claude app: no tab bar underneath.
const DETAIL_ROUTE = /^\/(chat\/[^/]+|agents\/[^/]+)$/;

export default function App() {
  const { themePref } = useStore();
  useApplyTheme(themePref);
  const { pathname } = useLocation();
  const isDetail = DETAIL_ROUTE.test(pathname);

  return (
    <div className={`shell${isDetail ? ' shell-detail' : ''}`}>
      <SideNav />
      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<ChatLayout />}>
            <Route index element={<NewChatScreen />} />
            <Route path="new" element={<NewChatScreen />} />
            <Route path=":chatId" element={<ChatScreen />} />
          </Route>
          <Route path="/tasks" element={<TasksScreen />} />
          <Route path="/agents" element={<AgentsScreen />} />
          <Route path="/agents/:agentId" element={<AgentEditorScreen />} />
          <Route path="/me" element={<MeScreen />} />
          <Route path="/me/netzwerk" element={<MeScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
      </main>
      <TabBar />
    </div>
  );
}
