const { createApp } = require("./app");
const { connectDatabase, disconnectDatabase } = require("./config/database");
const { getEnv } = require("./config/env");

async function startServer() {
  const env = getEnv();
  await connectDatabase(env.MONGODB_URI);

  const app = createApp({ env });
  const server = app.listen(env.PORT, () => {
    if (env.NODE_ENV !== "test") {
      console.log(`API disponível na porta ${env.PORT}.`);
    }
  });

  let stopping = false;
  const shutdown = async (signal) => {
    if (stopping) return;
    stopping = true;

    if (env.NODE_ENV !== "test") {
      console.log(`Encerrando servidor após ${signal}.`);
    }

    server.close(async () => {
      await disconnectDatabase().catch(() => {});
      process.exit(0);
    });
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));

  return server;
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = {
  startServer
};
