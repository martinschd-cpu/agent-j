import { StyleSheet, View } from 'react-native';

import { useActions } from '@/state/actions';
import { useProfile } from '@/state/queries';
import { colors } from '@/theme/tokens';
import { Icon } from '../Icon';
import { Chip, IconButton, SectionLabel, Txt } from '../ui';

export function ProfilePanel() {
  const { data: profile } = useProfile();
  const actions = useActions();
  if (!profile) return null;

  const learned = profile.facts.filter((f) => f.status === 'pending');
  const facts = profile.facts.filter((f) => f.status !== 'pending');

  return (
    <View style={{ gap: 22 }}>
      {learned.length > 0 && (
        <View style={{ gap: 8 }}>
          <SectionLabel color={colors.primary}>Neu gelernt · bitte bestätigen</SectionLabel>
          {learned.map((f) => (
            <View key={f.id} style={styles.learned}>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt size={13.5} lineHeight={19.5}>
                  {f.value}
                </Txt>
                <Txt size={12} color={colors.muted}>
                  {f.source}
                </Txt>
              </View>
              <IconButton
                label={`Bestätigen: ${f.value}`}
                size={40}
                variant="primary"
                onPress={() => void actions.confirmFact(f.id, f.value)}
                style={{ borderRadius: 8 }}
              >
                <Icon name="check" size={15} strokeWidth={2.4} color="#FFFFFF" />
              </IconButton>
              <IconButton
                label={`Verwerfen: ${f.value}`}
                size={40}
                variant="secondary"
                onPress={() => void actions.rejectFact(f.id)}
                style={{ borderRadius: 8 }}
              >
                <Icon name="close" size={14} strokeWidth={2.4} color={colors.muted} />
              </IconButton>
            </View>
          ))}
        </View>
      )}

      <View style={{ gap: 4 }}>
        <View style={{ paddingBottom: 4 }}>
          <SectionLabel>Wer ich bin</SectionLabel>
        </View>
        {facts.map((f) => {
          const confirmed = f.status === 'confirmed';
          return (
            <View key={f.id} style={styles.fact}>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Txt size={14}>{f.value}</Txt>
                <Txt size={12} color={colors.muted}>
                  {f.label} · {f.source}
                </Txt>
              </View>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: confirmed ? colors.successBg : colors.warnBg },
                ]}
              >
                <Txt size={11.5} weight={600} color={confirmed ? colors.successFg : colors.warnFg}>
                  {confirmed ? 'bestätigt' : 'abgeleitet'}
                </Txt>
              </View>
            </View>
          );
        })}
      </View>

      <View style={{ gap: 8 }}>
        <SectionLabel>Rollen</SectionLabel>
        <View style={styles.chips}>
          {profile.roles.map((r) => (
            <Chip
              key={r.label}
              label={r.label}
              bg={r.workspaceId === 'arbeit' ? colors.roleBgArbeit : colors.roleBgPrivat}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <SectionLabel>So möchte ich behandelt werden</SectionLabel>
        <View style={styles.chips}>
          {profile.preferences.map((p) => (
            <Chip key={p} label={p} bg={colors.iconBg} fg={colors.primaryDark} />
          ))}
        </View>
      </View>

      <Txt size={12.5} lineHeight={18.75} color={colors.muted}>
        „Bestätigt“ hast du selbst gesagt oder bestätigt. „Abgeleitet“ hat Agent-J erschlossen.
        Alles kannst du im Chat ändern oder löschen lassen.
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  learned: {
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
  fact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  badge: { alignSelf: 'center', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
