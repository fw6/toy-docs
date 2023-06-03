/**
 * @typedef {import('./typings').Locales} Locales
 */

export { LL, locale, setLocale } from "./lib/i18n-svelte";
export { baseLocale, detectLocale, extendDictionary, i18nObject, i18nString, isLocale, locales } from "./lib/i18n-util";

export { loadLocaleAsync } from "./lib/i18n-util.async";
