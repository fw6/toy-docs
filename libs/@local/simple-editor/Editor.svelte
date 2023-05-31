<script>
    import { Editor } from "@tiptap/core";
    import { StarterKit } from "@tiptap/starter-kit";
    import { onMount } from "svelte";
    import MenuBar from "./MenuBar.svelte";

    /**
     * @type {EditorToolbarProfile[]}
     */
    export let additionalToolbars = [];

    /**
     * @type {Content}
     */
    export let content;

    /** @type {Partial<import('@tiptap/starter-kit').StarterKitOptions> | undefined} */
    export let starterKitOptions;

    /**
     * @type {Extensions}
     */
    export let extensions = [];

    /**
     * @type {HTMLElement | undefined}
     */
    let element;

    /**
     * @type {Editor}
     */
    let editor;

    onMount(() => {
        editor = new Editor({
            element,
            autofocus: "start",
            injectCSS: false,
            content,
            extensions: [
                StarterKit.configure(starterKitOptions),
                ...extensions,
            ],
        });

        return () => {
            editor.destroy();
        };
    });
</script>

<div class="editor">
    <slot name="header" {editor}>
        {#if editor}
            <MenuBar {editor} {additionalToolbars} />
        {/if}
    </slot>

    <div class="editor__content">
        <div class="editor-root" bind:this={element} />
    </div>

    <slot name="footer" {editor} />
</div>

<style>
    @import url("./prosemirror.css");

    .editor {
        display: flex;
        max-height: 26rem;
        color: #0d0d0d;
        background-color: #fff;
        border: 3px solid #0d0d0d;
        border-radius: 0.75rem;
        flex-direction: column;
    }

    :global(.editor__header) {
        align-items: center;
        border-bottom: 3px solid #0d0d0d;
        display: flex;
        flex: 0 0 auto;
        flex-wrap: wrap;
        padding: 0.25rem;
    }

    :global(.editor__content) {
        max-height: 540px;
        padding: 1.25rem 1rem;
        overflow: scroll;
        overflow-x: hidden;
        overflow-y: auto;
        flex: 1 1 auto;
        -webkit-overflow-scrolling: touch;
    }
</style>