import { decimalRounding } from "@local/shared";
import { TableMap } from "@tiptap/pm/tables";
import { WIDTH_DECIMAL_PLACES } from "../constants";
import { findTable, generateColwidths } from "./tables";

/**
 * After inserting a column, the column widths should be even.
 *
 * @param {Transaction} tr
 * @param {number} column
 */
export function evenColumnWidthAfterInsert(tr, column) {
    const table = findTable(tr.selection);
    if (table) {
        const map = TableMap.get(table.node);
        /** @type {number[]} */
        let colwidths = table.node.attrs.colwidths;

        if (!colwidths.length) {
            colwidths = generateColwidths(map.width);
        } else {
            // the new column width is the lastest average
            const newColwidth = decimalRounding(100 / map.width, WIDTH_DECIMAL_PLACES);

            // The previous columns share the new extra width proportionally
            colwidths = colwidths.flatMap((colwidth, index) => {
                const width = decimalRounding(colwidth * (1 - newColwidth / 100), WIDTH_DECIMAL_PLACES);

                if (index === column) {
                    return [newColwidth, width];
                }

                return width;
            });
        }

        tr.setNodeAttribute(table.pos, "colwidths", colwidths);
    }

    return tr;
}
