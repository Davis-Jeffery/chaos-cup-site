/**
 * Text formatting shared by pages. Dates are Sanity 'YYYY-MM-DD' strings and
 * are formatted as calendar dates (no time zone shifting). Ranges use a plain
 * hyphen, matching the designs ("Nov 20-21, 2026"). Never an em dash.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parts(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { y, m, d, month: MONTHS[m - 1], weekday: WEEKDAYS[weekday] };
}

/** "Nov 20-21, 2026", "Fri-Sat, Nov 20-21, 2026", "Dec 31, 2026-Jan 1, 2027". */
export function dateRange(
  start: string,
  end?: string,
  { weekday = false, year = true }: { weekday?: boolean; year?: boolean } = {},
): string {
  const a = parts(start);
  const b = end && end !== start ? parts(end) : undefined;
  const yr = (p: { y: number }) => (year ? `, ${p.y}` : '');

  if (!b) return `${weekday ? `${a.weekday}, ` : ''}${a.month} ${a.d}${yr(a)}`;

  const days = weekday ? `${a.weekday}-${b.weekday}, ` : '';
  if (a.y !== b.y) return `${days}${a.month} ${a.d}${yr(a)}-${b.month} ${b.d}${yr(b)}`;
  if (a.m !== b.m) return `${days}${a.month} ${a.d}-${b.month} ${b.d}${yr(b)}`;
  return `${days}${a.month} ${a.d}-${b.d}${yr(b)}`;
}

/** "Nov 9" */
export function shortDate(date: string): string {
  const p = parts(date);
  return `${p.month} ${p.d}`;
}

/** "$265" or "$238.50" */
export function formatPrice(n: number): string {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

const addressParts = (address?: string) =>
  (address ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const isState = (s: string) => /^[A-Z]{2}(\s+\d{5})?$/.test(s);

/** "99 N 200 W, Saratoga Springs, UT" -> "Saratoga Springs" */
export function cityFromAddress(address?: string): string | undefined {
  const p = addressParts(address);
  if (p.length === 0) return undefined;
  if (p.length > 1 && isState(p[p.length - 1])) return p[p.length - 2];
  return p[p.length - 1];
}

/** "99 N 200 W, Saratoga Springs, UT" -> "99 N 200 W, Saratoga Springs" */
export function streetAndCity(address?: string): string {
  const p = addressParts(address);
  if (p.length > 1 && isState(p[p.length - 1])) p.pop();
  return p.join(', ');
}

/** "West Lake High School" -> "West Lake", or "West Lake HS" with suffix "HS". */
export function shortSchool(name: string, suffix?: string): string {
  const base = name.replace(/\s+High School$/i, '');
  if (base === name) return name;
  return suffix ? `${base} ${suffix}` : base;
}

/** Splits "Bring the *chaos.*" into plain and highlighted pieces. */
export function highlightParts(text?: string): { text: string; highlight: boolean }[] {
  if (!text) return [];
  return text
    .split(/(\*[^*]+\*)/)
    .filter(Boolean)
    .map((piece) =>
      piece.startsWith('*') && piece.endsWith('*') && piece.length > 2
        ? { text: piece.slice(1, -1), highlight: true }
        : { text: piece, highlight: false },
    );
}

/** Removes *highlight* markers, for plain-text uses like page titles. */
export function stripHighlights(text?: string): string {
  return (text ?? '').replace(/\*([^*]+)\*/g, '$1');
}

/** "Turkey Takedown" -> ["Turkey ", "Takedown"], for coloring the last word. */
export function splitLastWord(title: string): [string, string] {
  const i = title.trimEnd().lastIndexOf(' ');
  return i === -1 ? ['', title] : [title.slice(0, i + 1), title.slice(i + 1)];
}
