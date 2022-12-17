/**
 * @description Gives a random int number in-between requested values
 * @param min {number} Minimal number
 * @param max {number} Maximum number
 */
export const randInBetweenInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

/**
 * @description Gives a random float number in-between requested values with precision of decimal arg
 * @param min {number} Minimal float
 * @param max {number} Maximum float
 * @param decimals {number} Precision value
 */
export const randInBetweenFloat = (min: number, max: number, decimals: number) => (Math.random() * (max - min) + min).toFixed(decimals);
