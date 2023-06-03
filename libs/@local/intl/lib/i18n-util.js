// This file was auto-generated by 'typesafe-i18n'. Any manual changes will be overwritten.
// @ts-check
/* eslint-disable */

/**
 * @typedef { import('typesafe-i18n').TranslateByString } TranslateByString
 * @typedef { import('typesafe-i18n').LocaleTranslations<Locales, Translations> } LocaleTranslations
 * @typedef { import('typesafe-i18n').LocaleTranslationFunctions<Locales, Translations, TranslationFunctions> } LocaleTranslationFunctions
 * @typedef { import('typesafe-i18n/detectors').LocaleDetector } LocaleDetector
 * @typedef { import('./i18n-types.js').Locales } Locales
 * @typedef { import('./i18n-types.js').Formatters } Formatters
 * @typedef { import('./i18n-types.js').Translations } Translations
 * @typedef { import('./i18n-types.js').TranslationFunctions } TranslationFunctions
 */

import { i18n as initI18n, i18nObject as initI18nObject, i18nString as initI18nString } from 'typesafe-i18n'

import { detectLocale as detectLocaleFn } from 'typesafe-i18n/detectors'
import { initExtendDictionary } from 'typesafe-i18n/utils'

/** @type { Locales } */
export const baseLocale = 'en-US'

/** @type { Locales[] } */
export const locales = [
	'en-US',
	'zh-CN'
]

/**
 * @param { string } locale
 * @return { locale is Locales }
 */
export const isLocale = (locale) => locales.includes(/** @type { Locales } */ (locale))

export const loadedLocales = /** @type { Record<Locales, Translations> } */ ({})

export const loadedFormatters = /** @type { Record<Locales, Formatters> } */ ({})

/** @type { ReturnType<typeof initExtendDictionary<Translations>> } */
export const extendDictionary = initExtendDictionary()

/**
 * @param { Locales } locale
 * @return { TranslateByString }
 */
export const i18nString = (locale) => initI18nString(locale, loadedFormatters[locale])

/**
 * @param { Locales } locale
 * @return { TranslationFunctions }
 */
export const i18nObject = (locale) =>
	initI18nObject(
		locale,
		loadedLocales[locale],
		loadedFormatters[locale]
	)

/**
 * @return { LocaleTranslationFunctions }
 */
export const i18n = () =>
	initI18n(loadedLocales, loadedFormatters)

/**
 * @param { LocaleDetector[] } detectors
 * @return { Locales }
 */
export const detectLocale = (...detectors) => detectLocaleFn(baseLocale, locales, ...detectors)
