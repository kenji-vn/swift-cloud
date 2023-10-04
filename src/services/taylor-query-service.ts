import { Db } from "mongodb";
import parseQuery, { MongoQuery, DbQuery } from "./taylor-query-parser.js";
import { QuestionStore } from "./taylor-questions.js";

class TaylorQueryService {
  private db: Db;
  constructor(db: Db) {
    this.db = db;
  }

  async querySong(query: Record<string, string>) {
    //Convert query params to mongo db query object
    const dbQuery = parseQuery(query, queryDataTypes);

    if (dbQuery.question) {
      //If it uses question feature, load data from prebuilt queries in taylor-questions.ts
      const data = await this.buildQueryFromQuestionStore(dbQuery)?.toArray();
      return data;
    } else {
      //Load data from mongo db with the provided query
      const data = await this.buildQuery(dbQuery).toArray();
      return data;
    }
  }

  async queryAlbum(queryString: Record<string, string>) {
    const dbQuery = parseQuery(queryString, queryDataTypes);

    const query = this.buildAlbumGroupByQuery(dbQuery);
    return await query.toArray();
  }

  private buildQuery(dbQuery: DbQuery) {
    const query = this.db
      .collection(mongoCollection)
      .find(dbQuery.filter ?? {})
      .collation(queryCollation)
      .sort(dbQuery.sort ?? {});

    if (dbQuery.skip) {
      query.skip(dbQuery.skip);
    }
    if (dbQuery.limit) {
      query.limit(dbQuery.limit);
    }
    return query;
  }

  /**
   * Get prebuilt queries in QuestionStore.
   * For complex queries and queries with regex, we want to stored them in server.
   * Api consumers just need to call the question, no need to provide complex and maybe bad performance params.
   */
  private buildQueryFromQuestionStore(dbQuery: DbQuery) {
    const question = dbQuery.question;
    if (!question) {
      return undefined;
    }

    const selectedQuestion = question.param
      ? QuestionStore[question.value](question.param)
      : QuestionStore[question.value]();

    if (selectedQuestion.aggregate) {
      const query = this.db
        .collection(mongoCollection)
        .aggregate(selectedQuestion.aggregate, {
          collation: queryCollation,
        });
      if (dbQuery.skip) {
        query.skip(dbQuery.skip);
      }
      if (dbQuery.limit) {
        query.limit(dbQuery.limit);
      }
      return query;
    } else if (selectedQuestion.filter) {
      return this.buildQuery(selectedQuestion);
    }
  }

  /**
   * Get album data from songs database, by query songs table with group by "album" field
   */
  private buildAlbumGroupByQuery(dbQuery: MongoQuery) {
    const sort = dbQuery.sort ?? { song: 1, _id: 1 };
    const albumSortValue = sort ? Object.keys(sort)[0] : "song";

    const query = this.db.collection(mongoCollection).aggregate(
      [
        {
          $match: dbQuery.filter ?? {},
        },
        {
          $group: {
            _id: "$album",
            [albumSortValue]: {
              $sum: `$${albumSortValue}`,
            },
            song: {
              $count: {},
            },
          },
        },
        {
          $sort: sort,
        },
        {
          $project: {
            _id: 0,
            album: "$_id",
            song: "$song",
            [albumSortValue]: 1,
          },
        },
      ],
      {
        collation: queryCollation,
      },
    );

    if (dbQuery.skip) {
      query.skip(dbQuery.skip);
    }
    if (dbQuery.limit) {
      query.limit(dbQuery.limit);
    }

    return query;
  }
}

const mongoCollection = "taylorsongs";
const queryCollation = { locale: "en", strength: 2 }; //case insensitive
const queryDataTypes = {
  year: "number",
  "plays-june": "number",
  "plays-july": "number",
  "plays-august": "number",
  plays: "number",
};

export default TaylorQueryService;
