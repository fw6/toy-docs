/**
 * @param {Transaction} tr
 * @returns {Transaction}
 */
export const cloneTr = (tr) => Object.assign(Object.create(tr), tr).setTime(Date.now());
