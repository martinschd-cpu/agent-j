import type { ContactGroup, RequestKind, TaskStatus } from '@/api/types';

/** Colors from clickdummy v3. */
export const colors = {
  bg: '#FFFFFF',
  ink: '#0E1B2C',
  navy: '#0F2340',
  text2: '#33445A',
  text3: '#1C2B3D',
  muted: '#5A6B80',
  primary: '#2563A8',
  primaryDark: '#1B4B82',
  focus: '#9FC3EA',

  sidebar: '#F4F6F9',
  border: '#E3E8EF',
  borderSoft: '#EEF1F5',
  divider: '#F0F3F7',
  borderControl: '#D8E0EA',
  borderCard: '#E0E6EE',
  borderStrong: '#D3DCE7',
  borderInput: '#C9D6E6',
  cardHover: '#9FB9D8',
  cardHoverBg: '#FAFCFE',

  active: '#E4EBF4',
  hover: '#E9EEF5',
  hoverSoft: '#F2F5F9',
  bubble: '#EEF2F7',
  segment: '#E6EBF2',
  soft: '#F4F7FB',
  iconBg: '#EEF3F9',
  draftBorder: '#A9CBEA',
  draftBg: '#F7FAFE',
  ctaBg: '#F4F8FD',
  track: '#DCE5EF',
  switchOff: '#A3B1C2',
  switchOffSettings: '#C3CEDC',

  success: '#15803D',
  successBg: '#E7F5EC',
  successFg: '#166534',
  successFgDark: '#14532D',
  successBorder: '#BFE3CB',
  warnBg: '#FDF3E4',
  warnFg: '#7A4106',
  warnBorder: '#F1D3A6',
  neutralBg: '#F1F3F6',
  danger: '#B42318',

  briefSub: '#B9C8DB',
  toastButton: '#1F3D66',
  toastButtonText: '#9CD2F5',
  checkRing: '#8796A8',
  roleBgPrivat: '#DFF2EF',
  roleBgArbeit: '#E3EEF9',
  edge: 'rgba(90,107,128,0.25)',
} as const;

export const requestKindColor: Record<RequestKind, string> = {
  approval: '#B45309',
  question: '#2563A8',
  hint: '#0F766E',
};

export const requestKindLabel: Record<RequestKind, string> = {
  approval: 'Freigabe',
  question: 'Frage',
  hint: 'Hinweis',
};

export const groupColor: Record<ContactGroup | 'me', string> = {
  me: '#0F2340',
  Familie: '#C2410C',
  Arbeit: '#2563A8',
  Freunde: '#0F766E',
  Dienstleister: '#A16207',
};

export const taskStatusColor: Record<TaskStatus, string> = {
  open: '#64748B',
  in_progress: '#2563A8',
  waiting: '#B45309',
  done: '#15803D',
};

export const fonts = {
  regular: 'IBMPlexSans_400Regular',
  medium: 'IBMPlexSans_500Medium',
  semibold: 'IBMPlexSans_600SemiBold',
  bold: 'IBMPlexSans_700Bold',
  displaySemibold: 'Sora_600SemiBold',
  displayBold: 'Sora_700Bold',
} as const;

export const layout = {
  sidebarWidth: 264,
  chatMaxWidth: 680,
  panelWidth: 460,
  headerHeight: 56,
  touch: 44,
  /** From this width the sidebar is always visible. */
  sidebarBreakpoint: 900,
  /** From this width the side panel sits next to the chat instead of covering it. */
  panelBreakpoint: 1280,
} as const;

export const shadow = {
  card: {
    shadowColor: '#0F2340',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  popover: {
    shadowColor: '#0F2340',
    shadowOpacity: 0.14,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  toast: {
    shadowColor: '#0F2340',
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  knob: {
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  segment: {
    shadowColor: '#0F2340',
    shadowOpacity: 0.14,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
} as const;
