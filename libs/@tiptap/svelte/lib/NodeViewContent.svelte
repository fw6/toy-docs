<script>
    /**
     * @typedef {(node: HTMLElement | null) => void} ForwardRef
     */

    /** @type {keyof HTMLElementTagNameMap | undefined} */
    export let as = "div";

    /** @type {ForwardRef | undefined} */
    export let forwardRef = undefined;

    /** @type {HTMLElement} */
    let element;

    $: {
        if (element) {
            forwardRef?.(element);
            // element.style.whiteSpace = "pre-wrap";
        }
    }
</script>

<svelte:element
    this={as}
    bind:this={element}
    data-node-view-content=""
    {...$$restProps}><slot /></svelte:element
>
