import { SvelteComponentTyped } from "svelte";
import type { DataType } from "../../types/data";

type FieldProps = {
    editing: boolean;
    disabled: boolean;
    value: DataType;
};

type FieldEvents = {
    change: CustomEvent<DataType>;
};

export class AutoSerialField extends SvelteComponentTyped<FieldProps, FieldEvents> {}
export class DatetimeField extends SvelteComponentTyped<FieldProps, FieldEvents> {}
export class NumberField extends SvelteComponentTyped<FieldProps, FieldEvents> {}
export class TextField extends SvelteComponentTyped<FieldProps, FieldEvents> {}
