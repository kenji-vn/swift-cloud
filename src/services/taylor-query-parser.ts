/**
 * Convert query parameters from API to a MongoDB query object.
 * Eg: convert artist=value1,year>2000,skip=10,limit=5,sort=-plays-june,song to {filter: { artist: "value1", year: { $gt: 2000 } },skip: 10,limit: 5,sort: {"plays-june": -1,"song" 1}}
 * @param query Full query params from API
 * @param [dataType] Default data type for all fields is string, use this to set data type for any field
 * @returns query MongoDB query object, compatible with Mongo Db driver
 */
// The goal of this function is to support simple database operators, with easy to read param syntax.
// This does not support regex and complex queries directly from the params.
// For any complex query/regex, we can use the "Question" feature
// Question feature is prebuilt queries on server side, with param and logic.
// For more examples, please check the unit tests.
export default function parseQuery(
  query: Record<string, string | string[]>,
  dataType?: Record<string, string>,
): DbQuery {
  const result: DbQuery = {
    limit: getLimit(query),
    skip: getSkip(query),
    sort: getSort(query),
    filter: getFilter(query, dataType),
    question: getQuestion(query),
  };

  return result;
}

export interface StringQuery extends Record<string, string | string[]> {}

export interface MongoQuery {
  skip?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  filter?: Record<string, unknown>;
  aggregate?: KeyValuePair[];
}
export interface DbQuery extends MongoQuery {
  question?: MongoQuestion;
}

/**
 * This is like a function signature, use with Question feature in TaylorQueryService
 */
export interface MongoQuestion {
  /**
   * Question name
   */
  value: string;

  /**
   * Question param
   */
  param?: string;
}

interface KeyValuePair extends Record<string, unknown> {}

/**
 * Match param values, eg: field1>=value1
 * Support =,!=,>,>=,<,<=,
 */
const filterRegex = /([^><!=]+)([><]=?|!?=|)(.*)/;

/**
 * Match question with param in parenthesis
 * Eg: questionA(param)
 */
const questionRegex = /^([^(]+)(\([^)]+\))?$/;

const operatorKeywords = {
  sort: "sort",
  limit: "limit",
  skip: "skip",
  question: "question",
  filter: "",
};

/**
 * Get a sort object that can be used for mongo db. Keyword in query param: sort.
 * Eg: sort=field_a,-field_b,field_c.
 * This function converts it to {field_a: 1, field_b: -1, field_c: 1}.
 * @param query: the full query object that can contain sort param.
 * @returns Sort object, undefined if there is no sort object
 */
function getSort(query: StringQuery): Record<string, 1 | -1> | undefined {
  const sortValue = query[operatorKeywords.sort];

  if (!sortValue) {
    return undefined;
  }
  //Flatten to an array of sort values
  const values: string[] = (Array.isArray(sortValue) ? sortValue : [sortValue])
    .map((val) => val.trim())
    .flatMap((val) => val.split(","));

  //Reduce to final sort object, eg: {field_a: 1, field_b: -1}
  const sortObject: Record<string, 1 | -1> = values.reduce(
    (result, currentVal) => {
      const sortValue = currentVal.trim();
      if (sortValue.startsWith("-")) {
        result[sortValue.substring(1)] = -1;
      } else {
        result[sortValue] = 1;
      }
      return result;
    },
    {} as Record<string, 1 | -1>,
  );

  return sortObject;
}

/**
 * Get a filter object that can be used for mongo db.
 * @param query Full query object.
 * @param dataType Default data type for all fields is string, use this to set data type for any field.
 * @returns Filter object. Throw exception if a key appears more than 1 time.
 */
function getFilter(
  query: StringQuery,
  dataType?: Record<string, string>,
): Record<string, unknown> | undefined {
  const keywordsToExclude = Object.values(operatorKeywords);

  const filterValues = Object.keys(query).filter(
    (key) => !keywordsToExclude.includes(key.trim()),
  );
  if (filterValues.length == 0) {
    return undefined;
  }

  //Convert all filter params to final filter object
  const result = filterValues.reduce(
    (result, key) => {
      const queryVal = query[key];
      if (Array.isArray(queryVal)) {
        throw new TaylorParamError(
          `${key} cannot have multiple value, please check your query`,
        );
      }
      //Full query string for 1 param, eg: year<=2015
      const fullQueryString = `${key.trim()}${queryVal ? "=" : ""}${queryVal}`;
      const valArrays = fullQueryString.match(filterRegex); //eg ["year","<=",2015]

      if (!valArrays) {
        return result;
      }

      const filterKey = valArrays[1].trim();
      const filterOp = parseOperator(valArrays[2]);

      const filterVal: string | string[] = valArrays[3];
      //filterVal can have array data, eg: year=2001,2002 translates into year $in [2001,2002]
      const filterValArray = filterVal.split(",");
      if (result[filterKey]) {
        throw new TaylorParamError(
          `${filterKey} cannot have multiple value, please check your query`,
        );
      }

      const toType = dataType != null ? dataType[filterKey] : undefined;
      result[filterKey] =
        filterValArray.length > 1
          ? {
              [filterOp == "$eq" ? "$in" : "$nin"]: filterValArray.map((val) =>
                cast(val.trim(), toType),
              ),
            }
          : { [filterOp]: cast(filterVal.trim(), toType) };

      return result;
    },
    {} as Record<string, unknown>,
  );

  return result;
}

/**
 * Get a question object that can be used for question feature in TaylorQueryService.
 * @param query Full query object.
 * @returns Question object. Throw exception if a key appears more than 1 time.
 */
function getQuestion(query: StringQuery): MongoQuestion | undefined {
  const question = query[operatorKeywords.question];
  if (!question) {
    return undefined;
  }

  if (Array.isArray(question)) {
    throw new TaylorParamError(
      `Dupplicated value for ${operatorKeywords.question}, please check your query`,
    );
  }

  const params = question.match(questionRegex);
  if (!params) {
    return undefined;
  }

  return {
    value: params[1],
    param: params[2] ? params[2].substring(1, params[2].length - 1) : undefined,
  };
}

const parseOperator = (operator: string) => {
  switch (operator) {
    case "=":
      return "$eq";
    case "!=":
      return "$ne";
    case ">":
      return "$gt";
    case ">=":
      return "$gte";
    case "<":
      return "$lt";
    case "<=":
      return "$lte";
    default:
      return operator;
  }
};

/**
 * Get skip value from a query object, keyword in param: "skip"
 * @param query Full query object
 * @returns skip value as a number, undefined if there is not skip value.
 * Throw exception if query has 2 skip values, or value is not a number.
 */
function getSkip(query: StringQuery): number | undefined {
  return getNumberValue(query, operatorKeywords.skip);
}

/**
 * Get limit value from a query object, keyword in param: "limit"
 * @param query Full query object
 * @returns limit value as a number, undefined if there is not limit value
 * Throw exception if query has 2 limit values, or value is not a number.
 */
function getLimit(query: StringQuery): number | undefined {
  return getNumberValue(query, operatorKeywords.limit);
}

function getNumberValue(
  query: StringQuery,
  keyword: string,
): number | undefined {
  const queryValue = query[keyword];
  if (Array.isArray(queryValue)) {
    throw new TaylorParamError(
      `Dupplicated value for ${keyword}, please check your query`,
    );
  }

  const value = Number(queryValue);
  if (!value && queryValue) {
    throw new TaylorParamError(
      `${keyword} value is not a number, please check your query`,
    );
  }
  return !value ? undefined : value;
}

function cast(filterVal: string, type?: string) {
  switch (type) {
    case "number":
      return Number(filterVal);

    case "date":
      return new Date(filterVal);

    case "boolean":
      return filterVal === "true";

    default:
      return filterVal;
  }
}

class TaylorParamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TaylorParamError";
  }
}
