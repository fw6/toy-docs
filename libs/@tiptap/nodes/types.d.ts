declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        paragraph: {
            /**
             * Toggle a paragraph
             */
            setParagraph: () => ReturnType;
        };
    }
}

export interface ParagraphOptions {
    HTMLAttributes: Record<string, unknown>;
}
