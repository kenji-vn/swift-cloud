import { test } from "tap";
import querystring from "node:querystring";

import parseQuery, {
  StringQuery,
} from "../../src/services/taylor-query-parser.js";

/* Testing sort keyword */
test("Query with more than 1 sort param, parse correctly", async (t) => {
  const query = createQuery("sort=plays-june,-song&sort=plays-august&sort=1");

  const result = parseQuery(query as StringQuery);

  t.strictSame(result.sort, {
    "plays-june": 1,
    song: -1,
    "plays-august": 1,
    "1": 1,
  });
});

test("Query with no sort param, parse correctly to undefined", async (t) => {
  const query = createQuery("album=Test");

  const result = parseQuery(query as StringQuery);

  t.strictSame(result.sort, undefined);
});

test("Query with empty sort param, parse correctly to undefined", async (t) => {
  const query = createQuery("album=Test&sort");

  const result = parseQuery(query as StringQuery);

  t.strictSame(result.sort, undefined);
});

/* Testing skip keyword */
test("Query with 1 skip value, parse correctly", async (t) => {
  const query = createQuery("skip=15");

  const result = parseQuery(query as StringQuery);

  t.strictSame(result.skip, 15);
});

test("Query with skip param not a number, throw exception", async (t) => {
  const query = createQuery("skip=test");

  t.throws(
    function () {
      parseQuery(query as StringQuery);
    },
    new Error("skip value is not a number, please check your query"),
    "should throw error for skip value is not a number",
  );
});

test("Query with dupplicate skip param, throw exception", async (t) => {
  const query = createQuery("skip=15&skip=20");

  t.throws(
    function () {
      parseQuery(query as StringQuery);
    },
    new Error("Dupplicated value for skip, please check your query"),
    "should throw error for dupplicated skip value",
  );
});

test("Query with no skip value, parse correctly", async (t) => {
  const query = createQuery("sort=somefield");

  const result = parseQuery(query as StringQuery);

  t.strictSame(result.skip, undefined);
});

/* Testing limit keyword */
test("Query with 1 limit value, parse correctly", async (t) => {
  const query = createQuery("limit=15");

  const result = parseQuery(query as StringQuery);

  t.strictSame(result.limit, 15);
});

test("Query with limit param not a number, throw exception", async (t) => {
  const query = createQuery("limit=test");

  t.throws(
    function () {
      parseQuery(query as StringQuery);
    },
    new Error("limit value is not a number, please check your query"),
    "should throw error for limit value is not a number",
  );
});

test("Query with dupplicate limit param, throw exception", async (t) => {
  const query = createQuery("limit=15&limit=20");

  t.throws(
    function () {
      parseQuery(query as StringQuery);
    },
    new Error("Dupplicated value for limit, please check your query"),
    "should throw error for dupplicated limit value",
  );
});

test("Query with no limit value, parse corectly", async (t) => {
  const query = createQuery("sort=somefield");

  const result = parseQuery(query as StringQuery);

  t.strictSame(result.limit, undefined);
});

/* Testing filter keyword */
test("Query with filter using all operators with different cases, parse correctly", async (t) => {
  const query = createQuery(
    "Field1=value1&Field2!=Value1&Field3>100&field4>=200&field5<300&field6<=400&field7=VAL1,val2&field8!=val1,val2",
  );

  const result = parseQuery(query as StringQuery);

  t.strictSame(result.filter, {
    field1: {
      $eq: "value1",
    },
    field2: {
      $ne: "value1",
    },
    field3: {
      $gt: "100",
    },
    field4: {
      $gte: "200",
    },
    field5: {
      $lt: "300",
    },
    field6: {
      $lte: "400",
    },
    field7: {
      $in: ["val1", "val2"],
    },
    field8: {
      $nin: ["val1", "val2"],
    },
  });
});

test("Query with filter with same key params, parse correctly", async (t) => {
  const query = createQuery("Field1=value1&Field1=value3");

  t.throws(
    function () {
      parseQuery(query as StringQuery);
    },
    new Error("field1 cannot have multiple value, please check your query"),
    "should throw error for dupplicated filter value",
  );
});

test("Query with filter with same key params scenario2, parse correctly", async (t) => {
  const query = createQuery("Field1=value1&field1>=100&Field1<10");

  t.throws(
    function () {
      parseQuery(query as StringQuery);
    },
    new Error("field1 cannot have multiple value, please check your query"),
    "should throw error for dupplicated filter value",
  );
});

/**Testing full query */
/* Testing data casting */

/* helper functions */
//node:querystring is what Fastify uses to parse query string
function createQuery(queryString: string) {
  const query = querystring.decode(queryString.toLowerCase());
  return query;
}
