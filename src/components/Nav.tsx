import { NavLink } from 'react-router-dom';
import { USER } from '../data/profile';
import { useStore } from '../lib/store';
import { resolveDark } from '../lib/useTheme';
import { Icon, type IconName } from './Icon';
import { Logo } from './ui';

export const NAV: Array<{ to: string; label: string; icon: IconName }> = [
  { to: '/chat', label: 'Chat', icon: 'chat' },
  { to: '/tasks', label: 'Aufgaben', icon: 'kanban' },
  { to: '/agents', label: 'Agents', icon: 'bot' },
  { to: '/me', label: 'Ich', icon: 'brain' },
  { to: '/settings', label: 'Einstellungen', icon: 'settings' },
];

/** Bottom tab bar – the primary navigation on phones. */
export function TabBar() {
  const { tasks } = useStore();
  const open = tasks.filter((t) => t.status === 'todo').length;
  return (
    <nav className="tabbar" aria-label="Hauptnavigation">
      {NAV.map((n) => (
        <NavLink key={n.to} to={n.to} className="tab">
          <span className="tab-icon">
            <Icon name={n.icon} size={22} />
            {n.to === '/tasks' && open > 0 && <span className="tab-badge">{open}</span>}
          </span>
          <span className="tab-label">{n.to === '/settings' ? 'Mehr' : n.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

/** Left sidebar – replaces the tab bar from tablet width upwards. */
export function SideNav() {
  const { tasks, themePref, setThemePref } = useStore();
  const open = tasks.filter((t) => t.status === 'todo').length;
  const dark = resolveDark(themePref);
  return (
    <aside className="sidenav" aria-label="Hauptnavigation">
      <div className="sidenav-brand">
        <Logo size={36} />
        <div>
          <div className="brand-name">Agent-J</div>
          <div className="brand-tag">Dein Assistent</div>
        </div>
      </div>
      <nav className="sidenav-links">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} className="sidenav-link">
            <Icon name={n.icon} />
            <span>{n.label}</span>
            {n.to === '/tasks' && open > 0 && <span className="sidenav-count">{open}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="sidenav-foot">
        <div className="sidenav-user">
          <span className="initials">{USER.name[0]}</span>
          <span className="sidenav-user-name">{USER.name}</span>
        </div>
        <button
          className="icon-btn"
          title={dark ? 'Hell' : 'Dunkel'}
          aria-label="Theme wechseln"
          onClick={() => setThemePref(dark ? 'light' : 'dark')}
        >
          <Icon name={dark ? 'sun' : 'moon'} />
        </button>
      </div>
    </aside>
  );
}
