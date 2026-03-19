import { defineConfig } from "vite";

export default defineConfig({
  define: {
    B2C_AUTHORITY: JSON.stringify(process.env.B2C_AUTHORITY),
    B2C_CLIENT_ID: JSON.stringify(process.env.B2C_CLIENT_ID),
  },
  server: {
    port: 8080,
  },
});
