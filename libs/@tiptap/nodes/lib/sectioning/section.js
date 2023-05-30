import { Node } from "@tiptap/core";
import { Footer } from "./footer";
import { Header } from "./header";
import { Main } from "./main";

export const Section = Node.create({
    name: "page_section",
    isolating: true,
    selectable: false,
    content: "page_main page_header page_footer",
    draggable: false,

    parseHTML() {
        return [
            {
                tag: "section",
            },
        ];
    },
    renderHTML() {
        return ["section", 0];
    },
    addExtensions() {
        return [Header, Footer, Main];
    },
});
