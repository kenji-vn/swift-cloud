import { FastifyPluginAsync, FastifyRequest } from "fastify";

const taylorRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", async function () {
    return { message: "Welcome to SwiftCloud" };
  });

  fastify.get("/song", async function (request: FastifyRequest) {
    const result = await fastify.taylorBot.querySong(
      request.query as Record<string, string>,
    );
    return result;
  });

  fastify.get("/album", async function (request: FastifyRequest) {
    const result = await fastify.taylorBot.queryAlbum(
      request.query as Record<string, string>,
    );
    return result;
  });
};

export default taylorRoutes;
