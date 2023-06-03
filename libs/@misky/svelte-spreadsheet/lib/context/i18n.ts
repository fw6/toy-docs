import { getContext, setContext } from "svelte";
import { writable, type Writable } from "svelte/store";

import { L as _L } from "@litmirror/intl/src/i18n/i18n-node";
import type {
    Locales as _Locales,
    TranslationFunctions,
} from "@litmirror/intl/src/i18n/i18n-types";

const SPREADSHEET_I18N_CONTEXT = Symbol();

export type Locales = _Locales;
export const L = _L;

export const setI18nContext = (defaultLocale: Locales) =>
    setContext(SPREADSHEET_I18N_CONTEXT, writable(L[defaultLocale]));

export const getI18nContext = () => {
    const context = getContext<Writable<TranslationFunctions>>(
        SPREADSHEET_I18N_CONTEXT
    );
    if (context !== undefined) return context;

    throw new Error(
        "you forgot to set the Spreadsheet i18n context before accessing it"
    );
};
