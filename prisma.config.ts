import "dotenv/config";
import { defineConfig } from "prisma/config";
import path from "path";
import fs from "fs";

// Load .env.local if it exists (takes precedence for local development)
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  require("dotenv").config({ path: envLocalPath, override: true });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // DIRECT_URL se usa automáticamente para migraciones si está definida en el entorno.
    // No se debe poner "url" aquí (causa error de tipos en Prisma actual).
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
