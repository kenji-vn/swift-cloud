import { test } from "tap";
import querystring from "node:querystring";

import parseQuery, { StringQuery } from "../../src/services/query-parser.js";

test("Query with dupplicate param, throw exception", async (t) => {
  const query = createQuery(
    "Album=album1,album2&sort=plays-june,song&limit=20&Year>2015&skip=10&play-june<100&album=somemorevalue",
  );

  const taylorQuery = parseQuery(query as StringQuery);
  console.log(taylorQuery);

  t.equal(1, 1);
});

//node:querystring is what Fastify uses to parse query string
function createQuery(queryString: string) {
  const query = querystring.decode(queryString.toLowerCase());
  return query;
}
