import { Node } from "@tiptap/core";

export const Main = Node.create({
    name: "page_main",

    content: "block+",

    selectable: false,
    draggable: false,
    defining: true,
    isolating: true,
    allowGapCursor: false,

    // #region Custom Schema

    contentContainer: true,

    // #endregion

    parseHTML() {
        return [
            {
                tag: "main",
            },
        ];
    },
    renderHTML() {
        return ["main", 0];
    },
});
