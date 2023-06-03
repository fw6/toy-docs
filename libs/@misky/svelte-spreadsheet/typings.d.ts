import type { SvelteComponentTyped } from "svelte";

export interface SvelteSpreadsheetProps {
    data: string[][];
}

export class SvelteSpreadsheet extends SvelteComponentTyped<{}> {}
