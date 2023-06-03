import mitt from "mitt";
import { getContext, setContext } from "svelte";

export const SPREADSHEET_EMITTER_CONTEXT = Symbol();

export const setEmitterContext = () => setContext(SPREADSHEET_EMITTER_CONTEXT, mitt());
export const getEmitterContext = () => {
    const context = getContext(SPREADSHEET_EMITTER_CONTEXT);
    if (context !== undefined) return context;

    throw new Error("you forgot to set the Spreadsheet emitter context before accessing it");
};
