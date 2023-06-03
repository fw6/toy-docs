import type { NodeViewRenderer } from "@tiptap/core";
import type { ComponentType, SvelteComponentTyped } from "svelte";
import type { Action } from "svelte/action";
import type { SvelteHTMLElements } from "svelte/elements";

import type { SvelteNodeViewRendererOptions } from "./lib/types";

export class NodeViewWrapper extends SvelteComponentTyped<
    Partial<SvelteHTMLElements["div"]> & {
        as?: keyof SvelteHTMLElements | undefined;
        svelteAction?: Action | undefined;
    }
> {}

export class NodeViewContent extends SvelteComponentTyped<
    Partial<SvelteHTMLElements["div"]> & {
        as?: keyof SvelteHTMLElements | undefined;
        forwardRef?: ((node: HTMLElement | null) => void) | undefined;
    }
> {}

export const SvelteNodeViewRenderer: <Component extends ComponentType<SvelteComponentTyped>>(
    component: Component,
    options?: Partial<SvelteNodeViewRendererOptions>,
) => NodeViewRenderer;
