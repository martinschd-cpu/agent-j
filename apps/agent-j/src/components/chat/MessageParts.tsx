import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import type { Approval, BriefingPart, CardPart, PanelType } from '@/api/types';
import { useActions } from '@/state/actions';
import { useApproval, useTasks } from '@/state/queries';
import { usePanel } from '@/state/selectors';
import { useUi } from '@/state/ui';
import { colors, fonts } from '@/theme/tokens';
import { Icon, type IconName } from '../Icon';
import { Button, Touchable, Txt } from '../ui';

const CARD_ICON: Record<PanelType, IconName> = {
  tasks: 'tasks',
  flows: 'flow',
  network: 'network',
  profile: 'profile',
};

/** Card in an agent message that opens the matching side panel. */
export function PanelCard({ part }: { part: CardPart }) {
  const panel = usePanel();
  const setPanel = useUi((s) => s.setPanel);
  const isOpen = panel?.type === part.card;
  return (
    <Touchable
      accessibilityRole="button"
      accessibilityLabel={`${part.title}, ${part.subtitle ?? ''}`}
      accessibilityHint={isOpen ? 'Ist im Seitenfenster geöffnet' : 'Öffnet das Seitenfenster'}
      accessibilityState={{ expanded: isOpen }}
      onPress={() => setPanel({ type: part.card, refId: part.refId })}
      style={[styles.card, { borderColor: isOpen ? colors.primary : colors.borderCard }]}
      hoverStyle={{ borderColor: colors.cardHover, backgroundColor: colors.cardHoverBg }}
    >
      <View style={styles.cardIcon}>
        <Icon name={CARD_ICON[part.card]} size={19} color={colors.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Txt size={14.5} weight={600}>
          {part.title}
        </Txt>
        {part.subtitle ? (
          <Txt size={12.5} color={colors.muted}>
            {part.subtitle}
          </Txt>
        ) : null}
      </View>
      <Txt size={13} weight={600} color={colors.primary}>
        {isOpen ? 'Geöffnet' : 'Öffnen'}
      </Txt>
    </Touchable>
  );
}

/** Morgenbriefing and Tagesabschluss. The first step can be done right from the card. */
export function BriefingCard({ part, workspaceId }: { part: BriefingPart; workspaceId: string }) {
  const actions = useActions();
  const { data: tasks } = useTasks(workspaceId, 'all');
  const task = part.firstStep ? tasks?.find((t) => t.id === part.firstStep?.taskId) : undefined;
  const done = task?.status === 'done';

  return (
    <View style={styles.brief}>
      <View style={styles.briefHead}>
        <Txt size={16} weight={600} display color="#FFFFFF" accessibilityRole="header">
          {part.title}
        </Txt>
        {part.subtitle ? (
          <Txt size={12.5} color={colors.briefSub}>
            {part.subtitle}
          </Txt>
        ) : null}
      </View>
      {part.rows.map((r) => (
        <View key={r.label} style={styles.briefRow}>
          <Txt size={14} color={colors.muted} style={{ width: 140, maxWidth: '38%' }}>
            {r.label}
          </Txt>
          <Txt size={14} lineHeight={20} style={{ flex: 1 }}>
            {r.value}
          </Txt>
        </View>
      ))}
      {part.firstStep && task && !done && (
        <View style={styles.briefCta}>
          <Txt size={14} lineHeight={20} style={{ flex: 1 }}>
            <Txt size={14} weight={600}>
              Erster Schritt:
            </Txt>{' '}
            {part.firstStep.label}
          </Txt>
          <Button
            label="Erledigen"
            variant="primary"
            accessibilityLabel={`Erledigen: ${task.title}`}
            onPress={() => void actions.toggleTaskDone(task)}
            style={{ paddingHorizontal: 16, borderRadius: 9 }}
          />
        </View>
      )}
      {part.firstStep && done && (
        <View style={[styles.briefRow, { backgroundColor: colors.successBg }]}>
          <Txt size={14} weight={600} color={colors.successFgDark}>
            Erledigt. Guter Start in den Tag!
          </Txt>
        </View>
      )}
    </View>
  );
}

const APPROVAL_HEAD: Record<Approval['status'], { text: string; bg: string; fg: string }> = {
  pending: { text: 'Freigabe nötig', bg: colors.warnBg, fg: colors.warnFg },
  approved: { text: 'Freigegeben und gesendet', bg: colors.successBg, fg: colors.successFg },
  rejected: { text: 'Abgelehnt, nichts gesendet', bg: colors.neutralBg, fg: colors.muted },
};

/** Human in the loop: nothing leaves Agent-J without this card being approved. */
export function ApprovalCard({ approvalId }: { approvalId: string }) {
  const { data: approval } = useApproval(approvalId);
  const actions = useActions();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  if (!approval) return null;

  const head = APPROVAL_HEAD[approval.status];
  const pending = approval.status === 'pending';
  const body = draft ?? approval.body;
  const dirty = draft !== null && draft !== approval.body;

  const save = async () => {
    if (dirty) await actions.saveDraft(approval, draft);
    setDraft(null);
  };
  const toggleEdit = async () => {
    if (editing) await save();
    setEditing(!editing);
  };
  const approve = async () => {
    if (editing) {
      await save();
      setEditing(false);
    }
    void actions.approve(approval);
  };

  return (
    <View
      style={[styles.approval, { borderColor: pending ? colors.warnBorder : colors.border }]}
      accessibilityLabel={`${head.text}, ${approval.system}`}
    >
      <View style={[styles.approvalHead, { backgroundColor: head.bg }]}>
        <Icon name="shield" size={15} strokeWidth={2} color={head.fg} />
        <Txt
          size={13}
          weight={600}
          color={head.fg}
          style={{ flex: 1 }}
          accessibilityLiveRegion="polite"
        >
          {head.text}
        </Txt>
        <Txt size={13} weight={500} color={head.fg}>
          {approval.system}
        </Txt>
      </View>
      <View style={styles.approvalBody}>
        <Txt size={13.5} color={colors.muted}>
          An{' '}
          <Txt size={13.5} weight={600}>
            {approval.recipient}
          </Txt>
        </Txt>
        {editing ? (
          <TextInput
            value={body}
            onChangeText={setDraft}
            multiline
            numberOfLines={5}
            accessibilityLabel="Entwurf bearbeiten"
            style={styles.approvalInput}
            autoFocus
          />
        ) : (
          <Txt size={14} lineHeight={21.7} color={colors.text2}>
            {body}
          </Txt>
        )}
      </View>
      {pending && (
        <View style={styles.approvalButtons}>
          <Button label="Ablehnen" onPress={() => void actions.reject(approval)} />
          <Button
            label={editing ? 'Fertig' : 'Ändern'}
            color={colors.navy}
            onPress={() => void toggleEdit()}
          />
          <Button
            label="Freigeben"
            variant="primary"
            onPress={() => void approve()}
            style={{ paddingHorizontal: 16 }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    maxWidth: 440,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: colors.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brief: {
    maxWidth: 540,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    overflow: 'hidden',
  },
  briefHead: { paddingVertical: 14, paddingHorizontal: 16, backgroundColor: colors.navy, gap: 2 },
  briefRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  briefCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    backgroundColor: colors.ctaBg,
  },
  approval: { maxWidth: 520, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  approvalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  approvalBody: { paddingVertical: 12, paddingHorizontal: 14, gap: 8 },
  approvalInput: {
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 8,
    padding: 10,
    minHeight: 120,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21.7,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  approvalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
});
