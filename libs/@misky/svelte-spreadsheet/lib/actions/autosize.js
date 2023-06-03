import _autosize from "autosize";

/** @type {import('svelte/action').Action<HTMLTextAreaElement, Partial<import('./autosize').AutosizeParameters>, import('./autosize').AutosizeAttributes>} */
export const autosize = (textarea, { enable, hidden } = { enable: true }) => {
    if (enable) _autosize(textarea);

    if (hidden) textarea.style.display = "none";

    return {
        update({ enable, hidden }) {
            if (!enable) {
                _autosize.destroy(textarea);
                return;
            }
            textarea.style.display = hidden ? "none" : "";

            _autosize(textarea);
            _autosize.update(textarea);
        },
        destroy() {
            _autosize.destroy(textarea);
        },
    };
};
