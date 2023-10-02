import { Db } from "mongodb";
import parseQuery from "./query-parser.js";

const mongoCollection = "taylorsongs";
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
    const query = this.buildQuery(queryString).project({
      _id: 0,
      album: 1,
    });
    const albums = await query.toArray();
    const allAlbums = albums.map((w) => w["album"]);

    //Distinct the values
    const result = [...new Set(allAlbums)];

    //TODO: support sort operator
    return result;
  }

  private buildQuery(queryString: Record<string, string>) {
    const { filter, sort, skip, limit } = parseQuery(queryString, {
      year: "number",
      "plays-june": "number",
      "plays-july": "number",
      "plays-august": "number",
    });

    let query = this.mongoDb
      .collection(mongoCollection)
      .find(filter)
      .collation({ locale: "en", strength: 2 });
    if (sort) {
      query = query.sort(sort);
    }
    if (skip) {
      query = query.skip(skip);
    }
    if (limit) {
      query = query.limit(limit);
    }
    return query;
  }
}

export default TaylorQueryService;
