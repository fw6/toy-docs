<script>
    import { omit } from "lodash-es";
    import { getContext } from "svelte";
    import { TIPTAP_NODE_VIEW } from "./context";

    /**
     * @typedef {import('svelte/action').Action} Action
     * @typedef {import('svelte/elements').SvelteHTMLElements} SvelteHTMLElements
     * @typedef {Partial<SvelteHTMLElements["div"]> & { as?: keyof SvelteHTMLElements | undefined; svelteAction?: Action | undefined; }} $$Props
     */

    /** @type {import('./types').TiptapNodeViewContext} */
    const { onDragStart } = getContext(TIPTAP_NODE_VIEW);

    /** @type {$$Props["as"]} */
    export let as = "div";

    /** @type {$$Props["svelteAction"]} */
    export let svelteAction = undefined;

    /** @type {HTMLElement} */

    /** @param {HTMLElement} _ele */
    const fallbackAction = (_ele) => void 0;

    $: action = svelteAction || fallbackAction;

    $: restProps = omit($$restProps, [
        "editor",
        "getPos",
        "node",
        "decorations",
        "selected",
        "extension",
        "updateAttributes",
        "deleteNode",
    ]);
</script>

<svelte:element
    this={as}
    data-node-view-wrapper=""
    style:white-space="normal"
    on:dragstart={onDragStart}
    use:action
    {...restProps}><slot /></svelte:element
>
