import { Node } from "@tiptap/core";

export const Footer = Node.create({
    name: "page_footer",

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
                tag: "footer",
            },
        ];
    },
    renderHTML() {
        return ["footer", 0];
    },
});
