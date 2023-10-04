import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { swaggerOptions, swaggerUiOptions } from "../config/swagger.js";

async function swaggerSetup(fastify: FastifyInstance) {
  fastify.register(fastifySwagger, swaggerOptions);
  fastify.register(fastifySwaggerUi, swaggerUiOptions);

  fastify.log.info("Registered swagger");
}

export default fp(swaggerSetup);
