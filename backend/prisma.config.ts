import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
dotenv.config({ path: envFile });

const hasDirectUrl = !!process.env.DIRECT_DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
  datasource: {
    url: env("DATABASE_URL"),
    ...(hasDirectUrl ? { directUrl: env("DIRECT_DATABASE_URL") } : {}),
  },
});
