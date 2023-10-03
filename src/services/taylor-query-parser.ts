/**Parse http query to mongodb query */
export default function parseQuery(
  query: Record<string, string | string[]>,
  dataType?: Record<string, string>,
): TaylorQuery {
  const result: TaylorQuery = {
    limit: getLimit(query),
    skip: getSkip(query),
    sort: getSort(query),
    filter: getFilter(query, dataType),
    question: getQuestion(query),
  };

  return result;
}

export interface StringQuery extends Record<string, string | string[]> {}

interface KeyValuePair extends Record<string, unknown> {}

export interface MongoQuery {
  skip?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  filter?: Record<string, unknown>;
  aggregate?: KeyValuePair[];
}
export interface TaylorQuery extends MongoQuery {
  question?: MongoQuestion;
}

export interface MongoQuestion {
  value: string;
  param?: string;
}

const filterRegex = /([^><!=]+)([><]=?|!?=|)(.*)/;
const questionRegex = /^([^(]+)(\([^)]+\))?$/;

const operatorsKeyword = {
  sort: "sort",
  limit: "limit",
  skip: "skip",
  question: "question",
  filter: "",
};

//Sort param can contain an array of string, each string can contain many values (separated by comma)
// eg ["field_a, -field_b", "field_c"]
//This functions use map/reduce to convert it to {field_a: 1, field_b: -1, field_c: 1}
function getSort(query: StringQuery): Record<string, 1 | -1> | undefined {
  const sortValue = query[operatorsKeyword.sort];

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

function getFilter(
  query: StringQuery,
  dataType?: Record<string, string>,
): Record<string, unknown> | undefined {
  const keywordsToExclude = Object.values(operatorsKeyword);

  const filterValues = Object.keys(query).filter(
    (key) => !keywordsToExclude.includes(key),
  );
  if (filterValues.length == 0) {
    return undefined;
  }

  const result = filterValues.reduce(
    (result, key) => {
      const queryVal = query[key];
      if (Array.isArray(queryVal)) {
        throw new Error(
          `${key} cannot have multiple value, please check your query`,
        );
      }
      const fullQueryString = `${key}${queryVal ? "=" : ""}${queryVal}`;
      const valArrays = fullQueryString.match(filterRegex);

      if (!valArrays) {
        return result;
      }

      const filterKey = valArrays[1];
      const filterOp = parseOperator(valArrays[2]);

      const filterVal: string | string[] = valArrays[3];
      const filterValArray = filterVal.split(",");
      if (result[filterKey]) {
        throw new Error(
          `${filterKey} cannot have multiple value, please check your query`,
        );
      }

      const toType = dataType != null ? dataType[filterKey] : undefined;
      result[filterKey] =
        filterValArray.length > 1
          ? {
              [filterOp == "$eq" ? "$in" : "$nin"]: filterValArray.map((val) =>
                cast(val, toType),
              ),
            }
          : { [filterOp]: cast(filterVal, toType) };

      return result;
    },
    {} as Record<string, unknown>,
  );

  return result;
}

function getQuestion(query: StringQuery): MongoQuestion | undefined {
  const question = query[operatorsKeyword.question];
  if (!question) {
    return undefined;
  }

  if (Array.isArray(question)) {
    throw new Error(
      `Dupplicated value for ${operatorsKeyword.question}, please check your query`,
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

function getSkip(query: StringQuery): number | undefined {
  return getNumberValue(query, operatorsKeyword.skip);
}

function getLimit(query: StringQuery): number | undefined {
  return getNumberValue(query, operatorsKeyword.limit);
}

function getNumberValue(
  query: StringQuery,
  keyword: string,
): number | undefined {
  const queryValue = query[keyword];
  if (Array.isArray(queryValue)) {
    throw new Error(
      `Dupplicated value for ${keyword}, please check your query`,
    );
  }

  const value = Number(queryValue);
  if (!value && queryValue) {
    throw new Error(
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
