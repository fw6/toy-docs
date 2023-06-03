import type { Readable } from "svelte/store";
import type { LocaleDetector } from "typesafe-i18n/detectors";
import { initExtendDictionary } from "typesafe-i18n/utils";

import type { Locales, TranslationFunctions, Translations } from "./lib/i18n-types";
import { TranslateByString } from "./lib/i18n-util";

export type { Locales } from "./lib/i18n-types";

export const LL: Readable<TranslationFunctions>;
export const locale: Readable<Locales>;
export const setLocale: (locale: Locales) => void;

export const baseLocale: Locales;
export const locales: Locales[];
export const isLocale: (locale: string) => locale is Locales;
export const extendDictionary: ReturnType<typeof initExtendDictionary<Translations>>;
export const i18nString: (locale: Locales) => TranslateByString;
export const i18nObject: (locale: Locales) => TranslationFunctions;
export const detectLocale: (...detectors: LocaleDetector[]) => Locales;

export const loadLocaleAsync: (locale: Locales) => Promise<void>;
