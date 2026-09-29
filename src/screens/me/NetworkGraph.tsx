import { drag } from 'd3-drag';
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
import { useEffect, useRef } from 'react';
import { Icon } from '../../components/Icon';
import { LINKS, ME_ID } from '../../data/network';
import type { Person, PersonGroup } from '../../data/types';

interface GNode extends SimulationNodeDatum {
  id: string;
  name: string;
  group: PersonGroup | 'me';
  r: number;
}

interface GLink extends SimulationLinkDatum<GNode> {
  me: boolean;
}

const idOf = (n: string | number | GNode) => (typeof n === 'object' ? n.id : String(n));

/**
 * Obsidian-style force-directed graph of the personal network. d3 owns the SVG (simulation,
 * zoom, drag); React only decides which people are shown and which one is selected.
 */
export function NetworkGraph({
  people,
  selectedId,
  onSelect,
}: {
  people: Person[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const fitRef = useRef<() => void>(() => {});
  const highlightRef = useRef<(id: string | null) => void>(() => {});
  const selectedRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const peopleKey = people.map((p) => p.id).join(',');

  useEffect(() => {
    const el = svgRef.current!;
    const svg = select(el);
    svg.selectAll('*').remove();
    const { width, height } = el.getBoundingClientRect();

    const nodes: GNode[] = [
      { id: ME_ID, name: 'Ich', group: 'me', r: 15, x: width / 2, y: height / 2 },
      ...people.map((p) => ({ id: p.id, name: p.name, group: p.group, r: 4 + p.frequency * 1.7 })),
    ];
    const ids = new Set(nodes.map((n) => n.id));
    const links: GLink[] = [
      ...people.map((p) => ({ source: ME_ID, target: p.id, me: true })),
      ...LINKS.filter(([a, b]) => ids.has(a) && ids.has(b)).map(([a, b]) => ({ source: a, target: b, me: false })),
    ];
    const neighbors = new Map<string, Set<string>>(nodes.map((n) => [n.id, new Set<string>()]));
    for (const l of links) {
      neighbors.get(idOf(l.source))!.add(idOf(l.target));
      neighbors.get(idOf(l.target))!.add(idOf(l.source));
    }

    const root = svg.append('g');
    const linkSel = root
      .append('g')
      .selectAll<SVGLineElement, GLink>('line')
      .data(links)
      .join('line')
      .attr('class', (d) => (d.me ? 'g-link g-link-me' : 'g-link'));

    const nodeSel = root
      .append('g')
      .selectAll<SVGGElement, GNode>('g')
      .data(nodes)
      .join('g')
      .attr('class', (d) => `g-node grp-${d.group}${d.r > 10 ? ' big' : ''}`);
    nodeSel.append('circle').attr('class', 'g-halo').attr('r', (d) => d.r + 7);
    nodeSel.append('circle').attr('class', 'g-dot').attr('r', (d) => d.r);
    nodeSel
      .append('text')
      .attr('class', 'g-label')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => d.r + 14)
      .text((d) => d.name);

    // Pull each group towards its own direction so families/colleagues form visible clusters.
    const groupAngle: Record<string, number> = { familie: -2.4, freunde: -0.7, arbeit: 0.9, netzwerk: 2.5 };
    const cx = (d: GNode) => width / 2 + (d.group === 'me' ? 0 : Math.cos(groupAngle[d.group]) * Math.min(width, height) * 0.28);
    const cy = (d: GNode) => height / 2 + (d.group === 'me' ? 0 : Math.sin(groupAngle[d.group]) * Math.min(width, height) * 0.28);

    const sim = forceSimulation(nodes)
      .alphaDecay(0.035)
      .force(
        'link',
        forceLink<GNode, GLink>(links)
          .id((d) => d.id)
          .distance((l) => (l.me ? 110 : 45))
          .strength((l) => (l.me ? 0.08 : 0.35)),
      )
      .force('charge', forceManyBody<GNode>().strength(-160))
      .force('collide', forceCollide<GNode>((d) => d.r + 10))
      .force('x', forceX<GNode>(cx).strength(0.07))
      .force('y', forceY<GNode>(cy).strength(0.07))
      .force('center', forceCenter(width / 2, height / 2));

    sim.on('tick', () => {
      linkSel
        .attr('x1', (d) => (d.source as GNode).x!)
        .attr('y1', (d) => (d.source as GNode).y!)
        .attr('x2', (d) => (d.target as GNode).x!)
        .attr('y2', (d) => (d.target as GNode).y!);
      nodeSel.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    const highlight = (id: string | null) => {
      const nb = id ? neighbors.get(id) : undefined;
      svg.classed('has-focus', !!id);
      nodeSel.classed('hl', (d) => d.id === id).classed('nb', (d) => !!nb?.has(d.id));
      linkSel.classed('hl', (l) => !!id && (idOf(l.source) === id || idOf(l.target) === id));
    };
    highlightRef.current = highlight;
    highlight(selectedRef.current);

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', (e) => {
        root.attr('transform', e.transform.toString());
        svg.classed('zoomed-in', e.transform.k > 1.4);
      });
    zoomRef.current = zoomBehavior;
    svg.call(zoomBehavior).on('dblclick.zoom', null);

    // Once the layout has settled, zoom so the whole network fills the canvas.
    const fit = () => {
      const pad = 40;
      const xs = nodes.map((n) => n.x!);
      const ys = nodes.map((n) => n.y!);
      const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys) + 16];
      const k = Math.min((width - 2 * pad) / (x1 - x0 || 1), (height - 2 * pad - 70) / (y1 - y0 || 1), 1.8);
      const t = zoomIdentity
        .translate(width / 2, height / 2 + 35)
        .scale(k)
        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
      svg.call(zoomBehavior.transform, t);
    };
    fitRef.current = fit;
    let fitted = false;
    sim.on('end.fit', () => {
      if (!fitted) fit();
      fitted = true;
    });

    nodeSel.call(
      drag<SVGGElement, GNode>()
        .on('start', (e, d) => {
          if (!e.active) sim.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (e, d) => {
          d.fx = e.x;
          d.fy = e.y;
        })
        .on('end', (e, d) => {
          if (!e.active) sim.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }),
    );

    nodeSel
      .on('mouseenter', (_, d) => highlight(d.id))
      .on('mouseleave', () => highlight(selectedRef.current))
      .on('click', (e, d) => {
        e.stopPropagation();
        onSelectRef.current(d.id === ME_ID ? null : d.id);
      });
    svg.on('click', () => onSelectRef.current(null));

    return () => {
      sim.stop();
    };
    // Rebuild only when the visible set of people changes, not on every parent render.
  }, [peopleKey]);

  useEffect(() => {
    selectedRef.current = selectedId;
    highlightRef.current(selectedId);
  }, [selectedId]);

  const zoomBy = (k: number) => {
    const svg = select(svgRef.current!);
    if (zoomRef.current) svg.call(zoomRef.current.scaleBy, k);
  };
  const recenter = () => fitRef.current();

  return (
    <div className="graph">
      <svg ref={svgRef} className="graph-svg" />
      <div className="graph-controls">
        <button onClick={() => zoomBy(1.3)} aria-label="Hineinzoomen">
          <Icon name="plus" size={18} />
        </button>
        <button onClick={() => zoomBy(1 / 1.3)} aria-label="Herauszoomen">
          <span className="minus" />
        </button>
        <button onClick={recenter} aria-label="Zentrieren">
          <Icon name="focus" size={18} />
        </button>
      </div>
    </div>
  );
}
