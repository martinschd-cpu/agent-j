import { ScrollView, StyleSheet, View } from 'react-native';

import type { PanelRef, PanelType } from '@/api/types';
import { useFlows, useWorkspaces } from '@/state/queries';
import { useUi } from '@/state/ui';
import { colors, layout } from '@/theme/tokens';
import { Icon } from '../Icon';
import { IconButton, Txt } from '../ui';
import { FlowDetail, FlowList } from './FlowsPanel';
import { NetworkPanel } from './NetworkPanel';
import { ProfilePanel } from './ProfilePanel';
import { TasksPanel } from './TasksPanel';

const TITLES: Record<PanelType, [string, string]> = {
  tasks: ['Aufgaben', 'Datentopf Aufgaben'],
  flows: ['Flows', 'Automatisierungen in einfacher Sprache'],
  network: ['Netzwerk', 'Datentopf Kontakte'],
  profile: ['Über mich', 'Datentopf Wissen'],
};

export function SidePanel({ panel, fullWidth }: { panel: PanelRef; fullWidth?: boolean }) {
  const setPanel = useUi((s) => s.setPanel);
  const ws = useUi((s) => s.workspaceId);
  const { data: workspaces = [] } = useWorkspaces();
  const { data: flows = [] } = useFlows();
  const flow =
    panel.type === 'flows' && panel.refId ? flows.find((f) => f.id === panel.refId) : undefined;

  let [title, subtitle] = TITLES[panel.type];
  if (panel.type === 'tasks') subtitle += ` · ${workspaces.find((w) => w.id === ws)?.name ?? ''}`;
  if (flow) [title, subtitle] = [flow.name, 'Flow'];

  return (
    <View
      accessibilityLabel="Seitenfenster"
      style={[
        styles.root,
        fullWidth ? { flex: 1 } : { width: layout.panelWidth, borderLeftWidth: 1 },
      ]}
    >
      <View style={styles.header}>
        {flow && (
          <IconButton
            label="Zurück zu allen Flows"
            size={40}
            onPress={() => setPanel({ type: 'flows' })}
          >
            <Icon name="back" size={17} strokeWidth={2} color={colors.text2} />
          </IconButton>
        )}
        <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
          <Txt size={15} weight={600} accessibilityRole="header" numberOfLines={1}>
            {title}
          </Txt>
          <Txt size={12} color={colors.muted} numberOfLines={1}>
            {subtitle}
          </Txt>
        </View>
        <IconButton label="Seitenfenster schließen" onPress={() => setPanel(null)}>
          <Icon name="close" size={17} strokeWidth={2} color={colors.text2} />
        </IconButton>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {panel.type === 'tasks' && <TasksPanel />}
        {panel.type === 'flows' && (flow ? <FlowDetail flow={flow} /> : <FlowList />)}
        {panel.type === 'network' && <NetworkPanel selectedId={panel.refId} />}
        {panel.type === 'profile' && <ProfilePanel />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.bg, borderLeftColor: colors.border },
  header: {
    height: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 20,
    paddingRight: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  content: { paddingTop: 18, paddingHorizontal: 20, paddingBottom: 24 },
});
