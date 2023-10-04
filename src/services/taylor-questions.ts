import { MongoQuery } from "./taylor-query-parser";

/**
 * We support complex queries with regex and custom logic here.
 */
export default class TaylorQuestions {
  /**
   * Queries for the song that their names start with the provided param
   * @param param song must start with this
   * @returns MongoQuery object
   */
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

  /**
   * Get songs by trending last month.
   * Trending means having high difference between plays last month and plays the month before.
   * @returns MongoQuery object
   */
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
