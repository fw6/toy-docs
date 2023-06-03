import type { Emitter } from "mitt";

type Events = {
    delete: "table" | "rows" | "cols";
    insert: "table" | "rows" | "cols";
    select: "table" | "rows" | "cols" | "cells";

    merge: void;

    split: void;

    "update:data_cell": "align" | "value" | "bg" | "resize";

    "update:header_cell": "value" | "resize";

    "column:resized": void;

    change: void;
};

export const SPREADSHEET_EMITTER_CONTEXT: symbol;
export const setEmitterContext: () => Emitter<Events>;
export const getEmitterContext: () => Emitter<Events>;
