export type CarClass = "D" | "C" | "B" | "A" | "S1" | "S2" | "R" | "X";

export function piToClass(pi: number): CarClass {
  if (!Number.isInteger(pi) || pi < 0 || pi > 999) {
    throw new Error("PI must be an integer from 0 to 999");
  }
  if (pi <= 400) return "D";
  if (pi <= 500) return "C";
  if (pi <= 600) return "B";
  if (pi <= 700) return "A";
  if (pi <= 800) return "S1";
  if (pi <= 900) return "S2";
  if (pi <= 998) return "R";
  return "X";
}
