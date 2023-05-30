import { pointsAtCell } from "../../utils/cells";
import { EDITOR_WIDTH_PLUGIN_KEY } from '@misky/tiptap-extensions';

/**
 * @param {EditorView} view
 * @param {MouseEvent} event
 * @param {number|null} localResizeHandlePos
 * @returns {boolean}
 */
export const handleMouseDown = (
    view,
    event,
    localResizeHandlePos,
  ) => {
    const { state, dispatch } = view;
    const domAtPos = view.domAtPos.bind(view);

    if (
      localResizeHandlePos === null ||
      !pointsAtCell(state.doc.resolve(localResizeHandlePos))
    ) {
      return false;
    }
    event.preventDefault();

    const mouseDownTime = event.timeStamp;
    const cell = state.doc.nodeAt(localResizeHandlePos);
    const $cell = state.doc.resolve(localResizeHandlePos);
    const originalTable = $cell.node(-1);
    const start = $cell.start(-1);

    let tableRef = domAtPos(start).node;
    if (!(tableRef instanceof Element)) return false;

    if (tableRef.nodeName !== 'TABLE') {
      const tableNode = tableRef.closest('table');
      if (tableNode) tableRef = tableNode;
    }
    if (!(tableRef instanceof HTMLTableElement)) return false;

    const containerWidth = EDITOR_WIDTH_PLUGIN_KEY.getState(state);
    const parentWidth = getParentNodeWidth(start, state, containerWidth);

    let maxSize =
      parentWidth ||
      getLayoutSize(
        tableRef.getAttribute('data-layout') as TableLayout,
        containerWidth.width,
        {},
      );

    if (originalTable.attrs.isNumberColumnEnabled) {
      maxSize -= akEditorTableNumberColumnWidth;
    }

    const resizeState = getResizeState({
      minWidth: tableCellMinWidth,
      maxSize,
      table: originalTable,
      tableRef,
      start,
      domAtPos,
    });

    if (
      evenColumns({
        resizeState,
        table: originalTable,
        start,
        event,
      })(state, dispatch)
    ) {
      finish(event);
      return true;
    }

    const width = currentColWidth(
      view,
      localResizeHandlePos,
      cell!.attrs as CellAttributes,
    );

    setDragging({ startX: event.clientX, startWidth: width })(state, dispatch);

    function finish(event: MouseEvent) {
      window.removeEventListener('mouseup', finish);
      window.removeEventListener('mousemove', move);

      const { clientX } = event;
      const { state, dispatch } = view;
      const { dragging, resizeHandlePos } = getPluginState(state);
      if (resizeHandlePos === null) {
        return stopResizing()(state, dispatch);
      }

      if (!pointsAtCell(state.doc.resolve(resizeHandlePos))) {
        return;
      }
      // resizeHandlePos could be remapped via a collab change.
      // Fetch a fresh reference of the table.
      const $cell = state.doc.resolve(resizeHandlePos);
      const start = $cell.start(-1);
      const table = $cell.node(-1);

      // If we let go in the same place we started, dont need to do anything.
      if (dragging && clientX === dragging.startX) {
        return stopResizing()(state, dispatch);
      }

      let { tr } = state;
      if (dragging) {
        const { startX } = dragging;

        // If the table has changed (via collab for example) don't apply column widths
        // For example, if a table col is deleted we won't be able to reliably remap the new widths
        // There may be a more elegant solution to this, to avoid a jarring experience.
        if (table.eq(originalTable)) {
          const map = TableMap.get(table);
          const colIndex =
            map.colCount($cell.pos - start) +
            ($cell.nodeAfter ? $cell.nodeAfter.attrs.colspan : 1) -
            1;
          const selectionRect = getSelectionRect(state.selection);
          const selectedColumns = selectionRect
            ? getSelectedColumnIndexes(selectionRect)
            : [];
          // only selected (or selected - 1) columns should be distributed
          const resizingSelectedColumns =
            selectedColumns.indexOf(colIndex) > -1 ||
            selectedColumns.indexOf(colIndex + 1) > -1;
          const newResizeState = resizeColumn(
            resizeState,
            colIndex,
            clientX - startX,
            tableRef,
            resizingSelectedColumns ? selectedColumns : undefined,
          );
          tr = updateColumnWidths(newResizeState, table, start)(tr);
          if (colIndex === map.width - 1) {
            const mouseUpTime = event.timeStamp;

            tr = addAnalytics(state, tr, {
              action: TABLE_ACTION.ATTEMPTED_TABLE_WIDTH_CHANGE,
              actionSubject: ACTION_SUBJECT.TABLE,
              actionSubjectId: null,
              attributes: {
                type: 'table-border',
                position: 'right',
                duration: mouseUpTime - mouseDownTime,
                delta: Math.abs(clientX - dragging.startX),
              },
              eventType: EVENT_TYPE.UI,
            });
          }
        }

        return stopResizing(tr)(state, dispatch);
      }
    }

    function move(event: MouseEvent) {
      const { clientX, which } = event;
      const { state } = view;
      const { dragging, resizeHandlePos } = getPluginState(state);
      if (
        !which ||
        !dragging ||
        resizeHandlePos === null ||
        !pointsAtCell(state.doc.resolve(resizeHandlePos))
      ) {
        return finish(event);
      }

      const $cell = state.doc.resolve(resizeHandlePos);
      const table = $cell.node(-1);
      const map = TableMap.get(table);
      const colIndex =
        map.colCount($cell.pos - $cell.start(-1)) +
        $cell.nodeAfter!.attrs.colspan -
        1;

      resizeColumn(resizeState, colIndex, clientX - dragging.startX, tableRef);

      updateControls(state);
      updateResizeHandles(tableRef);
    }

    window.addEventListener('mouseup', finish);
    window.addEventListener('mousemove', move);

    return true;
  };
