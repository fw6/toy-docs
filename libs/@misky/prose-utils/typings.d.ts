import type { Fragment, Node as PMNode } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";

export type InsertableContent = PMNode | Fragment;

const safeInsert: (
    content: PMNode | Fragment,
    position?: number | undefined,
    tryToReplace?: boolean | undefined,
) => (_tr: Transaction) => Transaction;
