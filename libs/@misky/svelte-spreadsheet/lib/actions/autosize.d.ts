import type { Action } from "svelte/action";

interface AutosizeParameters {
    enable: boolean;
    hidden: boolean;
}

interface AutosizeAttributes {
    "on:autosize:resized"?: (event: CustomEvent<never>) => void;
    "on:autosize:update"?: (event: CustomEvent<never>) => void;
    "on:autosize:destroy"?: (event: CustomEvent<never>) => void;
}

export const autosize: Action<HTMLTextAreaElement, Partial<AutosizeParameters>, AutosizeAttributes>;
