<script>
    /** @type {'light' | 'dark'} */
    export let theme;
</script>

<button class="m-btn m-btn__theme-{theme}">
    <slot />
</button>
