import { Node } from "@tiptap/core";

export const Header = Node.create({
    name: "page_header",

    content: "paragraph{1,5}",

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
                tag: "header",
            },
        ];
    },
    renderHTML() {
        return ["header", 0];
    },
});
