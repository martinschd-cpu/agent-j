import { StyleSheet, View } from 'react-native';

import type { Task, TaskRange, TaskStatus } from '@/api/types';
import { daysBetween, formatDue, parseISODate } from '@/lib/dates';
import { useActions } from '@/state/actions';
import { useTasks } from '@/state/queries';
import { useUi } from '@/state/ui';
import { colors, taskStatusColor } from '@/theme/tokens';
import { Icon } from '../Icon';
import { Dot, IconButton, Segmented, SectionLabel, Touchable, Txt } from '../ui';

const GROUPS: { status: TaskStatus; label: string }[] = [
  { status: 'open', label: 'Offen' },
  { status: 'in_progress', label: 'In Arbeit' },
  { status: 'waiting', label: 'Wartet auf' },
  { status: 'done', label: 'Erledigt' },
];

const RANGES: { value: TaskRange; label: string }[] = [
  { value: 'today', label: 'Heute' },
  { value: 'week', label: 'Diese Woche' },
  { value: 'all', label: 'Alle' },
];

export function TasksPanel() {
  const ws = useUi((s) => s.workspaceId);
  const range = useUi((s) => s.taskRange);
  const setRange = useUi((s) => s.setTaskRange);
  const { data: tasks = [] } = useTasks(ws, range);
  const { data: todayTasks = [] } = useTasks(ws, 'today');
  const actions = useActions();
  const now = new Date();

  const isToday = (t: Task) => !!t.due && daysBetween(now, parseISODate(t.due)) === 0;
  const todays = todayTasks.filter((t) => !t.isDraft && isToday(t));
  const doneCount = todays.filter((t) => t.status === 'done').length;
  const left = todays.length - doneCount;
  const allDone = todays.length > 0 && left === 0;
  const pct = todays.length ? Math.round((doneCount / todays.length) * 100) : 0;

  const drafts = tasks.filter((t) => t.isDraft);
  const groups = GROUPS.map((g) => ({
    ...g,
    items: tasks.filter((t) => !t.isDraft && t.status === g.status),
  })).filter((g) => g.items.length > 0);

  return (
    <View style={{ gap: 18 }}>
      <View
        style={[styles.today, { backgroundColor: allDone ? colors.successBg : colors.soft }]}
        accessible
        accessibilityLabel={`Heute geschafft: ${doneCount} von ${todays.length}`}
      >
        <View style={styles.todayHead}>
          <Txt size={13.5} weight={600}>
            Heute geschafft
          </Txt>
          <Txt size={13.5} color={colors.text2}>
            {doneCount} von {todays.length}
          </Txt>
        </View>
        <View style={styles.track}>
          <View style={[styles.bar, { width: `${pct}%` }]} />
        </View>
        <Txt size={13} color={colors.text2}>
          {allDone
            ? 'Alles für heute erledigt. Stark, Martin!'
            : left === 1
              ? 'Noch 1 Aufgabe für heute.'
              : `Noch ${left} Aufgaben für heute.`}
        </Txt>
      </View>

      <Segmented
        label="Zeitraum"
        options={RANGES}
        value={range}
        onChange={setRange}
        background={colors.bubble}
        height={36}
      />

      {drafts.length > 0 && (
        <View style={{ gap: 6 }}>
          <SectionLabel color={colors.primary}>Neu erkannt · bitte bestätigen</SectionLabel>
          {drafts.map((t) => (
            <View key={t.id} style={styles.draft}>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Txt size={14} weight={500}>
                  {t.title}
                </Txt>
                <Txt size={12} color={colors.muted}>
                  erkannt aus {t.source}
                </Txt>
              </View>
              <IconButton
                label={`Übernehmen: ${t.title}`}
                size={40}
                variant="primary"
                onPress={() => void actions.confirmTask(t)}
                style={{ borderRadius: 8 }}
              >
                <Icon name="check" size={15} strokeWidth={2.4} color="#FFFFFF" />
              </IconButton>
              <IconButton
                label={`Verwerfen: ${t.title}`}
                size={40}
                variant="secondary"
                onPress={() => void actions.discardTask(t)}
                style={{ borderRadius: 8 }}
              >
                <Icon name="close" size={14} strokeWidth={2.4} color={colors.muted} />
              </IconButton>
            </View>
          ))}
        </View>
      )}

      {groups.map((g) => (
        <View key={g.status} style={{ gap: 2 }}>
          <View style={styles.groupHead}>
            <Dot color={taskStatusColor[g.status]} />
            <Txt size={12.5} weight={600} color={colors.text2} accessibilityRole="header">
              {g.label}{' '}
              <Txt size={12.5} color={colors.muted}>
                {g.items.length}
              </Txt>
            </Txt>
          </View>
          {g.items.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              now={now}
              onToggle={() => void actions.toggleTaskDone(t)}
            />
          ))}
        </View>
      ))}

      {tasks.length === 0 && (
        <Txt size={13.5} color={colors.muted}>
          Für diesen Zeitraum ist nichts geplant.
        </Txt>
      )}

      <Txt size={12.5} color={colors.muted}>
        Tipp: Sag einfach „verschieb das auf Donnerstag“.
      </Txt>
    </View>
  );
}

export function taskMeta(t: Task, now: Date): string {
  const parts: string[] = [];
  if (t.status === 'waiting' && t.waitingFor) parts.push(`wartet auf ${t.waitingFor}`);
  else if (t.due) {
    let due = formatDue(t.due, now, t.dueTime);
    if (t.progress) due += ` · ${t.progress.done} von ${t.progress.total}`;
    parts.push(due);
  } else parts.push('ohne Termin');
  parts.push(`aus ${t.source}`);
  return parts.join(' · ');
}

function TaskRow({ task, now, onToggle }: { task: Task; now: Date; onToggle: () => void }) {
  const done = task.status === 'done';
  const urgent = !done && !!task.due && daysBetween(now, parseISODate(task.due)) <= 0;
  return (
    <Touchable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      aria-checked={done}
      accessibilityLabel={`${task.title}, ${taskMeta(task, now)}`}
      onPress={onToggle}
      style={styles.task}
      hoverStyle={{ backgroundColor: colors.hoverSoft }}
    >
      <View
        style={[
          styles.check,
          {
            borderColor: done ? colors.success : colors.checkRing,
            backgroundColor: done ? colors.success : 'transparent',
          },
        ]}
      >
        {done && <Icon name="check" size={11} strokeWidth={3} color="#FFFFFF" />}
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Txt
          size={14}
          color={done ? colors.muted : colors.ink}
          style={done && { textDecorationLine: 'line-through' }}
        >
          {task.title}
        </Txt>
        <Txt size={12} color={urgent ? colors.danger : colors.muted}>
          {taskMeta(task, now)}
        </Txt>
      </View>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  today: { gap: 8, padding: 14, borderRadius: 12 },
  todayHead: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.track },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.success },
  draft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingRight: 8,
    paddingLeft: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.draftBorder,
    borderRadius: 10,
    backgroundColor: colors.draftBg,
  },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 4 },
  task: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  check: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
