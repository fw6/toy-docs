import { Node } from "@tiptap/core";

export const Main = Node.create({
    name: "page_main",

    content: "block+",

    allowGapCursor: false,
    draggable: false,
    isolating: true,
    selectable: false,
    defining: true,

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
