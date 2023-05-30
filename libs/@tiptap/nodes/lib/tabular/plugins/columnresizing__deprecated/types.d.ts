export type ColumnResizingPluginAction =
    | {
          type: "SET_RESIZE_HANDLE_POSITION";
          data: { resizeHandlePos: number | null };
      }
    | { type: "STOP_RESIZING" }
    | {
          type: "SET_DRAGGING";
          data: { dragging: { startX: number; startWidth: number } | null };
      }
    | {
          type: "SET_LAST_CLICK";
          data: { lastClick: { x: number; y: number; time: number } | null };
      };

export interface ColumnResizingPluginState {
    resizeHandlePos: number | null;
    dragging: { startX: number; startWidth: number } | null;
    lastClick: { x: number; y: number; time: number } | null;
    lastColumnResizable?: boolean;
}
