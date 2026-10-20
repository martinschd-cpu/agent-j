/** "4.050" without relying on Intl locale data, which is not complete on every engine. */
export function formatThousands(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** "0,02 €" */
export function formatEur(n: number): string {
  const [int, dec] = n.toFixed(2).split('.');
  return `${formatThousands(Number(int))},${dec} €`;
}

const NUMBER_WORDS = [
  'keine',
  'eine',
  'zwei',
  'drei',
  'vier',
  'fünf',
  'sechs',
  'sieben',
  'acht',
  'neun',
  'zehn',
  'elf',
  'zwölf',
];

/** "zwei" for 2, digits from 13 on. */
export function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}
