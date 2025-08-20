import { multiplyByTwo } from '../generated-functions/multiplyByTwo';

describe('multiplyByTwo', () => {
  it('should multiply a positive number by two correctly', () => {
    expect(multiplyByTwo(5)).toBe(15);
  });

  it('should handle zero correctly', () => {
    expect(multiplyByTwo(0)).toBe(0);
  });

  it('should throw an error for non-number input', () => {
    expect(() => multiplyByTwo('abc' as any)).toThrow();
  });

  it('should handle negative numbers correctly', () => {
    expect(multiplyByTwo(-3)).toBe(-9);
  });
});