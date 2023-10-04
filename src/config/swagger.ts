export const swaggerOptions = {
  swagger: {
    info: {
      title: "SwiftCloud",
      description: "Ask anything about Taylor Swift songs",
      version: "0.1.0",
    },
    externalDocs: {
      url: "https://github.com/kenji-vn/swift-cloud",
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
