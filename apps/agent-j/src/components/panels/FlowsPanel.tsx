import { StyleSheet, View } from 'react-native';

import type { Flow, FlowKind } from '@/api/types';
import { formatPast } from '@/lib/dates';
import { formatEur, formatThousands } from '@/lib/format';
import { useActions } from '@/state/actions';
import { useFlowhub, useFlows } from '@/state/queries';
import { useUi } from '@/state/ui';
import { colors } from '@/theme/tokens';
import { InfoTable, SectionLabel, Switch, Touchable, Txt } from '../ui';

const KIND_LABEL: Record<FlowKind, string> = {
  standard: 'Standard-Flow',
  custom: 'Eigener Flow',
  hub: 'Aus dem Flowhub',
};

export function FlowList() {
  const { data: flows = [] } = useFlows();
  const { data: hub = [] } = useFlowhub();
  const setPanel = useUi((s) => s.setPanel);
  const actions = useActions();

  return (
    <View style={{ gap: 16 }}>
      <View>
        {flows.map((f) => (
          <View key={f.id} style={styles.flowRow}>
            <Touchable
              accessibilityRole="button"
              accessibilityLabel={`${f.name}, ${f.trigger}. Details öffnen`}
              onPress={() => setPanel({ type: 'flows', refId: f.id })}
              style={styles.flowButton}
              hoverStyle={{ backgroundColor: colors.hoverSoft }}
            >
              <Txt size={14.5} weight={600}>
                {f.name}
              </Txt>
              <Txt size={12.5} color={colors.muted}>
                {f.trigger}
              </Txt>
            </Touchable>
            <Switch
              value={f.enabled}
              label={`${f.name} aktiv`}
              onChange={() => void actions.toggleFlow(f)}
            />
          </View>
        ))}
      </View>

      <View style={styles.hint}>
        <Txt size={14} weight={600}>
          Neuen Flow anlegen
        </Txt>
        <Txt size={13} lineHeight={19.5} color={colors.text2}>
          Beschreib im Chat einfach, was regelmäßig passieren soll. Zum Beispiel: „Jeden Freitag um
          16 Uhr fass mir die Woche zusammen.“
        </Txt>
      </View>

      <View style={{ gap: 8 }}>
        <SectionLabel>Vorlagen aus dem Flowhub</SectionLabel>
        {hub.map((h) => (
          <View key={h.id} style={styles.template}>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Txt size={14} weight={500}>
                {h.name}
              </Txt>
              <Txt size={12} color={colors.muted}>
                {h.description} · {formatThousands(h.adoptions)} Übernahmen
              </Txt>
            </View>
            <Touchable
              accessibilityRole="button"
              accessibilityLabel={h.adopted ? `${h.name} übernommen` : `${h.name} übernehmen`}
              accessibilityState={{ disabled: h.adopted }}
              disabled={h.adopted}
              onPress={() => void actions.adoptTemplate(h)}
              hitSlop={2}
              style={[
                styles.adopt,
                h.adopted
                  ? {
                      backgroundColor: colors.successBg,
                      borderColor: colors.successBorder,
                      opacity: 1,
                    }
                  : { backgroundColor: '#FFFFFF', borderColor: colors.borderControl },
              ]}
              hoverStyle={h.adopted ? undefined : { backgroundColor: colors.hoverSoft }}
            >
              <Txt size={12.5} weight={600} color={h.adopted ? colors.successFg : colors.navy}>
                {h.adopted ? '✓ Übernommen' : 'Übernehmen'}
              </Txt>
            </Touchable>
          </View>
        ))}
      </View>
    </View>
  );
}

export function FlowDetail({ flow }: { flow: Flow }) {
  const actions = useActions();
  const now = new Date();
  const writes = flow.writesExternally.length
    ? `${flow.writesExternally.join(', ')} (mit Freigabe)`
    : 'nichts';
  const last = !flow.enabled
    ? 'pausiert'
    : flow.lastRun
      ? formatPast(flow.lastRun, now)
      : 'noch nie';

  return (
    <View style={{ gap: 20 }}>
      <View style={styles.detailHead}>
        <View style={{ gap: 3, flex: 1 }}>
          <Txt size={19} weight={600} display>
            {flow.name}
          </Txt>
          <Txt size={12.5} color={colors.muted}>
            {KIND_LABEL[flow.kind]} · {flow.trigger}
          </Txt>
        </View>
        <Switch
          value={flow.enabled}
          label={`${flow.name} aktiv`}
          onChange={() => void actions.toggleFlow(flow)}
        />
      </View>
      <View style={styles.instruction}>
        <Txt size={15} lineHeight={24}>
          „{flow.instruction}“
        </Txt>
      </View>
      {flow.steps.length > 0 && (
        <View style={{ gap: 10 }}>
          <SectionLabel>So läuft der Flow ab</SectionLabel>
          {flow.steps.map((s, i) => (
            <View key={`${s.label}-${i}`} style={styles.step}>
              <View style={styles.stepNo}>
                <Txt size={12} weight={700} color={colors.primary}>
                  {i + 1}
                </Txt>
              </View>
              <Txt size={14} style={{ flex: 1 }}>
                {s.label}
              </Txt>
              <Txt size={12} color={colors.muted}>
                {s.tool}
              </Txt>
            </View>
          ))}
        </View>
      )}
      <InfoTable
        rows={[
          { label: 'Schreibt nach außen', value: writes },
          {
            label: 'Kosten pro Ausführung',
            value:
              flow.costPerRun === null ? 'noch unbekannt' : `ca. ${formatEur(flow.costPerRun)}`,
          },
          { label: 'Zuletzt', value: last },
        ]}
      />
      <Txt size={12.5} lineHeight={18.75} color={colors.muted}>
        Ändern geht im Chat, zum Beispiel: „Schick mir das Briefing erst um 07:30.“
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  flowButton: {
    flex: 1,
    minWidth: 0,
    gap: 3,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  hint: { padding: 14, borderRadius: 12, backgroundColor: colors.soft, gap: 6 },
  template: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingRight: 8,
    paddingLeft: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
  },
  adopt: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
  },
  detailHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  instruction: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.soft,
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepNo: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: colors.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
