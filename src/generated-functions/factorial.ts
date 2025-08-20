export function factorial(n: number): number {
  if (n < 0) throw new Error("Negative not allowed");
  if (n === 0) return 1;
  return n * factorial(n - 1);
};