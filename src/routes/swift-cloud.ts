import { FastifyPluginAsync } from "fastify";

const root: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", async function () {
    return { message: "Hello world from SwiftCloud" };
  });
};

export default root;
