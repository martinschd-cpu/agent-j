import Svg, { Circle, Path, Rect } from 'react-native-svg';

/** Line icons from clickdummy v3 (24 x 24 grid). */
const ICONS = {
  plus: <Path d="M12 5v14M5 12h14" />,
  chat: <Path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
  inbox: (
    <>
      <Path d="M3 13h5l1.5 3h5L16 13h5" />
      <Path d="M5.5 5h13L21 13v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z" />
    </>
  ),
  flow: (
    <>
      <Circle cx={5} cy={5} r={2} />
      <Circle cx={19} cy={19} r={2} />
      <Path d="M7 5h8a3.5 3.5 0 0 1 0 7H9a3.5 3.5 0 0 0 0 7h8" />
    </>
  ),
  tasks: (
    <>
      <Path d="M10 6h10M10 12h10M10 18h10" />
      <Path d="M3.5 6l1.5 1.5L7.5 5M3.5 12l1.5 1.5 2.5-2.5M3.5 18l1.5 1.5 2.5-2.5" />
    </>
  ),
  network: (
    <>
      <Circle cx={6} cy={6} r={2.5} />
      <Circle cx={18} cy={7} r={2.5} />
      <Circle cx={12} cy={18} r={2.5} />
      <Path d="M8.5 6.2l7-.4M7.2 8.2l3.8 7.6M16.9 9.2l-3.8 6.6" />
    </>
  ),
  profile: (
    <>
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  panel: (
    <>
      <Rect x={3} y={4} width={18} height={16} rx={2} />
      <Path d="M15 4v16" />
    </>
  ),
  close: <Path d="M6 6l12 12M18 6L6 18" />,
  back: <Path d="M15 6l-6 6 6 6" />,
  chevronUp: <Path d="M7 15l5-5 5 5" />,
  check: <Path d="M5 12.5l4.5 4.5L19 7.5" />,
  shield: <Path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" />,
  mic: (
    <>
      <Rect x={9} y={3} width={6} height={11} rx={3} />
      <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  send: <Path d="M12 19V5M6 11l6-6 6 6" />,
  menu: <Path d="M4 7h16M4 12h16M4 17h16" />,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  size = 18,
  color = '#33445A',
  strokeWidth = 1.8,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {ICONS[name]}
    </Svg>
  );
}
