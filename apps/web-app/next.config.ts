import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@school/types", "@school/utils", "@school/validations"],
};

export default nextConfig;
