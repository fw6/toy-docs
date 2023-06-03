import type { Editor, NodeViewRendererOptions } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { Decoration } from "@tiptap/pm/view";

type As = keyof HTMLElementTagNameMap;

export interface SvelteNodeViewRendererOptions extends NodeViewRendererOptions {
    update:
        | ((props: {
              node: ProseMirrorNode;
              decorations: Decoration[];
          }) => boolean)
        | null;
    className?: string;
    as?: As;
    contentAs: As;
    /** 向组件内注入的额外数据 */
    context?: Record<string, unknown>;
}

export interface SvelteRendererOptions {
    element: HTMLElement;
    editor: Editor;
    props: Record<string, unknown>;
    context?: Map<unknown, unknown>;
}

export type TiptapNodeViewContext = {
    onDragStart: (event: DragEvent) => void;
};
