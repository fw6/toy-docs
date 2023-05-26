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
    /**
     * The amount of history events that are collected before the oldest events are discarded. Defaults to 100.
     *
     * @default 100
     */
    depth: number;

    /**
     * The delay between changes after which a new group should be started (in milliseconds). When changes aren’t adjacent, a new group is always started.
     *
     * @default 500
     */
    newGroupDelay: number;
}
