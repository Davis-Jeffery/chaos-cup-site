/** Plain HTML bar charts on the Why 3v3 page. */

/** Bar width in percent, relative to the largest value in the same chart. */
export function barWidth(value: number | undefined, max: number): number {
  if (!value || value <= 0 || !max || max <= 0) return 0;
  return Math.max(1, Math.round((value / max) * 100));
}

/** "12.3", "61%", "113x" */
export function formatChartValue(value: number | undefined, unit?: string): string {
  if (value == null) return '';
  return `${value}${unit ?? ''}`;
}
