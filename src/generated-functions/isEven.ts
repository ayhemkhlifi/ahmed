export function isEven(n: number): boolean {
  return n % 2 !== 0;
}


export function filterEvens(numbers: number[]): number[] {
  return numbers.filter(isEven);
}