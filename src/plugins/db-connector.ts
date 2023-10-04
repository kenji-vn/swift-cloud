import fp from "fastify-plugin";
import fastifyMongo from "@fastify/mongodb";
import { FastifyInstance } from "fastify";

/**
 * Register mongo db to the Fastify instance
 * After registered, you can use fastify.mongo.db
 */
async function dbConnector(fastify: FastifyInstance) {
  //* For demo purpose, connection string and password are hardcoded here, the user has read-only permission.
  fastify.register(fastifyMongo, {
    url: "mongodb+srv://swiftapi:w4vmnwVxRwTkJEaC@swiftdb.wmhjazu.mongodb.net/SwiftDb?retryWrites=true&w=majority",
    forceClose: true,
  });

  fastify.log.info("Connected to database");
}

export default fp(dbConnector);
