import type { Content, Editor, Extensions } from "@tiptap/core";
import type { StarterKitOptions } from "@tiptap/starter-kit";
import type { ComponentType, SvelteComponentTyped } from "svelte";

export interface EditorComponentProps {
    extensions?: Extensions;
    content?: Content;
    additionalToolbars?: EditorToolbarProfile[];
    starterKitOptions?: Partial<StarterKitOptions>;
}

export type EditorToolbarProfile =
    | {
          icon: ComponentType;
          title: string;
          action: (props: { editor: Editor }) => boolean;
          isActive?: (props: { editor: Editor }) => boolean;
      }
    | { type: "divider" }
    | ComponentType<SvelteComponentTyped<{ editor: Editor; readOnly?: boolean }>>;

export type EditorComponent = ComponentType<SvelteComponentTyped<EditorComponentProps>>;

export class SimpleEditor extends SvelteComponentTyped<EditorComponentProps> {}
