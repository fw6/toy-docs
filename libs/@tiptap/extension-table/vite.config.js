import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import lightningcss from "vite-plugin-lightningcss";
import Mkcert from "vite-plugin-mkcert";

export default defineConfig({
    plugins: [
        Mkcert({
            source: "coding",
            hosts: ["localhost", "localdevs"],
        }),
        sveltekit(),
        lightningcss({
            browserslist: ">= 0.25%",
        }),
    ],
});
