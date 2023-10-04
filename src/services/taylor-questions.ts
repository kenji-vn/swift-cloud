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
    };
  }

  public static getTrending(): MongoQuery {
    return {
      aggregate: [
        {
          $addFields: {
            trend: { $subtract: ["$plays-august", "$plays-july"] },
          },
        },
        { $sort: { trend: -1 } },
      ],
    };
  }
}

export const QuestionStore: Record<string, (param?: string) => MongoQuery> = {
  title: TaylorQuestions.getBySong,
  trending: TaylorQuestions.getTrending,
};
