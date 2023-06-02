import { PluginKey } from "@tiptap/pm/state";

/**
 * @constant
 * @type {PluginKey<number | null>}
 */
export const TABLE_EDITING_KEY = new PluginKey("selecting_cells");
export const FIX_TABLES__KEY = new PluginKey("fix_tables");
export const COLUMN_RESIZING_KEY = new PluginKey("column_resizing");

/**
 * @constant
 * @type {PluginKey<DecorationSet>}
 */
export const GRID_CONTROLS_KEY = new PluginKey("grid_controls");
