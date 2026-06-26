import { Server } from "http";
import app from "./app";
import config from "./config";
import seedSuperAdmin from "./app/seedSuperAdmin";

const port = config.port || 5007;

const { createRedisClient } = require("./config/redis");

// Global Redis client
let redisClient;

async function main() {
  redisClient = await createRedisClient();

  const server: Server = app.listen(port, () => {
    console.log("Server is running on port ", port);
  });
  seedSuperAdmin();
}

main();
