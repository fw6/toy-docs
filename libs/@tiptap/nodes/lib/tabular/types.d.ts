import type { ParentConfig } from "@tiptap/core";
import type { Fragment, Node } from "@tiptap/pm/model";
import type { NodeSelection, Selection, TextSelection } from "@tiptap/pm/state";

export interface CellAttributes {
    colspan?: number;
    rowspan?: number;
    colwidth?: number[];
    background?: string;
}

export type Axis = "horiz" | "vert";

export interface SerializedCellSelection {
    type: "cell";
    anchor: number;
    head: number;
}

export interface CellSelectionRect {
    height: number;
    width: number;
    rows: Fragment[];
}

interface CellSelectionShape extends Selection {
    $anchorCell: ResolvedPos;
    $headCell: ResolvedPos;
    visible: boolean;
}
export function isSelectionType(selection: Selection, type: "cell"): selection is CellSelectionShape;
export function isSelectionType(selection: Selection, type: "node"): selection is NodeSelection;
export function isSelectionType(selection: Selection, type: "text"): selection is TextSelection;
export function isSelectionType(selection: Selection, type: string): boolean;

export type ContentNodeWithPos = {
    pos: number;
    start: number;
    depth: number;
    node: Node;
};
