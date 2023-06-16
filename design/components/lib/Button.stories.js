import Button from "./Button.svelte";

export default {
    title: "Components/Button",
    component: Button,
};

export const Primary = {
    render: () => ({
        Component: Button,
        props: {
            theme: "light",
        },
    }),
};
