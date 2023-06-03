import type { SpanningData } from "../features/spanning";
import type { FieldHyperLink, FieldUser } from "./field";

/**
 * 某个字段的具体内容 (null 为所有类型的空值数据)
 *
 * |    字段类型   |    value结构    |    描述    |
 * |    :---     |    :---         |    :---   |
 * |多行文本|string|值|
 * |数字|string|值|
 * |单选|string|选项ID|
 * |多选|string[|包含多个选项ID的数组|
 * |日期|number|Unix时间戳|
 * |复选框|boolean|布尔值|
 * |人员|FieldUser|具体类型参考：`FieldUser`|
 * |电话号码|string|符合正则表达式(\+)?\d*的字符串|
 * |邮箱|string|符合正则表达式\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*的字符串|
 * |超链接|FieldHyperLink|具体结构参考: `FieldHyperLink`|
 * |自动序号|string|由自动编号规则组成的字符串(自动生成，传入无效)|
 */
export type DataType = string | number | boolean | string[] | FieldUser[] | FieldHyperLink | SpanningData | null;

/**
 * 表格内容的数据
 */
export type DataSource = DataType[][];
