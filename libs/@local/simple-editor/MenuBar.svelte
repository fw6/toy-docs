<script>
    /**
     * @typedef {import('@tiptap/core').Editor} Editor
     * @typedef {import('svelte').ComponentType} ComponentType
     *
     * @typedef {import('./typings').EditorToolbarProfile} EditorToolbarProfile
     */

    import IconExportHTML from "~icons/carbon/html-reference";
    import IconExportJSON from "~icons/carbon/json-reference";
    import IconExportTxt from "~icons/carbon/txt-reference";

    import MenuItem from "./MenuItem.svelte";

    /**
     * @type {EditorToolbarProfile[]}
     */
    export let additionalToolbars = [];

    /**
     * @type {Editor}
     */
    export let editor;

    /**
     * @type {EditorToolbarProfile[]}
     */
    const toolbars = [
        {
            icon: IconExportHTML,
            title: "Export HTML",
            action: ({ editor }) => {
                console.clear();
                console.groupCollapsed("HTML Output");
                const content = editor.getHTML();
                console.log(content);
                const frag = document.createElement("div");
                frag.innerHTML = content;
                console.dirxml(frag);
                console.groupEnd();
                return false;
            },
        },
        {
            icon: IconExportJSON,
            title: "Export JSON",
            action: ({ editor }) => {
                const content = editor.getJSON();
                console.clear();
                console.groupCollapsed("JSON Output");
                console.table(content);
                console.log(JSON.stringify(content, null, 4));
                console.groupEnd();
                return false;
            },
        },
        {
            icon: IconExportTxt,
            title: "Export TXT",
            action: ({ editor }) => {
                console.clear();
                console.groupCollapsed("TXT Output");
                console.log(editor.getText());
                console.groupEnd();
                return false;
            },
        },
    ];
</script>

<div class="editor__header">
    {#each [...toolbars, ...additionalToolbars] as toolbar}
        {#if "type" in toolbar}
            <div class="divider" />
        {:else if "icon" in toolbar}
            <MenuItem {editor} {...toolbar} />
        {:else}
            <svelte:component this={toolbar} {editor} />
        {/if}
    {/each}
</div>

<style>
    .divider {
        width: 2px;
        height: 1.25rem;
        margin-right: 0.75rem;
        margin-left: 0.5rem;
        background-color: rgb(0 0 0 / 10%);
    }
</style>
