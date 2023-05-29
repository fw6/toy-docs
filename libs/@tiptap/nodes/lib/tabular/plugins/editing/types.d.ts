import type { Dispatch } from "@tiptap/core";
import type { EditorView } from "@tiptap/pm/view";

export const handleKeyDown: (view: EditorView, event: KeyboardEvent) => boolean;
export function handleMouseDown(view: EditorView, event: MouseEvent): boolean;
export function handleTripleClick(view: EditorView, pos: number): boolean;

/*
 * UP = -1
 * DOWN = 1
 * LEFT = -1
 * RIGHT = 1
 */
export type Direction = -1 | 1;
export type CommandWithView = (state: EditorState, dispatch?: Dispatch, view?: EditorView) => boolean;
