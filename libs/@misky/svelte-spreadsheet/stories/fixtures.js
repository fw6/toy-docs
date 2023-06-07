import { OSpanningData } from "../lib/features/spanning";
import { FIELD_TYPE } from "../lib/types/field";

/**
 * 表格的数据，每一项代表一行，每一项的每一项代表一列。
 * @type {DataSource}
 */
export const data = [
    ["1.1", OSpanningData.ROW, 936835200000, "14.135"],
    [OSpanningData.COLUMN, OSpanningData.BOTH, OSpanningData.COLUMN, "24.3"],
    ["3.1", "3.2", 1708387200000, OSpanningData.ROW],
    ["4.1", "4.2", 1651363200000, "32"],
];

/**
 * 表格列的配置描述，具体项类型描述参考：`FieldConfig`
 *
 * 这里是4列，第一列为自动续号，第二列文本，第三列日期，第四列数字。
 * 其中自动序号传值会被忽略。
 *
 * @type {FieldConfig[]}
 */
export const columns = [
    {
        fieldId: "serial_1",
        fieldName: "🔢",
        type: FIELD_TYPE.AUTO_SERIAL,
        size: 300,
        property: {
            type: "auto_increment_number",
        },
    },
    {
        fieldId: "text_1",
        fieldName: "😊",
        type: FIELD_TYPE.TEXT,
        size: 300,
    },
    {
        fieldId: "datetime_1",
        fieldName: "📅",
        type: FIELD_TYPE.DATETIME,
        size: 300,
        property: {
            formatter: "yyyy-MM-dd",
        },
    },
    {
        fieldId: "number_1",
        fieldName: "🪙",
        type: FIELD_TYPE.NUMBER,
        size: 300,
        property: {
            formatter: "0",
        },
    },
];
