import { useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import type { Contact, ContactGraph, ContactGroup, GraphPoint, ID } from '@/api/types';
import { useContactGraph } from '@/state/queries';
import { useUi } from '@/state/ui';
import { colors, groupColor, layout } from '@/theme/tokens';
import { Dot, InfoTable, Txt } from '../ui';

const GRAPH_W = 420;
const GRAPH_H = 290;
const LEGEND: ContactGroup[] = ['Familie', 'Arbeit', 'Freunde', 'Dienstleister'];

interface Node {
  id: ID;
  name: string;
  group: ContactGroup | 'me';
  point: GraphPoint;
}

/** Positions from the backend, or a simple ring around the user when there are none. */
function nodesOf(graph: ContactGraph): Node[] {
  const ring = (i: number, n: number): GraphPoint => {
    const a = (i / Math.max(1, n)) * 2 * Math.PI;
    return { x: 0.5 + 0.38 * Math.cos(a), y: 0.5 + 0.38 * Math.sin(a) };
  };
  return [
    {
      id: graph.me.id,
      name: graph.me.name,
      group: 'me',
      point: graph.me.layout ?? { x: 0.5, y: 0.5 },
    },
    ...graph.contacts.map((c, i) => ({
      id: c.id,
      name: c.name,
      group: c.group,
      point: c.layout ?? ring(i, graph.contacts.length),
    })),
  ];
}

export function NetworkPanel({ selectedId }: { selectedId?: ID }) {
  const { data: graph } = useContactGraph();
  const setPanel = useUi((s) => s.setPanel);
  const [width, setWidth] = useState(GRAPH_W);
  if (!graph) return null;

  const selected = selectedId ?? 'mama';
  const scale = Math.min(1, width / GRAPH_W);
  const w = GRAPH_W * scale;
  const h = GRAPH_H * scale;
  const nodes = nodesOf(graph);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const neighbours = new Set(
    graph.relations.flatMap((r) =>
      r.fromId === selected ? [r.toId] : r.toId === selected ? [r.fromId] : [],
    ),
  );
  const px = (p: GraphPoint) => ({ x: p.x * w, y: p.y * h });

  const contact = graph.contacts.find((c) => c.id === selected);
  const isMe = selected === graph.me.id || !contact;

  return (
    <View style={{ gap: 16 }}>
      <View onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        <View
          style={[styles.graph, { width: w, height: h }]}
          accessibilityLabel="Netzwerk"
          accessibilityRole="image"
        >
          <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
            {graph.relations.map((r) => {
              const a = byId.get(r.fromId);
              const b = byId.get(r.toId);
              if (!a || !b) return null;
              const hot = r.fromId === selected || r.toId === selected;
              const other = r.fromId === selected ? b : a;
              const pa = px(a.point);
              const pb = px(b.point);
              return (
                <Line
                  key={`${r.fromId}-${r.toId}`}
                  x1={pa.x}
                  y1={pa.y}
                  x2={pb.x}
                  y2={pb.y}
                  stroke={hot ? groupColor[other.group] : colors.edge}
                  strokeWidth={hot ? 2 : 1}
                />
              );
            })}
          </Svg>
          {nodes.map((n) => {
            const on = n.id === selected;
            const r = n.group === 'me' ? 11 : 8;
            const c = groupColor[n.group];
            const p = px(n.point);
            const dim = !on && !neighbours.has(n.id) && n.group !== 'me';
            return (
              <View key={n.id} pointerEvents="box-none">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={n.name}
                  accessibilityState={{ selected: on }}
                  onPress={() => setPanel({ type: 'network', refId: n.id })}
                  style={[
                    styles.hit,
                    { left: p.x - layout.touch / 2, top: p.y - layout.touch / 2 },
                  ]}
                >
                  <View
                    style={{
                      width: 2 * r,
                      height: 2 * r,
                      borderRadius: r,
                      backgroundColor: c,
                      opacity: dim ? 0.55 : 1,
                      borderWidth: on ? 3 : 2,
                      borderColor: '#FFFFFF',
                      outlineColor: on ? c : undefined,
                      outlineWidth: on ? 2 : 0,
                      outlineStyle: 'solid',
                    }}
                  />
                </Pressable>
                <Txt
                  size={11}
                  weight={on ? 600 : 400}
                  color={on ? colors.ink : colors.text2}
                  numberOfLines={1}
                  pointerEvents="none"
                  style={[styles.label, { left: p.x - 50, top: p.y + r + 3 }]}
                >
                  {n.name}
                </Txt>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.legend}>
        {LEGEND.map((g) => (
          <View key={g} style={styles.legendItem}>
            <Dot color={groupColor[g]} />
            <Txt size={12} color={colors.text2}>
              {g}
            </Txt>
          </View>
        ))}
      </View>

      <PersonCard contact={isMe ? undefined : contact} meName={graph.me.initials} />
    </View>
  );
}

function PersonCard({ contact, meName }: { contact?: Contact; meName: string }) {
  const color = contact ? groupColor[contact.group] : groupColor.me;
  const initial = contact ? contact.name.replace(/^(Dr\.|Herr|Firma)\s+/, '').charAt(0) : meName;
  const p = contact ?? {
    name: 'Du',
    role: 'Martin',
    lastContact: 'jetzt',
    openItem: 'nichts',
    source: 'Profil',
    note: 'Zentrum deines Netzwerks.',
  };
  return (
    <View style={styles.person}>
      <View style={styles.personHead}>
        <View style={[styles.personAvatar, { backgroundColor: color }]}>
          <Txt size={14} weight={700} display color="#FFFFFF">
            {initial}
          </Txt>
        </View>
        <View style={{ gap: 2 }}>
          <Txt size={17} weight={600} display accessibilityRole="header">
            {p.name}
          </Txt>
          <Txt size={13} color={colors.muted}>
            {contact ? `${contact.role} · ${contact.group}` : p.role}
          </Txt>
        </View>
      </View>
      <InfoTable
        padding={{ v: 10, h: 14 }}
        rows={[
          { label: 'Letzter Kontakt', value: p.lastContact },
          { label: 'Offen', value: p.openItem ?? 'nichts' },
          { label: 'Quelle', value: p.source },
        ]}
      />
      {p.note ? (
        <Txt size={14} lineHeight={21.7} color={colors.text2}>
          {p.note}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  graph: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.sidebar,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hit: {
    position: 'absolute',
    width: layout.touch,
    height: layout.touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { position: 'absolute', width: 100, textAlign: 'center' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  person: { gap: 14, borderTopWidth: 1, borderTopColor: colors.borderSoft, paddingTop: 14 },
  personHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  personAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
