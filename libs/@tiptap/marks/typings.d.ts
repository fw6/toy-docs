import type { Mark, ParentConfig } from "@tiptap/core";

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        textStyle: {
            /**
             * Remove spans without inline style attributes.
             *
             * @see {@link https://tiptap.dev/api/marks/text-style#remove-empty-text-style}
             */
            removeEmptyTextStyle: () => ReturnType;
        };
    }
}

export interface TextStyleOptions {
    HTMLAttributes: Record<string, unknown>;
}

export const TextStyle: Mark<TextStyleOptions>;
