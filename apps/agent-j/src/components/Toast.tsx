import { useEffect, useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';

import { useUndoController } from '@/state/api-context';
import { useUi } from '@/state/ui';
import { colors, shadow } from '@/theme/tokens';
import { Touchable, Txt } from './ui';

/** "Rückgängig" toast for the pending undoable action, or a short notice. */
export function Toast({ bottom = 128 }: { bottom?: number }) {
  const undo = useUndoController();
  const pending = useSyncExternalStore(undo.subscribe, undo.getPending, undo.getPending);
  const notice = useUi((s) => s.notice);
  const setNotice = useUi((s) => s.setNotice);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(t);
  }, [notice, setNotice]);

  const text = pending?.label ?? notice;
  if (!text) return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
      <View
        accessibilityRole={pending ? 'none' : 'alert'}
        accessibilityLiveRegion="polite"
        aria-live="polite"
        style={[styles.toast, shadow.toast, !pending && { paddingRight: 16 }]}
      >
        <Txt size={14} color="#FFFFFF" style={{ flexShrink: 1 }}>
          {text}
        </Txt>
        {pending && (
          <Touchable
            accessibilityRole="button"
            accessibilityLabel={`Rückgängig: ${pending.label}`}
            onPress={() => undo.undo()}
            hitSlop={4}
            style={styles.undo}
          >
            <Txt size={13.5} weight={600} color={colors.toastButtonText}>
              Rückgängig
            </Txt>
          </Touchable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 50 },
  toast: {
    maxWidth: 560,
    backgroundColor: colors.navy,
    borderRadius: 12,
    paddingVertical: 6,
    paddingLeft: 16,
    paddingRight: 6,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  undo: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.toastButton,
    justifyContent: 'center',
  },
});
