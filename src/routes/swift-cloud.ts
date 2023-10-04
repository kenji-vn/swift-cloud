import { FastifyPluginAsync, FastifyRequest } from "fastify";

const taylorRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", async function () {
    return { message: "Welcome to SwiftCloud" };
  });

  fastify.get(
    "/song",
    { schema: songSchema },
    async function (request: FastifyRequest) {
      const result = await fastify.taylorBot.querySong(
        request.query as Record<string, string>,
      );
      return result;
    },
  );

  fastify.get(
    "/album",
    { schema: albumSchema },
    async function (request: FastifyRequest) {
      const result = await fastify.taylorBot.queryAlbum(
        request.query as Record<string, string>,
      );
      return result;
    },
  );
};

const songSchema = {
  // The querystring schema
  querystring: {
    type: "object",
    properties: {
      song: { type: "string" },
      artist: { type: "string" },
      writer: { type: "string" },
      album: { type: "string" },
      year: { type: "number" },
      "plays-june": { type: "number" },
      "plays-july": { type: "number" },
      "plays-august": { type: "number" },
      plays: { type: "number" },
      sort: { type: "string" },
      limit: { type: "number" },
      skip: { type: "number" },
      question: { type: "string" },
    },
  },
  // The response schema
  response: {
    200: {
      type: "array",
      items: {
        _id: { type: "string" },
        song: { type: "string" },
        artist: { type: "string" },
        writer: { type: "string" },
        album: { type: "string" },
        year: { type: "number" },
        "plays-june": { type: "number" },
        "plays-july": { type: "number" },
        "plays-august": { type: "number" },
        plays: { type: "number" },
        trend: { type: "number" },
      },
    },
  },
};

const albumSchema = {
  // The querystring schema
  querystring: {
    type: "object",
    properties: {
      song: { type: "string" },
      artist: { type: "string" },
      writer: { type: "string" },
      album: { type: "string" },
      year: { type: "number" },
      "plays-june": { type: "number" },
      "plays-july": { type: "number" },
      "plays-august": { type: "number" },
      plays: { type: "number" },
      sort: { type: "string" },
      limit: { type: "number" },
      skip: { type: "number" },
    },
  },
  // The response schema
  response: {
    200: {
      type: "array",
      items: {
        album: { type: "string" },
        song: { type: "number" },
        plays: { type: "number" },
      },
    },
  },
};

export default taylorRoutes;
