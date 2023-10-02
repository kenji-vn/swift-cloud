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

  fastify.get("/album", async function (request: FastifyRequest) {
    const result = await fastify.taylorBot.queryAlbum(
      request.query as Record<string, string>,
    );
    return result;
  });
};

const songQueryStringJsonSchema = {
  type: "object",
  properties: {
    sort: { type: "string" },
    limit: { type: "number" },
    skip: { type: "number" },
  },
};

const songSchema = {
  querystring: songQueryStringJsonSchema,
};

export default taylorRoutes;
