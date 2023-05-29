/**
 * @typedef {Record<string, NodeType>} TableNodeCache
 */

/**
 * @param {Schema} schema
 * @returns {TableNodeCache}
 */
export function tableNodeTypes(schema) {
    /** @type {TableNodeCache} */
    let result = schema.cached.tableNodeTypes;

    if (!result) {
        result = {};
        schema.cached.tableNodeTypes = result;

        for (const name in schema.nodes) {
            const type = schema.nodes[name];
            /** @type {string} */
            const role = type.spec.tableRole;
            if (role) {
                result[role] = type;
            }
        }
    }

    return result;
}
