// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   async headers() {
//     return []; // Remove the CORS headers
//   },
// };

// export default nextConfig;
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      // {
      //   source: "/:path*",
      //   headers: [
      //     {
      //       key: "Cross-Origin-Opener-Policy",
      //       value: "same-origin",
      //     },
      //     {
      //       key: "Cross-Origin-Embedder-Policy",
      //       value: "require-corp",
      //     },
      //   ],
      // },
    ];
  },
};

export default nextConfig;
