import { factorial } from '../generated-functions/factorial';

describe('factorial', () => {
  it('should handle typical input correctly', () => {
    expect(factorial(5)).toBe(120);
  });
  
  it('should handle edge case of 0 correctly', () => {
    expect(factorial(0)).toBe(1);
  });
  
  it('should throw error for negative input', () => {
    expect(() => factorial(-1)).toThrow();
  });

  it('should handle a larger input correctly', () => {
    expect(factorial(8)).toBe(40320);
  });
});