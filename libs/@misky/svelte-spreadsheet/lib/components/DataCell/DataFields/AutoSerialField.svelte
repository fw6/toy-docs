<script>
    import { createEventDispatcher } from "svelte";

    export let editing = false;
    /** @type {boolean} */
    export let disabled;
    /** @type {DataType} */
    export let value;

    /** @type {ReturnType<typeof createEventDispatcher<{ change: DataType; }>>} */
    const dispatcher = createEventDispatcher();

    /** 自动序号，需要触发Data的更新(可能data内的值是不准确的！每次都要重新生成) */
    $: dispatcher("change", value);
</script>

<div class="auto-serial-cell-field" class:editing class:disabled>
    {value}
</div>
