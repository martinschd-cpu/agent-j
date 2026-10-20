import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Image, ScrollView, StyleSheet, View } from 'react-native';

import type { AgentRequest, Chat, RequestOption } from '@/api/types';
import { chatAgeGroup, type ChatAgeGroup } from '@/lib/dates';
import { useActions } from '@/state/actions';
import { useApi } from '@/state/api-context';
import { keys, useFlows, useMe, useRequests } from '@/state/queries';
import { useActiveChat, usePanel } from '@/state/selectors';
import { useUi, type SidebarSection } from '@/state/ui';
import { colors, layout, requestKindColor, requestKindLabel, shadow } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Dot, Segmented, Touchable, Txt } from './ui';

const logo = require('../../assets/logo.png');

const GROUP_ORDER: ChatAgeGroup[] = ['Heute', 'Gestern', 'Letzte Woche', 'Älter'];

export const MENU_ITEMS = [
  'Konto',
  'Workspaces',
  'Verbundene Accounts',
  'Sprache und Benachrichtigungen',
  'Abrechnung',
];

/**
 * Left navigation. `mode="settings"` is the reduced variant next to the settings screen, where
 * every entry leads back to the chat.
 */
export function Sidebar({ mode = 'chat' }: { mode?: 'chat' | 'settings' }) {
  const api = useApi();
  const qc = useQueryClient();
  const ui = useUi();
  const { data: requests = [] } = useRequests(ui.workspaceId);
  const { data: flows = [] } = useFlows();
  const activeFlows = flows.filter((f) => f.enabled).length;
  const inSettings = mode === 'settings';

  const goToChat = () => {
    if (inSettings) router.back();
  };

  const newChat = async () => {
    const chat = await api.createChat(ui.workspaceId);
    qc.setQueryData<Chat[]>(keys.chats(ui.workspaceId), (list) => [chat, ...(list ?? [])]);
    qc.setQueryData(keys.messages(chat.id), []);
    ui.openChat(chat.id);
    ui.setPanel(null);
    goToChat();
  };

  const nav = (section: SidebarSection) => {
    ui.setSidebar(section);
    goToChat();
  };

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <View style={styles.brand}>
          <Image source={logo} style={styles.logo} accessibilityLabel="Agent-J Logo" />
          <Txt size={18} weight={700} display color={colors.navy}>
            Agent-J
          </Txt>
        </View>
        <Touchable
          accessibilityRole="button"
          onPress={newChat}
          style={styles.newChat}
          hoverStyle={{ backgroundColor: colors.hoverSoft }}
        >
          <Icon name="plus" size={17} strokeWidth={2} color={colors.navy} />
          <Txt size={14} weight={600} color={colors.navy}>
            Neuer Chat
          </Txt>
        </Touchable>
        <View accessibilityRole="menu" aria-label="Hauptnavigation" style={styles.nav}>
          <NavItem
            icon="chat"
            label="Chats"
            current={!inSettings && ui.sidebar === 'chats'}
            onPress={() => nav('chats')}
          />
          <NavItem
            icon="inbox"
            label="Requests"
            current={!inSettings && ui.sidebar === 'requests'}
            onPress={() => nav('requests')}
            badge={requests.length > 0 ? String(requests.length) : undefined}
          />
          <NavItem
            icon="flow"
            label="Flows"
            current={!inSettings && ui.sidebar === 'flows'}
            onPress={() => nav('flows')}
            trailing={`${activeFlows} aktiv`}
          />
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {!inSettings && ui.sidebar === 'chats' && <ChatList />}
        {!inSettings && ui.sidebar === 'requests' && <RequestList requests={requests} />}
        {!inSettings && ui.sidebar === 'flows' && <FlowList />}
      </ScrollView>

      <View style={styles.footer}>
        <Segmented
          label="Workspace"
          value={ui.workspaceId}
          onChange={(id) => {
            ui.setWorkspace(id);
            goToChat();
          }}
          options={[
            { value: 'privat', label: 'Privat' },
            { value: 'arbeit', label: 'Arbeit' },
          ]}
        />
        <UserMenu />
      </View>
    </View>
  );
}

function NavItem({
  icon,
  label,
  current,
  onPress,
  badge,
  trailing,
}: {
  icon: IconName;
  label: string;
  current: boolean;
  onPress: () => void;
  badge?: string;
  trailing?: string;
}) {
  return (
    <Touchable
      accessibilityRole="menuitem"
      accessibilityState={{ selected: current }}
      aria-current={current ? 'page' : undefined}
      accessibilityLabel={
        badge ? `${label}, ${badge} offen` : trailing ? `${label}, ${trailing}` : label
      }
      onPress={onPress}
      style={[styles.navItem, current && { backgroundColor: colors.active }]}
      hoverStyle={{ backgroundColor: colors.hover }}
    >
      <Icon name={icon} color={colors.ink} />
      <Txt size={14} weight={500} style={{ flex: 1 }}>
        {label}
      </Txt>
      {badge && (
        <View style={styles.badge}>
          <Txt size={11.5} weight={700} color="#FFFFFF" lineHeight={14}>
            {badge}
          </Txt>
        </View>
      )}
      {trailing && (
        <Txt size={12} color={colors.muted}>
          {trailing}
        </Txt>
      )}
    </Touchable>
  );
}

function ChatList() {
  const { chat: active, chats } = useActiveChat();
  const openChat = useUi((s) => s.openChat);
  const now = new Date();
  const groups = GROUP_ORDER.map((label) => ({
    label,
    items: chats.filter((c) => chatAgeGroup(c.updatedAt, now) === label),
  })).filter((g) => g.items.length > 0);

  return (
    <View style={{ gap: 12 }}>
      {groups.map((g) => (
        <View key={g.label} style={{ gap: 1 }}>
          <Txt
            size={12}
            weight={600}
            color={colors.muted}
            style={styles.groupLabel}
            accessibilityRole="header"
          >
            {g.label}
          </Txt>
          {g.items.map((c) => {
            const on = c.id === active?.id;
            return (
              <Touchable
                key={c.id}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => openChat(c.id)}
                style={[styles.chatItem, on && { backgroundColor: colors.active }]}
                hoverStyle={{ backgroundColor: colors.hover }}
              >
                <Txt size={13.5} weight={on ? 600 : 400} color={colors.text3} numberOfLines={1}>
                  {c.title}
                </Txt>
              </Touchable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function RequestList({ requests }: { requests: AgentRequest[] }) {
  const actions = useActions();
  return (
    <View style={{ gap: 8, paddingTop: 4 }}>
      <Txt
        size={12.5}
        color={colors.muted}
        lineHeight={18}
        style={{ paddingHorizontal: 6, paddingBottom: 4 }}
      >
        Was Agent-J mit dir klären will. Antworte direkt hier.
      </Txt>
      {requests.map((r) => (
        <View key={r.id} style={styles.request}>
          <Txt
            size={11}
            weight={700}
            color={requestKindColor[r.kind]}
            style={{ letterSpacing: 0.55, textTransform: 'uppercase' }}
          >
            {requestKindLabel[r.kind]}
          </Txt>
          <Txt size={13.5} lineHeight={19}>
            {r.text}
          </Txt>
          <View style={styles.requestButtons}>
            {r.options.map((o: RequestOption, i) => (
              <Touchable
                key={o.label}
                accessibilityRole="button"
                accessibilityHint={o.confirmation}
                onPress={() => void actions.answerRequest(r, o)}
                hitSlop={5}
                style={[
                  styles.requestButton,
                  i === 0 ? styles.requestPrimary : styles.requestSecondary,
                ]}
                hoverStyle={{ backgroundColor: i === 0 ? colors.primaryDark : colors.hoverSoft }}
              >
                <Txt size={12.5} weight={600} color={i === 0 ? '#FFFFFF' : colors.text2}>
                  {o.label}
                </Txt>
              </Touchable>
            ))}
          </View>
        </View>
      ))}
      {requests.length === 0 && (
        <Txt size={13.5} color={colors.muted} style={{ padding: 8 }}>
          Alles geklärt. Nichts offen.
        </Txt>
      )}
    </View>
  );
}

function FlowList() {
  const { data: flows = [] } = useFlows();
  const panel = usePanel();
  const setPanel = useUi((s) => s.setPanel);
  const selected = panel?.type === 'flows' ? panel.refId : undefined;
  return (
    <View style={{ gap: 1, paddingTop: 4 }}>
      <Txt
        size={12}
        weight={600}
        color={colors.muted}
        style={styles.groupLabel}
        accessibilityRole="header"
      >
        Meine Flows
      </Txt>
      {flows.map((f) => (
        <Touchable
          key={f.id}
          accessibilityRole="button"
          accessibilityState={{ selected: selected === f.id }}
          accessibilityLabel={`${f.name}, ${f.trigger}, ${f.enabled ? 'aktiv' : 'pausiert'}`}
          onPress={() => setPanel({ type: 'flows', refId: f.id })}
          style={[styles.flowItem, selected === f.id && { backgroundColor: colors.active }]}
          hoverStyle={{ backgroundColor: colors.hover }}
        >
          <Dot color={f.enabled ? colors.success : colors.switchOff} />
          <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
            <Txt size={13.5} weight={500} color={colors.text3}>
              {f.name}
            </Txt>
            <Txt size={12} color={colors.muted} numberOfLines={1}>
              {f.trigger}
              {f.enabled ? '' : ' · pausiert'}
            </Txt>
          </View>
        </Touchable>
      ))}
      <Txt
        size={12.5}
        color={colors.muted}
        lineHeight={18}
        style={{ paddingHorizontal: 10, paddingTop: 10 }}
      >
        Neue Flows beschreibst du einfach im Chat.
      </Txt>
    </View>
  );
}

function UserMenu() {
  const { data: me } = useMe();
  const open = useUi((s) => s.menuOpen);
  const setOpen = useUi((s) => s.setMenuOpen);
  const setDrawerOpen = useUi((s) => s.setDrawerOpen);

  const goToSettings = () => {
    setOpen(false);
    setDrawerOpen(false);
    router.push('/settings');
  };

  return (
    <View style={{ position: 'relative' }}>
      {open && (
        <View style={[styles.menu, shadow.popover]} accessibilityRole="menu">
          <Txt
            size={12}
            color={colors.muted}
            style={{ paddingHorizontal: 10, paddingTop: 8, paddingBottom: 6 }}
          >
            {me?.email ?? ''}
          </Txt>
          {MENU_ITEMS.map((item) => (
            <Touchable
              key={item}
              accessibilityRole="menuitem"
              onPress={goToSettings}
              style={styles.menuItem}
              hoverStyle={{ backgroundColor: colors.hoverSoft }}
            >
              <Txt size={14}>{item}</Txt>
            </Touchable>
          ))}
          <View style={styles.menuDivider} />
          <Touchable
            accessibilityRole="menuitem"
            accessibilityState={{ disabled: true }}
            accessibilityHint="Anmeldung ist in dieser Version noch nicht angebunden"
            onPress={() => setOpen(false)}
            style={styles.menuItem}
            hoverStyle={{ backgroundColor: colors.hoverSoft }}
          >
            <Txt size={14} color={colors.danger}>
              Abmelden
            </Txt>
          </Touchable>
        </View>
      )}
      <Touchable
        accessibilityRole="button"
        accessibilityLabel={`${me?.firstName ?? 'Konto'}, Einstellungen`}
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        onPress={() => setOpen(!open)}
        style={[styles.userButton, open && { backgroundColor: colors.active }]}
        hoverStyle={{ backgroundColor: colors.hover }}
      >
        <View style={styles.avatar}>
          <Txt size={12.5} weight={600} color="#FFFFFF">
            {me?.initials ?? ''}
          </Txt>
        </View>
        <View style={{ flex: 1 }}>
          <Txt size={14} weight={500}>
            {me?.firstName ?? ''}
          </Txt>
          <Txt size={12} color={colors.muted}>
            Einstellungen
          </Txt>
        </View>
        <Icon name="chevronUp" size={16} strokeWidth={2} color={colors.muted} />
      </Touchable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: layout.sidebarWidth,
    height: '100%',
    backgroundColor: colors.sidebar,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  top: { paddingTop: 16, paddingHorizontal: 14, paddingBottom: 10, gap: 14 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 },
  logo: { width: 34, height: 34, borderRadius: 17 },
  newChat: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.borderControl,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  nav: { gap: 2 },
  navItem: {
    height: 44,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 4, paddingHorizontal: 10, paddingBottom: 12 },
  groupLabel: { paddingVertical: 6, paddingHorizontal: 10 },
  chatItem: { minHeight: 44, borderRadius: 8, paddingHorizontal: 10, justifyContent: 'center' },
  request: {
    borderWidth: 1,
    borderColor: colors.borderCard,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  requestButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  requestButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  requestPrimary: { backgroundColor: colors.primary },
  requestSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderControl,
  },
  flowItem: {
    minHeight: 44,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  menu: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderCard,
    borderRadius: 12,
    padding: 6,
    gap: 1,
    zIndex: 5,
  },
  menuItem: { minHeight: 44, borderRadius: 8, paddingHorizontal: 10, justifyContent: 'center' },
  menuDivider: {
    height: 1,
    backgroundColor: colors.borderSoft,
    marginVertical: 4,
    marginHorizontal: 6,
  },
  userButton: {
    height: 46,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 6,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
