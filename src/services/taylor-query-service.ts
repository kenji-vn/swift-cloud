import { Db } from "mongodb";
import parseQuery, {
  MongoQuery,
  MongoQuestion,
} from "./taylor-query-parser.js";
import { QuestionStore } from "./taylor-questions.js";

class TaylorQueryService {
  private db: Db;
  constructor(db: Db) {
    this.db = db;
  }

  async querySong(queryString: Record<string, string>) {
    const dbQuery = parseQuery(queryString, queryDataTypes);

    if (!dbQuery.question) {
      const data = await this.buildQuery(
        this.db,
        dbQuery as MongoQuery,
      ).toArray();
      return data;
    } else {
      const data = await this.getQueryFromQuestionStore(
        dbQuery.question,
      )?.toArray();
      return data;
    }
  }

  async queryAlbum(queryString: Record<string, string>) {
    const dbQuery = parseQuery(queryString, queryDataTypes);

    const query = dbQuery.sort
      ? this.getAlbumGroupByQuery(dbQuery)
      : this.buildQuery(this.db, dbQuery).project({
          _id: 0,
          album: "$album",
        });
    return await query.toArray();
  }

  private buildQuery(db: Db, dbQuery: MongoQuery) {
    const query = db
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

  private getQueryFromQuestionStore(question: MongoQuestion) {
    const selectedQuestion = QuestionStore[question.value]();

    if (selectedQuestion.aggregate) {
      return this.db
        .collection(mongoCollection)
        .aggregate(selectedQuestion.aggregate);
    } else if (selectedQuestion.filter) {
      return this.buildQuery(this.db, selectedQuestion);
    }
  }

  private getAlbumGroupByQuery(dbQuery: MongoQuery) {
    const { filter, sort, skip, limit } = dbQuery;

    const albumSortValue = Object.keys(sort!)[0];

    const query = this.db.collection(mongoCollection).aggregate(
      [
        {
          $match: filter,
        },
        {
          $group: {
            _id: "$album",
            [albumSortValue]: {
              $sum: `$${albumSortValue}`,
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
            [albumSortValue]: 1,
          },
        },
      ],
      {
        collation: queryCollation,
      },
    );

    if (skip) {
      query.skip(skip);
    }
    if (limit) {
      query.limit(limit);
    }

    return query;
  }
}

const mongoCollection = "taylorsongs";
const queryCollation = { locale: "en", strength: 2 }; //case insensitive
const queryDataTypes = {
  year: "number",
};

export default TaylorQueryService;
