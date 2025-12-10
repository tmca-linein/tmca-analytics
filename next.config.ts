import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
};
export const config = { runtime: 'nodejs', }



export default nextConfig;
