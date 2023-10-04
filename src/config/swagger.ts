export const swaggerOptions = {
  swagger: {
    info: {
      title: "Fastify API",
      description:
        "Building a blazing fast REST API with Node.js, MongoDB, Fastify and Swagger",
      version: "1.0.0",
    },
    externalDocs: {
      url: "https://swagger.io",
      description: "Find more info here",
    },
    host: "swiftcloud.fly.dev",
    schemes: ["http"],
    consumes: ["application/json"],
    produces: ["application/json"],
  },
};

export const swaggerUiOptions = {
  routePrefix: "/docs",
  exposeRoute: true,
};
