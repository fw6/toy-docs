/**
 * @type {EasingBezier}
 */
export const EasingBezier = {
    name: "easing/cubic-bezier",
    type: "value",
    matcher: (prop) => prop.attributes.category === "css-easing",
    transformer: (token) => `cubic-bezier(${token.value.join(", ")})`,
};
