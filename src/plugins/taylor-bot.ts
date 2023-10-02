import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import TaylorQueryService from "../services/taylor-query-service.js";

async function taylorBot(fastify: FastifyInstance) {
  const db = fastify.mongo.db!;
  const service = new TaylorQueryService(db);
  fastify.decorate("taylorBot", service);

  fastify.log.info("Registered taylor bot plugin");
}

export default fp(taylorBot);
