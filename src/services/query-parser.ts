export default function parseQuery(
  query: StringQuery,
  dataType?: Record<string, string>,
): TaylorQuery {
  const result: TaylorQuery = {
    limit: getLimit(query),
    skip: getSkip(query),
    sort: getSort(query),
    filter: getFilter(query, dataType),
  };

  return result;
}

export type StringQuery = {
  [key: string]: string | string[];
};

export interface TaylorQuery {
  skip: number;
  limit: number;
  sort: Record<string, 1 | -1>;
  filter: Record<string, any>;
}

const filterRegex = /([^><!=]+)([><]=?|!?=|)(.*)/;

const operatorsKeyword = {
  sort: "sort",
  limit: "limit",
  skip: "skip",
  filter: "",
};

//Sort param can contain an array of string, each string can contain many values (separated by comma)
// eg ["field_a, -field_b", "field_c"]
//This functions use map/reduce to convert it to {field_a: 1, field_b: -1, field_c: 1}
function getSort(query: StringQuery): Record<string, 1 | -1> {
  const sortValue = query[operatorsKeyword.sort];

  if (!sortValue) {
    return {};
  }
  //Flatten to an array of sort values
  const values: string[] = (Array.isArray(sortValue) ? sortValue : [sortValue])
    .map((val) => val.trim())
    .flatMap((val) => val.split(","));

  //Reduce to final sort object, eg: {field_a: 1, field_b: -1}
  const sortObject: Record<string, 1 | -1> = values.reduce<
    Record<string, 1 | -1>
  >((result, currentVal) => {
    const sortValue = currentVal.trim();
    if (sortValue.startsWith("-")) {
      result[sortValue.substring(1)] = -1;
    } else {
      result[sortValue] = 1;
    }
    return result;
  }, {});

  return sortObject;
}

function getFilter(
  query: StringQuery,
  dataType?: Record<string, string>,
): Record<string, any> {
  const keywordsToExclude = Object.values(operatorsKeyword);

  const result = Object.keys(query)
    .filter((key) => !keywordsToExclude.includes(key))
    .reduce<Record<string, any>>((result, key) => {
      const queryVals = query[key];
      //TODO: handle array with diff key, eg: Author=a,Author!=b --> still a valid query ?
      const singleQueryVal = Array.isArray(queryVals)
        ? queryVals[0]
        : queryVals;
      const fullVal = `${key}${singleQueryVal ? "=" : ""}${singleQueryVal}`;
      const valArrays = fullVal.match(filterRegex);

      if (!valArrays) {
        return result;
      }

      const filterKey = valArrays[1];
      const filterOp = parseOperator(valArrays[2]);
      const filterVal: string | string[] = valArrays[3];
      const filterValArray = filterVal.split(",");
      //If it already has the key, return. TODO: prevent this later
      if (result[filterKey]) {
        return result;
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
    }, {});

  return result;
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

function getSkip(query: StringQuery): number {
  return getNumberValue(query, operatorsKeyword.skip);
}

function getLimit(query: StringQuery): number {
  return getNumberValue(query, operatorsKeyword.limit);
}

function getNumberValue(query: StringQuery, keyword: string): number {
  const queryValue = query[keyword];
  if (Array.isArray(queryValue)) {
    throw new Error(
      `Dupplicated value for ${keyword}, please check your query`,
    );
  }

  //Only the last skip value takes effect
  const value = Number(queryValue);
  if (!value && queryValue) {
    throw new Error(
      `${keyword} value is not a number, please check your query`,
    );
  }
  return value;
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
