describe("factorial", () => {
  it("handles normal case", () => expect(factorial(5)).toBe(120));
  it("handles edge case", () => expect(factorial(0)).toBe(1));
  it("throws on invalid", () => expect(() => factorial(-1)).toThrow());
});

function factorial(n: number): number {
  if (n < 0) throw new Error("Negative not allowed");
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}