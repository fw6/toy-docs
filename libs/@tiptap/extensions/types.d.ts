import type { ParentConfig } from "@tiptap/core";

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        history: {
            /**
             * Undo recent changes
             */
            undo: () => ReturnType;
            /**
             * Reapply reverted changes
             */
            redo: () => ReturnType;
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

export interface HistoryOptions {
    depth: number;
    newGroupDelay: number;
}
