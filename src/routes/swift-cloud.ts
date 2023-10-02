import { FastifyPluginAsync } from "fastify";

const root: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", async function (request) {
    return { message: "Hello world from SwiftCloud" };
  });
};

export default root;
