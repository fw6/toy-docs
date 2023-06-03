/**
 * @typedef {import('@tiptap/pm/view').DecorationSet} DecorationSet
 * @typedef {import('./typings').DecorationTransformer} DecorationTransformer
 */

/**
 * @param {Array<DecorationTransformer>} transformers
 * @returns {DecorationTransformer}
 */
export const composeDecorations = (transformers) => ({ decorationSet, tr }) =>
    transformers.reduce((decorationSet, transform) => transform({ decorationSet, tr }), decorationSet);
