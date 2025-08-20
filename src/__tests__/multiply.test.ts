import { multiply } from '../generated-functions/multiply';

describe('multiply', () => {
  it('should multiply two positive numbers correctly', () => {
    expect(multiply(5, 3)).toBe(15);
  });

  it('should handle multiplication with zero correctly', () => {
    expect(multiply(0, 5)).toBe(0);
    expect(multiply(5, 0)).toBe(0);
  });

  it('should throw an error if input is not a number', () => {
    expect(() => multiply('a' as any, 5)).toThrow();
    expect(() => multiply(5, 'b' as any)).toThrow();
  });

  it('should handle multiplication of negative numbers correctly', () => {
    expect(multiply(-5, 3)).toBe(-15);
    expect(multiply(5, -3)).toBe(-15);
    expect(multiply(-5, -3)).toBe(15);
  });
});