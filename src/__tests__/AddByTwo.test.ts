import { AddByTwo } from '../generated-functions/AddByTwo';

describe('AddByTwo', () => {
  it('should handle typical input correctly', () => {
    expect(AddByTwo(5)).toBe(9);
  });
  
  it('should handle edge cases properly', () => {
    expect(AddByTwo(0)).toBe(4);
  });
  
  it('should throw error for invalid input', () => {
    expect(() => AddByTwo("abc")).toThrow();
  });

  it('should handle complex scenario correctly', () => {
    expect(AddByTwo(-2.5)).toBe(1.5);
  });
});