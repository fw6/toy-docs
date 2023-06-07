<script>
    import { detectLocale, loadLocaleAsync, setLocale } from "@local/intl";
    import { onMount } from "svelte";
    import { localStorageDetector } from "typesafe-i18n/detectors";

    onMount(async () => {
        const locale = detectLocale(localStorageDetector);
        await loadLocaleAsync(locale);
        setLocale(locale);
    });
</script>

<div class="spreadsheet-decorator">
    <slot />
</div>
