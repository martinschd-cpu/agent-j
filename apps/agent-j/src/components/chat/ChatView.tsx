import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type ScrollViewInstance,
  type TextInputKeyPressEvent,
} from 'react-native';

import type { Chat, Message } from '@/api/types';
import { useStreams, useSendMessage, type ChatStream } from '@/state/chat-stream';
import { useMessages, useWorkspaces } from '@/state/queries';
import { useActiveChat, usePanel } from '@/state/selectors';
import { useUi } from '@/state/ui';
import { colors, fonts, layout, shadow } from '@/theme/tokens';
import { Icon } from '../Icon';
import { IconButton, Touchable, Txt } from '../ui';
import { ApprovalCard, BriefingCard, PanelCard } from './MessageParts';

const logo = require('../../../assets/logo.png');

/** What the Sprechen button "hears". Voice input is UI only for now. */
const VOICE_SAMPLE = 'Verschieb das Krimi-Dinner auf Donnerstag.';

export function ChatView({
  compact,
  onOpenDrawer,
}: {
  compact: boolean;
  onOpenDrawer?: () => void;
}) {
  const { chat, isLoading } = useActiveChat();
  const panel = usePanel();
  const setPanel = useUi((s) => s.setPanel);
  const { data: messages = [] } = useMessages(chat?.id);
  const stream = useStreams((s) => (chat ? s.streams[chat.id] : undefined));
  const error = useStreams((s) => (chat ? s.errors[chat.id] : undefined));
  const scrollRef = useRef<ScrollViewInstance>(null);

  const firstUser = messages.find((m) => m.role === 'user');
  const title =
    chat?.title === 'Neuer Chat' && firstUser?.parts[0]?.type === 'text'
      ? firstUser.parts[0].text
      : (chat?.title ?? '');

  return (
    <View style={styles.main}>
      <View style={styles.header}>
        {compact && (
          <IconButton label="Navigation öffnen" onPress={onOpenDrawer}>
            <Icon name="menu" color={colors.text2} />
          </IconButton>
        )}
        <Txt
          size={15}
          weight={600}
          numberOfLines={1}
          style={{ flex: 1 }}
          accessibilityRole="header"
        >
          {title}
        </Txt>
        <IconButton
          label="Seitenfenster ein- oder ausblenden"
          pressed={!!panel}
          onPress={() => setPanel(panel ? null : (chat?.defaultPanel ?? { type: 'tasks' }))}
        >
          <Icon name="panel" color={colors.text2} />
        </IconButton>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          compact && { paddingHorizontal: 16, paddingTop: 20 },
        ]}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.column}>
          {chat && messages.length === 0 && !stream && !isLoading && (
            <AgentRow>
              <Txt size={15} lineHeight={24.75}>
                Hallo Martin, womit kann ich helfen? Schreib oder sprich einfach los.
              </Txt>
            </AgentRow>
          )}
          {messages.map((m) => (
            <MessageView key={m.id} message={m} workspaceId={chat?.workspaceId ?? ''} />
          ))}
          {stream && <StreamView stream={stream} />}
          {error && !stream && (
            <View accessibilityRole="alert" style={styles.error}>
              <Txt size={13.5} color={colors.danger}>
                {error}
              </Txt>
            </View>
          )}
        </View>
      </ScrollView>

      {chat && <Composer chat={chat} working={!!stream} compact={compact} />}
    </View>
  );
}

function AgentRow({ children }: { children: ReactNode }) {
  return (
    <View style={styles.agentRow}>
      <Image source={logo} style={styles.agentAvatar} accessibilityIgnoresInvertColors />
      <View style={{ flex: 1, minWidth: 0, gap: 12 }}>{children}</View>
    </View>
  );
}

function MessageView({ message, workspaceId }: { message: Message; workspaceId: string }) {
  if (message.role === 'user') {
    const text = message.parts.map((p) => (p.type === 'text' ? p.text : '')).join('\n');
    return (
      <View style={{ alignItems: 'flex-end' }}>
        <View style={styles.bubble} accessibilityLabel={`Du: ${text}`}>
          <Txt size={15} lineHeight={23.25}>
            {text}
          </Txt>
        </View>
      </View>
    );
  }
  return (
    <AgentRow>
      {message.parts.map((p, i) => {
        switch (p.type) {
          case 'text':
            return (
              <Txt key={i} size={15} lineHeight={24.75} selectable>
                {p.text}
              </Txt>
            );
          case 'card':
            return <PanelCard key={i} part={p} />;
          case 'approval':
            return <ApprovalCard key={i} approvalId={p.approvalId} />;
          case 'briefing':
            return <BriefingCard key={i} part={p} workspaceId={workspaceId} />;
          default:
            return null;
        }
      })}
    </AgentRow>
  );
}

/** Work steps while the agent is busy, then the answer as it streams in. */
function StreamView({ stream }: { stream: ChatStream }) {
  return (
    <AgentRow>
      <View
        accessibilityRole="progressbar"
        accessibilityLiveRegion="polite"
        aria-live="polite"
        style={{ gap: 6, paddingTop: 4 }}
      >
        {stream.steps.length === 0 && !stream.text && (
          <View style={styles.step}>
            <BusyDots />
            <Txt size={13.5} color={colors.text2}>
              Agent-J arbeitet
            </Txt>
          </View>
        )}
        {stream.steps.map((s) => (
          <View key={s.id} style={styles.step}>
            {s.status === 'done' ? (
              <Icon name="check" size={14} strokeWidth={2.6} color={colors.success} />
            ) : (
              <BusyDots />
            )}
            <Txt size={13.5} color={colors.text2}>
              {s.label}
            </Txt>
          </View>
        ))}
      </View>
      {stream.text ? (
        <Txt size={15} lineHeight={24.75}>
          {stream.text}
        </Txt>
      ) : null}
    </AgentRow>
  );
}

function BusyDots() {
  return (
    <View style={{ flexDirection: 'row', gap: 3, width: 14 }} aria-hidden>
      <Pulse delay={0} />
      <Pulse delay={200} />
    </View>
  );
}

function Pulse({ delay }: { delay: number }) {
  const [v] = useState(() => new Animated.Value(0.25));
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 0.25,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [v, delay]);
  return <Animated.View style={[styles.pulse, { opacity: v }]} />;
}

function VoiceBars() {
  const [bars] = useState(() => [0, 1, 2, 3, 4, 5].map(() => new Animated.Value(0.25)));
  useEffect(() => {
    const anims = bars.map((b, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(b, { toValue: 1, duration: 550, useNativeDriver: true }),
          Animated.timing(b, { toValue: 0.25, duration: 550, useNativeDriver: true }),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [bars]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 30 }} aria-hidden>
      {bars.map((b, i) => (
        <Animated.View key={i} style={[styles.bar, { transform: [{ scaleY: b }] }]} />
      ))}
    </View>
  );
}

function Composer({ chat, working, compact }: { chat: Chat; working: boolean; compact: boolean }) {
  const [draft, setDraft] = useState('');
  const [voice, setVoice] = useState(false);
  const send = useSendMessage();
  const { data: workspaces = [] } = useWorkspaces();
  const wsName = workspaces.find((w) => w.id === chat.workspaceId)?.name ?? '';

  const submit = (text: string) => {
    const t = text.trim();
    if (!t || working) return;
    setDraft('');
    setVoice(false);
    void send(chat, t);
  };

  const onKeyPress = (e: TextInputKeyPressEvent) => {
    // Web: Enter sends, Shift+Enter makes a new line.
    const ev = e.nativeEvent as { key: string; shiftKey?: boolean };
    if (Platform.OS === 'web' && ev.key === 'Enter' && !ev.shiftKey) {
      e.preventDefault();
      submit(draft);
    }
  };

  return (
    <View style={[styles.composerWrap, compact && { paddingHorizontal: 12, paddingBottom: 12 }]}>
      <View style={[styles.column, { gap: 8 }]}>
        <View style={[styles.composer, shadow.card]}>
          {voice ? (
            <View style={styles.voice} accessibilityLiveRegion="polite">
              <VoiceBars />
              <Txt size={15} color={colors.text2} style={{ flex: 1 }}>
                „{VOICE_SAMPLE}“
              </Txt>
            </View>
          ) : (
            <TextInput
              value={draft}
              onChangeText={setDraft}
              onKeyPress={onKeyPress}
              multiline
              numberOfLines={2}
              placeholder="Schreib oder sprich mit Agent-J"
              placeholderTextColor={colors.muted}
              accessibilityLabel="Nachricht an Agent-J"
              style={styles.input}
            />
          )}
          <View style={styles.composerBar}>
            <IconButton
              label="Datei anhängen, noch nicht verfügbar"
              size={40}
              style={{ borderRadius: 20 }}
            >
              <Icon name="plus" color={colors.muted} />
            </IconButton>
            <Txt size={12.5} color={colors.muted} style={{ flex: 1 }} numberOfLines={1}>
              Workspace {wsName}
            </Txt>
            <Touchable
              accessibilityRole="button"
              accessibilityLabel={voice ? 'Fertig, Sprachnachricht senden' : 'Sprechen'}
              accessibilityState={{ disabled: working, selected: voice }}
              disabled={working}
              onPress={() => (voice ? submit(VOICE_SAMPLE) : setVoice(true))}
              hitSlop={2}
              style={[
                styles.voiceButton,
                { backgroundColor: voice ? colors.primary : colors.bubble },
              ]}
            >
              <Icon
                name="mic"
                size={17}
                strokeWidth={1.9}
                color={voice ? '#FFFFFF' : colors.navy}
              />
              <Txt size={13} weight={600} color={voice ? '#FFFFFF' : colors.navy}>
                {voice ? 'Fertig' : 'Sprechen'}
              </Txt>
            </Touchable>
            <Touchable
              accessibilityRole="button"
              accessibilityLabel="Senden"
              accessibilityState={{ disabled: working, busy: working }}
              disabled={working}
              onPress={() => submit(voice ? VOICE_SAMPLE : draft)}
              hitSlop={2}
              style={styles.send}
              hoverStyle={{ backgroundColor: colors.primaryDark }}
            >
              <Icon name="send" size={17} strokeWidth={2.2} color="#FFFFFF" />
            </Touchable>
          </View>
        </View>
        <Txt size={12} color={colors.muted} style={{ textAlign: 'center' }}>
          Agent-J kann Fehler machen. Nach außen handelt er nur mit deiner Freigabe.
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, minWidth: 0, backgroundColor: colors.bg },
  header: {
    height: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  scrollContent: { paddingTop: 32, paddingHorizontal: 24, paddingBottom: 16 },
  column: { width: '100%', maxWidth: layout.chatMaxWidth, alignSelf: 'center', gap: 26 },
  agentRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  agentAvatar: { width: 28, height: 28, borderRadius: 14, marginTop: 2 },
  bubble: {
    maxWidth: '82%',
    backgroundColor: colors.bubble,
    paddingVertical: 11,
    paddingHorizontal: 15,
    borderRadius: 16,
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  bar: { width: 4, height: 26, borderRadius: 2, backgroundColor: colors.primary },
  error: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FECDCA',
  },
  composerWrap: { paddingHorizontal: 24, paddingBottom: 18 },
  composer: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingRight: 10,
    paddingBottom: 10,
    paddingLeft: 16,
    gap: 8,
  },
  input: {
    minHeight: 45,
    maxHeight: 160,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22.5,
    color: colors.ink,
    textAlignVertical: 'top',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  voice: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 45 },
  composerBar: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  voiceButton: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
