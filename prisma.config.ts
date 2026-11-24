import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Default keeps `npm install` working before `npm run setup` creates .env
    url: process.env.DATABASE_URL ?? "file:./data/agora.db",
  },
});
