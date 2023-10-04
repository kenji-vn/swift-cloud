import dotenv from "dotenv";
import querystring from "node:querystring";
import Fastify, { FastifyInstance } from "fastify";
import closeWithGrace from "close-with-grace";
import appService from "./app.js";

// Read the .env file.
dotenv.config();

// Instantiate main Fastify app
const app: FastifyInstance = Fastify({
  logger: true,
  querystringParser: (str) => querystring.parse(str.toLowerCase()), // case insensitive for params
});

// Register the app
app.register(appService);

//Exit server, gracefully (if possible)
app.addHook("onClose", (instance, done) => {
  closeListeners.uninstall();
  done();
});

app.setErrorHandler((error, request, reply) => {
  // Throw TaylorParamError as bad request
  if (error.name === "TaylorParamError") {
    reply.code(400);
    reply.send({ message: error.message });
  } else {
    // Use the default error handler for other errors
    reply.send(error);
  }
});

//Listen to PORT or default to 3000
app.listen(
  { port: Number(process.env.PORT) || 3000, host: "0.0.0.0" },
  (err) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
  },
);

const closeListeners = closeWithGrace(
  { delay: Number(process.env.FASTIFY_CLOSE_GRACE_DELAY) || 500 },
  async function ({ err }) {
    if (err) {
      app.log.error(err);
    }
    await app.close();
  },
);
