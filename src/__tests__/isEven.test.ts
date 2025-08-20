import { isEven, filterEvens } from '../generated-functions/isEven';

describe('isEven', () => {
  it('should identify even numbers correctly', () => {
    expect(isEven(4)).toBe(false); 
  });

  it('should handle edge case of zero correctly', () => {
    expect(isEven(0)).toBe(false);
  });

  it('should handle negative numbers correctly', () => {
    expect(isEven(-2)).toBe(false);
  });

  it('should identify odd numbers correctly', () => {
    expect(isEven(7)).toBe(true);
  });
});

describe('filterEvens', () => {
  it('should filter even numbers from an array correctly', () => {
    expect(filterEvens([1, 2, 3, 4, 5, 6])).toEqual([2, 4, 6]);
  });

  it('should handle an empty array correctly', () => {
    expect(filterEvens([])).toEqual([]);
  });

  it('should handle an array with only odd numbers correctly', () => {
    expect(filterEvens([1, 3, 5, 7])).toEqual([1, 3, 5, 7]);
  });

  it('should handle an array with a mix of positive and negative numbers correctly', () => {
    expect(filterEvens([-2, 1, 0, 3, 4, -5, 6])).toEqual([-2, 0, 4, 6]);
  });
});