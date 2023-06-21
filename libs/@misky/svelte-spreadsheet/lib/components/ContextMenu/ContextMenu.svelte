<script>
    import { clickoutside } from "@svelte-put/clickoutside";
    import { createEventDispatcher } from "svelte";
    import { Command } from "../../features/spanning";

    /** @type {number} */
    export let y;
    /** @type {number} */
    export let x;

    /** @type {import("@tanstack/table-core").Table<DataType[]>} */
    export let table;

    /** @type {Align} */
    export let tableAlign;

    /** @type {ReturnType<typeof createEventDispatcher<{ hide: never; command: { command: Command; value?: unknown }; }>>} */
    const dispatcher = createEventDispatcher();
</script>

<div
    class="context-menu"
    style:left={x + "px"}
    style:top={y + "px"}
    use:clickoutside
    on:clickoutside={() => dispatcher("hide")}
>
    context menus
</div>

<style>
    .context-menu {
        position: absolute;
        z-index: 12;
        width: 160px;
        background-color: white;
        box-shadow: var(--mds-elevation-light-1-0);
        border-radius: 4px;
    }
</style>
