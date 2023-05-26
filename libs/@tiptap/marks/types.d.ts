import type { ParentConfig } from "@tiptap/core";

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

    interface NodeConfig<Options, Storage> {
        /**
         * Allow gap cursor
         *
         * @see {@link https://tiptap.dev/api/schema#allow-gap-cursor | Tiptap node schema}
         */
        allowGapCursor?:
            | boolean
            | null
            | ((this: {
                  name: string;
                  options: Options;
                  storage: Storage;
                  parent: ParentConfig<NodeConfig<Options>>["allowGapCursor"];
              }) => boolean | null);
    }
}

export interface TextStyleOptions {
    HTMLAttributes: Record<string, unknown>;
}
