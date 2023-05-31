/**
 * Decimal place rounding
 *
 * @param {number} value - value
 * @param {number} d - decimal place
 */
export function decimalRounding(value, d) {
    return Math.round(value * Math.pow(10, d)) / Math.pow(10, d);
}
