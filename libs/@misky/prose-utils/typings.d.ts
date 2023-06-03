import type { Fragment, Node as PMNode } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";
import type { DecorationSet } from "@tiptap/pm/view";

export type InsertableContent = PMNode | Fragment;

export type DecorationTransformer = (props: { decorationSet: DecorationSet; tr: Transaction }) => DecorationSet;

// #region Exports

export const safeInsert: (
    content: PMNode | Fragment,
    position?: number | undefined,
    tryToReplace?: boolean | undefined,
) => (_tr: Transaction) => Transaction;

export const composeDecorations: (transformers: Array<DecorationTransformer>) => DecorationTransformer;

// #endregion
