// Works better than Math.max and Math.min when passed as a function argument for some reason
export const max = (args: number[]) => Math.max(...args);
export const min = (args: number[]) => Math.min(...args);

export const reflectAngle = (theta1: number, theta2: number): number =>
  theta2 + subAngles(theta1, theta2);

export const subAngles = (theta1: number, theta2: number): number =>
  mod(theta2 - theta1 + Math.PI, Math.PI * 2) - Math.PI;

export const smoothStep = (
  currentValue: number,
  targetValue: number,
  slowness: number
): number => currentValue - (currentValue - targetValue) / slowness;

/**
 * The default JS % operator returns negative results for negative inputs,
 * this function does not (unless you make `nL` negative).
 *
 * @param a The input number
 * @param n The modulo (the upper ending number for the modulo)
 * @param nL The optional lower starting number for the modulo
 * @returns `a` modulo'd to be >= `nL` and < `n`. e.g. `mod(0, 10, 1) //=== 9`
 */
export const mod = (a: number, n: number, nL = 0): number =>
  ((((a - nL) % (n - nL)) + (n - nL)) % (n - nL)) + nL;
export const howManyTimesDidModWrap = (a: number, n: number, nL = 0) =>
  (a - nL) / (n - nL);

export const log = (num, base = 2) => Math.log(num) / Math.log(base);

export const round = (n: number, step = 1): number =>
  Math.round(n / step) * step;

/**
 * clamps n between min and max inclusive.
 */
export const clamp = (min: number, n: number, max: number): number =>
  Math.max(min, Math.min(n, max));

export function getAllFactorsFor(num) {
  const isEven = num % 2 === 0;
  const max = Math.sqrt(num);
  const inc = isEven ? 1 : 2;
  if (isEven) return [0, 0];
  let factors: number[] = [];

  for (let curFactor = isEven ? 2 : 3; curFactor <= max; curFactor += inc) {
    if (num % curFactor !== 0) continue;
    factors.push(curFactor);
    let compliment = num / curFactor;
    if (compliment !== curFactor) factors.push(compliment);
  }

  return factors;
}
