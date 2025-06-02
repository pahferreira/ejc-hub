import fastify from "fastify";
import { env } from "./config/env.js"; // Assuming you have an env.js file for configuration

const server = fastify({
  logger: true,
});

server.get("/ping", async (request, reply) => {
  return { message: "pong" };
});

async function startServer() {
  try {
    await server.listen({ port: env.PORT });
    server.log.info(`Server is running on http://localhost:${env.PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

startServer();
