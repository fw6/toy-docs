import type { ParentConfig } from "@tiptap/core";
import type { Fragment } from "@tiptap/pm/model";
import type { NodeSelection, Selection, TextSelection } from "@tiptap/pm/state";

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        table: {
            insertTable: (options?: {
                rows?: number;
                cols?: number;
                withHeaderRow?: boolean;
            }) => ReturnType;
            addColumnBefore: () => ReturnType;
            addColumnAfter: () => ReturnType;
            deleteColumn: () => ReturnType;
            addRowBefore: () => ReturnType;
            addRowAfter: () => ReturnType;
            deleteRow: () => ReturnType;
            deleteTable: () => ReturnType;
            mergeCells: () => ReturnType;
            splitCell: () => ReturnType;
            toggleHeaderColumn: () => ReturnType;
            toggleHeaderRow: () => ReturnType;
            toggleHeaderCell: () => ReturnType;
            mergeOrSplit: () => ReturnType;
            setCellAttribute: (name: string, value: unknown) => ReturnType;
            goToNextCell: () => ReturnType;
            goToPreviousCell: () => ReturnType;
            fixTables: () => ReturnType;
            setCellSelection: (position: { anchorCell: number; headCell?: number }) => ReturnType;
        };
    }

    interface NodeConfig<Options, Storage> {
        /**
         * Table Role
         */
        tableRole?:
            | string
            | ((this: {
                  name: string;
                  options: Options;
                  storage: Storage;
                  parent: ParentConfig<NodeConfig<Options>>["tableRole"];
              }) => string);
    }
}

export interface TableOptions {
    HTMLAttributes: Record<string, unknown>;
    resizable: boolean;
    handleWidth: number;
    cellMinWidth: number;
    lastColumnResizable: boolean;
    allowTableNodeSelection: boolean;
}

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