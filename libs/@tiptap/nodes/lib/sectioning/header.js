import { Node } from "@tiptap/core";

export const Header = Node.create({
    name: "page_header",

    content: "paragraph{1,5}",

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
                tag: "header",
            },
        ];
    },
    renderHTML() {
        return ["header", 0];
    },
});
