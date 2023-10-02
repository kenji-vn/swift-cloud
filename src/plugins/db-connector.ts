import fp from "fastify-plugin";
import fastifyMongo from "@fastify/mongodb";
import { FastifyInstance } from "fastify";

async function dbConnector(fastify: FastifyInstance) {
  fastify.register(fastifyMongo, {
    url: "mongodb+srv://swiftapi:w4vmnwVxRwTkJEaC@swiftdb.wmhjazu.mongodb.net/SwiftDb?retryWrites=true&w=majority",
    forceClose: true,
  });

  fastify.log.info("Connected to database");
}

export default fp(dbConnector);
