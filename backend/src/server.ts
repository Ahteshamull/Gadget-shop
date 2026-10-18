import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { app } from "./app.js";
import { seedDefaultAdmin } from "./services/seedAdmin.js";

async function bootstrap(): Promise<void> {
  await connectDatabase();
  if (process.env.AUTO_SEED_DEFAULT_ADMIN === "true") {
    await seedDefaultAdmin();
  }

  const server = app.listen(env.PORT, () => {
    console.log(`API server listening on http://localhost:${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`${signal} received. Closing API server.`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch((error) => {
  console.error("API bootstrap failed", error);
  process.exit(1);
});
