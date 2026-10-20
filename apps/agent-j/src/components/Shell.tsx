import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePanel } from '@/state/selectors';
import { useUi } from '@/state/ui';
import { colors, layout } from '@/theme/tokens';
import { ChatView } from './chat/ChatView';
import { SidePanel } from './panels/SidePanel';
import { Sidebar } from './Sidebar';
import { Toast } from './Toast';

/**
 * Wide: sidebar, chat and panel side by side. Medium: the panel covers the chat from the right.
 * Narrow (phones): the sidebar is a drawer and the panel a full screen sheet.
 */
export function Shell() {
  const { width } = useWindowDimensions();
  const panel = usePanel();
  const drawerOpen = useUi((s) => s.drawerOpen);
  const setDrawerOpen = useUi((s) => s.setDrawerOpen);
  const setPanel = useUi((s) => s.setPanel);

  const sidebarInline = width >= layout.sidebarBreakpoint;
  const panelInline = width >= layout.panelBreakpoint;
  const panelSheet = !sidebarInline;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.row}>
        {sidebarInline && <Sidebar />}
        <ChatView compact={!sidebarInline} onOpenDrawer={() => setDrawerOpen(true)} />
        {panel && panelInline && <SidePanel panel={panel} />}
      </View>

      {panel && !panelInline && !panelSheet && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Pressable
            accessibilityLabel="Seitenfenster schließen"
            style={[StyleSheet.absoluteFill, styles.backdrop]}
            onPress={() => setPanel(null)}
          />
          <View style={styles.overlayPanel} accessibilityViewIsModal>
            <SidePanel panel={panel} />
          </View>
        </View>
      )}

      {panel && panelSheet && (
        <View style={[StyleSheet.absoluteFill, styles.sheet]} accessibilityViewIsModal>
          <SidePanel panel={panel} fullWidth />
        </View>
      )}

      {!sidebarInline && drawerOpen && (
        <View style={StyleSheet.absoluteFill}>
          <Pressable
            accessibilityLabel="Navigation schließen"
            style={[StyleSheet.absoluteFill, styles.backdrop]}
            onPress={() => setDrawerOpen(false)}
          />
          <View style={styles.drawer} accessibilityViewIsModal>
            <Sidebar />
          </View>
        </View>
      )}

      <Toast bottom={panelSheet ? 24 : 160} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  row: { flex: 1, flexDirection: 'row', minHeight: 0 },
  backdrop: { backgroundColor: 'rgba(15,35,64,0.28)' },
  overlayPanel: { position: 'absolute', top: 0, right: 0, bottom: 0, backgroundColor: colors.bg },
  sheet: { backgroundColor: colors.bg, zIndex: 20 },
  drawer: { position: 'absolute', top: 0, left: 0, bottom: 0, maxWidth: '86%', zIndex: 30 },
});
