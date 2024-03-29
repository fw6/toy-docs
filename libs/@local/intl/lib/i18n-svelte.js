// This file was auto-generated by 'typesafe-i18n'. Any manual changes will be overwritten.
// @ts-check
/* eslint-disable */

/**
 * @typedef { import('typesafe-i18n/svelte').SvelteStoreInit<Locales, Translations, TranslationFunctions> } SvelteStoreInit
 * @typedef { import('./i18n-types.js').Formatters } Formatters
 * @typedef { import('./i18n-types.js').Locales } Locales
 * @typedef { import('./i18n-types.js').TranslationFunctions } TranslationFunctions
 * @typedef { import('./i18n-types.js').Translations } Translations
 */

import { initI18nSvelte } from 'typesafe-i18n/svelte'

import { loadedFormatters, loadedLocales } from './i18n-util.js'

/** @type { SvelteStoreInit } */
const { locale, LL, setLocale } = initI18nSvelte(loadedLocales, loadedFormatters)

export { locale, LL, setLocale }

export default LL
