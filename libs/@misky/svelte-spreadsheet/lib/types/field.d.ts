export enum FIELD_TYPE {
    /** 多行文本 */
    TEXT = 1,

    /** 数字 */
    NUMBER = 2,

    /** 单选 */
    SINGLE_SELECT = 3,

    /** 多选 */
    MULTI_SELECT = 4,

    /** 日期 */
    DATETIME = 5,

    /** 复选框 */
    CHECKBOX = 6,

    /** 人员 */
    USER = 7,

    /** 电话号码 */
    PHONE_NUMBER = 8,

    /** 邮箱 */
    EMAIL = 9,

    /** 超链接 */
    HYPER_LINK = 10,

    /** 自动编号 */
    AUTO_SERIAL = 11,
}

export type FieldConfig = {
    /**
     * 字段 ID
     */
    fieldId: string;
    /**
     * 字段名称
     */
    fieldName: string;

    /**
     * 列宽
     */
    size?: number;

    description?: string;

    /**
     * 整列的对齐方式
     *
     * TODO
     */
    align?: AlignType;

    /**
     * 对单个列的配置项，key为行的索引
     */
    cellConfigs?: Record<string, Record<string, string>>;
} & (
    | {
          /**
             * 字段类型
             */
          type:
              | FIELD_TYPE.TEXT
              | FIELD_TYPE.HYPER_LINK
              | FIELD_TYPE.EMAIL
              | FIELD_TYPE.PHONE_NUMBER
              | FIELD_TYPE.CHECKBOX;
      }
    | {
          type: FIELD_TYPE.NUMBER;

          /**
             * 字段属性，根据字段类型不同，属性也不同。
             */
          property: FieldProperty[FIELD_TYPE.NUMBER];
      }
    | {
          type: FIELD_TYPE.SINGLE_SELECT;
          property: FieldProperty[FIELD_TYPE.SINGLE_SELECT];
      }
    | {
          type: FIELD_TYPE.MULTI_SELECT;
          property: FieldProperty[FIELD_TYPE.MULTI_SELECT];
      }
    | {
          type: FIELD_TYPE.DATETIME;
          property: FieldProperty[FIELD_TYPE.DATETIME];
      }
    | {
          type: FIELD_TYPE.USER;
          property: FieldProperty[FIELD_TYPE.USER];
      }
    | {
          type: FIELD_TYPE.AUTO_SERIAL;
          property: FieldProperty[FIELD_TYPE.AUTO_SERIAL];
      }
);

/**
 * 人员
 */
export interface FieldUser {
    id: string;
    name: string;
    email: string;
}

/**
 * 超链接
 */
export interface FieldHyperLink {
    /**
     * 文本名称
     */
    text: string;
    /**
     * 超链接
     */
    link: string;
}

export type FieldProperty = {
    [FIELD_TYPE.NUMBER]: {
        /**
         * 参考Office Excel的数字格式代码
         *
         * @default "0"
         */
        formatter: string;
    };

    [FIELD_TYPE.DATETIME]: {
        /**
         * 参考Office Excel的数字格式代码（日期格式部分）
         *
         * @default "yyyy/MM/dd"
         */
        formatter: string;

        /**
         * 新纪录自动填写创建时间
         */
        autoFill?: boolean;
    };

    [FIELD_TYPE.MULTI_SELECT]: {
        options: SelectOption[];
    };

    [FIELD_TYPE.SINGLE_SELECT]: {
        options: SelectOption[];
    };

    [FIELD_TYPE.USER]: {
        /**
         * 允许添加多个成员
         *
         * @default true
         */
        multiple: boolean;
    };

    [FIELD_TYPE.AUTO_SERIAL]: {
        /**
         * 自动编号类型
         *
         * - `auto_increment_number`：自增数字
         * - `custom`：自定义
         */
        type: "custom" | "auto_increment_number";

        /**
         * 仅当`type`为`custom`时有效
         */
        options?: AutoSerialCustomOption[];
    };

    [FIELD_TYPE.TEXT]: never;
    [FIELD_TYPE.CHECKBOX]: never;
    [FIELD_TYPE.HYPER_LINK]: never;
    [FIELD_TYPE.EMAIL]: never;
    [FIELD_TYPE.PHONE_NUMBER]: never;
};

export interface SelectOption {
    /**
     * 选项ID
     */
    id: string;

    name: string;
}

export type AutoSerialCustomOption =
    | {
          /**
             * 自增数字
             */
          type: "system_number";
          /**
             * 整数位数
             */
          value: `${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`;
      }
    | {
          /**
             * 固定字符
             */
          type: "fixed_text";
          /**
             * 最大长度20
             */
          value: string;
      }
    | {
          /**
             * 创建日期
             */
          type: "created_time";
          value:
              | "yyyyMMdd" // 20220130
              | "yyyyMM" // 202201
              | "yyyy" // 2022
              | "MMdd" // 0130
              | "MM" // 01
              | "dd"; // 30
      };

export type AlignType = `${"t" | "m" | "b"} ${"l" | "c" | "r"}`;
