import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import lightningcss from "vite-plugin-lightningcss";
import Mkcert from "vite-plugin-mkcert";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    plugins: [
        tsconfigPaths(),
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
