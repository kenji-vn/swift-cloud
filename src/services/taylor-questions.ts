import { MongoQuery } from "./taylor-query-parser";

export default class TaylorQuestions {
  public static getBySong(param?: string): MongoQuery {
    return {
      filter: {
        song: {
          $regex: param ? `^${param}` : "",
          $options: "i",
        },
      },
      sort: {},
    };
  }

  public static getTrending(): MongoQuery {
    return {
      aggregate: [
        {
          $addFields: {
            trend: { $subtract: ["$plays-august", "$plays-june"] },
          },
        },
        { $sort: { trend: -1 } },
      ],
      filter: {},
      sort: {},
    };
  }
}

export const QuestionStore: Record<string, (param?: string) => MongoQuery> = {
  title: TaylorQuestions.getBySong,
  trending: TaylorQuestions.getTrending,
};
