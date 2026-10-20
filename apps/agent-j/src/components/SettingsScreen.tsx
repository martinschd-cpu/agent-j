import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ConnectedAccount, Settings } from '@/api/types';
import { formatEur } from '@/lib/format';
import { useActions } from '@/state/actions';
import { useAccounts, useBilling, useMe, useSettings, useWorkspaces } from '@/state/queries';
import { useUi } from '@/state/ui';
import { colors, layout } from '@/theme/tokens';
import { Icon } from './Icon';
import { Sidebar } from './Sidebar';
import { IconButton, InfoTable, Switch, Touchable, Txt } from './ui';

export function SettingsScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= layout.sidebarBreakpoint;
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
      {wide && <Sidebar mode="settings" />}
      <View style={{ flex: 1, minWidth: 0 }}>
        {!wide && (
          <View style={styles.topBar}>
            <IconButton label="Zurück zum Chat" onPress={() => router.back()}>
              <Icon name="back" size={17} strokeWidth={2} color={colors.text2} />
            </IconButton>
            <Txt size={15} weight={600}>
              Zurück zum Chat
            </Txt>
          </View>
        )}
        <ScrollView
          contentContainerStyle={[
            styles.content,
            !wide && { paddingHorizontal: 16, paddingTop: 20 },
          ]}
        >
          <Txt size={26} weight={700} display color={colors.navy} accessibilityRole="header">
            Einstellungen
          </Txt>
          <AccountSection />
          <WorkspaceSection />
          <AccountsSection />
          <NotificationSection />
          <BillingSection />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 3 }}>
        <Txt size={16} weight={600} accessibilityRole="header">
          {title}
        </Txt>
        {subtitle && (
          <Txt size={13.5} color={colors.muted}>
            {subtitle}
          </Txt>
        )}
      </View>
      {children}
    </View>
  );
}

const ROW = { v: 14, h: 16 };

function AccountSection() {
  const { data: me } = useMe();
  return (
    <Section title="Konto">
      <View style={styles.box}>
        <InfoTable
          size={14}
          padding={ROW}
          valueWeight={400}
          rows={[
            { label: 'Name', value: me?.displayName ?? '' },
            { label: 'E-Mail', value: me?.email ?? '' },
            {
              label: 'Zwei-Faktor-Anmeldung',
              value: me?.twoFactorEnabled ? 'Aktiv' : 'Aus',
              valueColor: me?.twoFactorEnabled ? colors.success : colors.muted,
              valueWeight: 600,
            },
          ]}
        />
      </View>
    </Section>
  );
}

function WorkspaceSection() {
  const { data: workspaces = [] } = useWorkspaces();
  return (
    <Section title="Workspaces" subtitle="Privates und Berufliches bleibt getrennt.">
      <View style={styles.cards}>
        {workspaces.map((w) => (
          <View key={w.id} style={styles.wsCard}>
            <Txt size={15} weight={600}>
              {w.name}
            </Txt>
            <Txt size={13} lineHeight={19.5} color={colors.muted}>
              {w.description}
            </Txt>
          </View>
        ))}
      </View>
    </Section>
  );
}

function AccountsSection() {
  const { data: accounts = [] } = useAccounts();
  const { data: workspaces = [] } = useWorkspaces();
  const actions = useActions();
  const setNotice = useUi((s) => s.setNotice);
  const toggle = (a: ConnectedAccount) =>
    actions.setAccountConnected(a, !a.connected).catch(() => setNotice('Das hat nicht geklappt.'));
  return (
    <Section
      title="Verbundene Accounts"
      subtitle="Aus diesen Quellen füllt Agent-J deine Datentöpfe."
    >
      <View style={styles.list}>
        {accounts.map((a, i) => {
          const ws = workspaces.find((w) => w.id === a.workspaceId)?.name ?? '';
          return (
            <View key={a.id} style={[styles.listRow, i < accounts.length - 1 && styles.listBorder]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt size={14.5} weight={500}>
                  {a.name}
                </Txt>
                <Txt size={12.5} color={a.connected ? colors.success : colors.muted}>
                  {a.connected ? `Verbunden · ${ws}` : 'Nicht verbunden'}
                </Txt>
              </View>
              <Touchable
                accessibilityRole="button"
                accessibilityLabel={`${a.name} ${a.connected ? 'trennen' : 'verbinden'}`}
                onPress={() => void toggle(a)}
                hitSlop={5}
                style={[
                  styles.connect,
                  a.connected
                    ? {
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: colors.borderControl,
                      }
                    : { backgroundColor: colors.primary },
                ]}
                hoverStyle={{
                  backgroundColor: a.connected ? colors.hoverSoft : colors.primaryDark,
                }}
              >
                <Txt size={13} weight={600} color={a.connected ? colors.text2 : '#FFFFFF'}>
                  {a.connected ? 'Trennen' : 'Verbinden'}
                </Txt>
              </Touchable>
            </View>
          );
        })}
      </View>
    </Section>
  );
}

function NotificationSection() {
  const { data: settings } = useSettings();
  const actions = useActions();
  const setNotice = useUi((s) => s.setNotice);
  if (!settings) return null;

  const update = (patch: Partial<Settings>) =>
    actions.updateSettings(patch).catch(() => setNotice('Das hat nicht geklappt.'));
  const rows: { label: string; sub: string; value: boolean; set: (v: boolean) => void }[] = [
    {
      label: 'Antworten vorlesen',
      sub: 'Im Sprachmodus antwortet Agent-J auch mit Stimme',
      value: settings.readAloud,
      set: (readAloud) => void update({ readAloud }),
    },
    {
      label: 'Fragen sammeln',
      sub: 'Statt zu unterbrechen, landet alles unter „Requests“',
      value: settings.collectQuestions,
      set: (collectQuestions) => void update({ collectQuestions }),
    },
    {
      label: 'Push für Freigaben',
      sub: 'Damit nichts liegen bleibt',
      value: settings.pushForApprovals,
      set: (pushForApprovals) => void update({ pushForApprovals }),
    },
    {
      label: 'Ruhezeiten',
      sub: `${settings.quietHours.from} bis ${settings.quietHours.to} keine Benachrichtigungen`,
      value: settings.quietHours.enabled,
      set: (enabled) => void update({ quietHours: { ...settings.quietHours, enabled } }),
    },
  ];

  return (
    <Section title="Sprache und Benachrichtigungen">
      <View style={styles.list}>
        {rows.map((r, i) => (
          <View
            key={r.label}
            style={[
              styles.listRow,
              { paddingVertical: 13 },
              i < rows.length - 1 && styles.listBorder,
            ]}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Txt size={14.5} weight={500}>
                {r.label}
              </Txt>
              <Txt size={12.5} color={colors.muted}>
                {r.sub}
              </Txt>
            </View>
            <Switch value={r.value} onChange={r.set} label={r.label} variant="settings" />
          </View>
        ))}
      </View>
    </Section>
  );
}

function BillingSection() {
  const { data: billing } = useBilling();
  if (!billing) return null;
  return (
    <Section
      title="Abrechnung"
      subtitle="Nach Verbrauch. Was ein Flow kostet, siehst du direkt am Flow."
    >
      <View style={styles.box}>
        <InfoTable
          size={14}
          padding={ROW}
          valueWeight={600}
          rows={[
            {
              label: `${billing.monthLabel} bisher`,
              value: billing.spentEur === null ? 'noch nichts' : formatEur(billing.spentEur),
            },
            {
              label: 'Monatslimit',
              value: billing.limitEur === null ? 'kein Limit' : formatEur(billing.limitEur),
            },
            { label: 'Zahlungsmethode', value: billing.paymentMethod ?? 'keine', valueWeight: 400 },
          ]}
        />
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: colors.bg },
  topBar: {
    height: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  content: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingTop: 40,
    paddingHorizontal: 28,
    paddingBottom: 64,
    gap: 36,
  },
  box: { borderRadius: 12, borderColor: colors.border },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  wsCard: {
    flexGrow: 1,
    flexBasis: 240,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  list: { borderWidth: 1, borderColor: colors.border, borderRadius: 12 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  listBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  connect: { height: 34, paddingHorizontal: 14, borderRadius: 8, justifyContent: 'center' },
});
