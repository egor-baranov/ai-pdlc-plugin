import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Export as a fully static site into /web/out
    output: "export",
    // (Optional) If you wanted to emit to a custom folder, e.g. "../extension/media/web-out":
    // distDir: "../extension/media/web-out",
};

export default nextConfig;
