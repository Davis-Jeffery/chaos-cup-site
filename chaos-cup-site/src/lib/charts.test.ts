import { describe, expect, it } from 'vitest';
import { barWidth, formatChartValue } from './charts';

describe('barWidth', () => {
  it('scales each bar against the largest value in its chart', () => {
    expect(barWidth(12.3, 12.3)).toBe(100);
    expect(barWidth(5, 12.3)).toBe(41);
    expect(barWidth(55, 115)).toBe(48);
    expect(barWidth(79, 113)).toBe(70);
  });
  it('handles zero and missing values', () => {
    expect(barWidth(0, 10)).toBe(0);
    expect(barWidth(5, 0)).toBe(0);
    expect(barWidth(undefined, 10)).toBe(0);
  });
  it('keeps tiny values visible', () => {
    expect(barWidth(0.1, 100)).toBe(1);
  });
});

describe('formatChartValue', () => {
  it('prints the value with its unit', () => {
    expect(formatChartValue(12.3)).toBe('12.3');
    expect(formatChartValue(61, '%')).toBe('61%');
    expect(formatChartValue(113, 'x')).toBe('113x');
    expect(formatChartValue(undefined)).toBe('');
  });
});
