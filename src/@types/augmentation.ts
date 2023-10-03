// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FastifyInstance } from "fastify";
import TaylorQueryService from "../services/taylor-query-service.js";

declare module "fastify" {
  export interface FastifyInstance {
    taylorBot: TaylorQueryService;
  }
}
