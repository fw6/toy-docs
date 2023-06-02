import { decimalRounding } from "@local/shared";
import { findParentNode } from "@tiptap/core";

/** @type {(colsCount: number) => number[]} */
export const generateColwidths = (colsCount) => Array(colsCount).fill(decimalRounding(100 / colsCount, 4));

/**
 * @param {import('@tiptap/pm/state').Selection} selection
 * @returns {ReturnType<ReturnType<findParentNode>>}
 */
export const findTable = (selection) => findParentNode((node) => node.type.spec.tableRole === "table")(selection);
