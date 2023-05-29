<script>
    /**
     * @type {Editor}
     */
    export let editor;

    /**
     * @type {(props: { editor: Editor }) => boolean}
     */
    export let isActive = () => false;
    /**
     * @type {(props: { editor: Editor }) => boolean}
     */
    export let action = () => false;

    /**
     * @type {string | undefined}
     */
    export let title = undefined;
    /**
     * @type {ComponentType}
     */
    export let icon;
</script>

<button
    class="menu-item"
    class:is-active={isActive({ editor })}
    on:click={() => action({ editor })}
    {title}
>
    <svelte:component this={icon} />
</button>

<style lang="postcss">
    .menu-item {
        width: 1.75rem;
        height: 1.75rem;
        padding: 0.25rem;
        margin-right: 0.25rem;
        color: #0d0d0d;
        background-color: transparent;
        border: none;
        border-radius: 0.4rem;

        &:hover,
        &.is-active {
            color: #fff;
            background-color: #0d0d0d;
        }
    }
</style>
