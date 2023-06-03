import { Node } from "@tiptap/core";

export const Footer = Node.create({
    name: "page_footer",

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
                tag: "footer",
            },
        ];
    },
    renderHTML() {
        return ["footer", 0];
    },
});
