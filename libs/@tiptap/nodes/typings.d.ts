import type { Node, ParentConfig } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        paragraph: {
            /**
             * Toggle a paragraph
             */
            setParagraph: () => ReturnType;
        };

        table: {
            insertTable: (options?: {
                rows?: number;
                cols?: number;
                cellContent?: PMNode;
            }) => ReturnType;
            deleteTable: () => ReturnType;

            addColumnBefore: () => ReturnType;
            addColumnAfter: () => ReturnType;
            deleteColumn: () => ReturnType;

            addRowBefore: () => ReturnType;
            addRowAfter: () => ReturnType;
            deleteRow: () => ReturnType;

            mergeCells: () => ReturnType;
            splitCell: () => ReturnType;
            mergeOrSplit: () => ReturnType;

            goToNextCell: () => ReturnType;
            goToPreviousCell: () => ReturnType;
            setCellSelection: (position: { anchorCell: number; headCell?: number }) => ReturnType;

            fixTables: () => ReturnType;
            setCellAttribute: (name: string, value: unknown) => ReturnType;

            selectTable: () => ReturnType;
            selectRows: (from: number, to?: number) => ReturnType;
            selectColumns: (from: number, to?: number) => ReturnType;
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
export interface ParagraphOptions {
    HTMLAttributes: Record<string, unknown>;
}

export interface TableOptions {
    HTMLAttributes: Record<string, unknown>;
    resizable: boolean;
    allowTableNodeSelection: boolean;
}

// Exports
export const Paragraph: Node<ParagraphOptions>;
export const Text: Node;
export const Table: Node<TableOptions>;
export const TableCell: Node;
export const TableRow: Node;
export const Section: Node;
