import { Db } from "mongodb";
import parseQuery from "./query-parser.js";

const mongoCollection = "taylorsongs";
const dbDataTypes = {
  year: "number",
  "plays-june": "number",
  "plays-july": "number",
  "plays-august": "number",
  plays: "number",
};

class TaylorQueryService {
  private mongoDb: Db;
  constructor(db: Db) {
    this.mongoDb = db;
  }

  async querySong(queryString: Record<string, string>) {
    const query = this.buildQuery(queryString);
    return await query.toArray();
  }

  async queryAlbum(queryString: Record<string, string>) {
    const query = this.buildAlbumQuery(queryString);
    const albums = await query.toArray();
    return albums;
  }

  private buildQuery(queryString: Record<string, string>) {
    const { filter, sort, skip, limit } = parseQuery(queryString, dbDataTypes);

    const filterWithRegex = this.getSupportedRegex(filter);
    let query = this.mongoDb
      .collection(mongoCollection)
      .find(filterWithRegex)
      .collation({ locale: "en", strength: 2 }) //case insensitive
      .sort(sort);

    if (skip) {
      query = query.skip(skip);
    }
    if (limit) {
      query = query.limit(limit);
    }
    return query;
  }

  private buildAlbumQuery(queryString: Record<string, string>) {
    const { sort } = parseQuery(queryString, dbDataTypes);
    const albumSumValue = Object.keys(sort)[0];

    let query = this.mongoDb
      .collection(mongoCollection)
      .aggregate([
        {
          $group: {
            _id: "$album",
            plays: {
              $sum: `$${albumSumValue}`,
            },
          },
        },
      ])
      .sort(sort);

    return query;
  }

  /**Regex is disabled for all filters, except for searching by song name.
   * Only /^song/ is supported for now, because it is fast and helful for this simple project
   */
  private getSupportedRegex(
    filter: Record<string, unknown>,
  ): Record<string, unknown> {
    const songFilter = filter["song"] as Record<string, unknown>;
    const eqValue = songFilter ? (songFilter["$eq"] as string) : undefined;
    if (eqValue && eqValue[eqValue.length - 1] === "%")
      filter["song"] = {
        $regex: `^${eqValue.substring(0, eqValue.length - 1)}`,
        $options: "i",
      };

    return filter;
  }
}

export default TaylorQueryService;
