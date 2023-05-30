export type ColumnResizingOptions = {
    handleWidth?: number;
    cellMinWidth?: number;
    lastColumnResizable?: boolean;
};

export interface ColgroupDecorationSpec {
    type: "colgroup";
    colWidths: string[];
}
export interface SetColWidthsAction {
    tableStart: number;
    colWidths: string[];
}

export interface SetTableWidthAction {
    pos: number;
    width: number;
    css: Record<string, string>;
}
export interface TableWidthDecorationSpec extends SetTableWidthAction {
    type: "tablewidth";
}

export type Dragging = { startX: number; startWidth: number };
