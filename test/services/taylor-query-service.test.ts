import t from "tap";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Db, MongoClient } from "mongodb";
import TaylorQueryService from "../../src/services/taylor-query-service.js";

let mongoDb: Db | undefined = undefined;
let mongoClient: MongoClient | undefined = undefined;
let mongoServer: MongoMemoryServer | undefined;

t.before(async () => {
  mongoServer = await MongoMemoryServer.create();

  const mongoUri = mongoServer.getUri();
  mongoClient = new MongoClient(mongoUri);

  mongoDb = mongoClient.db();

  const collection = mongoDb.collection("taylorsongs");
  await collection.insertMany(testData);
});

t.teardown(async () => {
  await mongoClient?.close();
  await mongoServer?.stop();
});

//#region testing query songs with filter, sort, limit and skip
t.test(
  "querySong with no filter for all songs, should return correct result",
  async (t) => {
    const queryService = new TaylorQueryService(mongoDb!);
    const query = {};
    const result = await queryService.querySong(query);
    const songsInResult = result?.map((r) => r["song"] as string);
    t.strictSame(songsInResult, [
      "song 1",
      "song 2",
      "song 3",
      "song 4",
      "song 5",
      "song 6",
      "song 7",
      "songsong 8",
      "song 9",
    ]);
  },
);

t.test(
  "querySong with no filter, with skip and no limit, should return correct result",
  async (t) => {
    const queryService = new TaylorQueryService(mongoDb!);
    const query = { skip: "2" };
    const result = await queryService.querySong(query);
    const songsInResult = result?.map((r) => r["song"] as string);
    t.strictSame(songsInResult, [
      "song 3",
      "song 4",
      "song 5",
      "song 6",
      "song 7",
      "songsong 8",
      "song 9",
    ]);
  },
);

t.test(
  "querySong with no filter, with limit and no skip, should return correct result",
  async (t) => {
    const queryService = new TaylorQueryService(mongoDb!);
    const query = { limit: "3" };
    const result = await queryService.querySong(query);
    const songsInResult = result?.map((r) => r["song"] as string);
    t.strictSame(songsInResult, ["song 1", "song 2", "song 3"]);
  },
);

t.test(
  "querySong with filter, filter with 1 field [=], should return correct result",
  async (t) => {
    const queryService = new TaylorQueryService(mongoDb!);
    const query = { year: "2000" };
    const result = await queryService.querySong(query);
    const songsInResult = result?.map((r) => r["song"] as string);
    t.strictSame(songsInResult, ["song 1", "song 2", "song 3"]);
  },
);

t.test(
  "querySong with filter, filter with multi fields [<=, !=, >], and sort should return correct result",
  async (t) => {
    const queryService = new TaylorQueryService(mongoDb!);
    const query = {
      "year<": "2003",
      "song!": "song 1",
      "plays>46": "",
      sort: "-plays,-song",
    };
    const result = await queryService.querySong(query);
    const songsInResult = result?.map((r) => r["song"] as string);
    t.strictSame(songsInResult, ["song 5", "song 4", "song 7", "song 6"]);
  },
);

t.test(
  "querySong with filter, filter with multi fields [>=, <, $nin], limit, should return correct result",
  async (t) => {
    const queryService = new TaylorQueryService(mongoDb!);
    const query = {
      "year>": "2001",
      "song!": "song 4,song5",
      "plays<90": "",
      "artist!": "artist3,artist4",
      limit: "3",
    };
    const result = await queryService.querySong(query);
    const songsInResult = result?.map((r) => r["song"] as string);
    t.strictSame(songsInResult, ["songsong 8", "song 9"]);
  },
);

t.test(
  "querySong with filter, filter with $in, limit and skip, should return correct result",
  async (t) => {
    const queryService = new TaylorQueryService(mongoDb!);
    const query = {
      year: "2000,2001",
      skip: "2",
      limit: "3",
      sort: "song",
    };
    const result = await queryService.querySong(query);
    const songsInResult = result?.map((r) => r["song"] as string);
    t.strictSame(songsInResult, ["song 3", "song 4", "song 5"]);
  },
);
//#endregion

//#region testing query song with question feature
t.test(
  "query Song with question, title, should return correct result",
  async (t) => {
    const queryService = new TaylorQueryService(mongoDb!);
    const query = {
      question: "title(songsong)",
    };
    const result = await queryService.querySong(query);
    const songsInResult = result?.map((r) => r["song"] as string);
    t.strictSame(songsInResult, ["songsong 8"]);
  },
);
//#endregion

//#region testing query album with sortby
t.test(
  "query album with sort by, should return correct list of albums with correct sum",
  async (t) => {
    const queryService = new TaylorQueryService(mongoDb!);
    const query = {
      "year>2002": "",
      sort: "-plays",
    };
    const result = await queryService.queryAlbum(query);
    t.strictSame(result, [
      {
        album: "album 4",
        plays: 85,
      },
      {
        album: "album 5",
        plays: 69,
      },
    ]);
  },
);
//#endregion

const testData = [
  {
    song: "song 1",
    artist: "artist1",
    writer: "writer1",
    album: "album 1",
    year: 2000,
    "plays-june": 19,
    "plays-july": 38,
    "plays-august": 55,
    plays: 112,
  },
  {
    song: "song 2",
    artist: "artist1",
    writer: "writer1",
    album: "album 1",
    year: 2000,
    "plays-june": 10,
    "plays-july": 15,
    "plays-august": 21,
    plays: 46,
  },
  {
    song: "song 3",
    artist: "artist1",
    writer: "writer1",
    album: "album 1",
    year: 2000,
    "plays-june": 10,
    "plays-july": 15,
    "plays-august": 21,
    plays: 46,
  },
  {
    song: "song 4",
    artist: "artist2",
    writer: "writer1, writer2",
    album: "album 2",
    year: 2001,
    "plays-june": 28,
    "plays-july": 138,
    "plays-august": 19,
    plays: 185,
  },
  {
    song: "song 5",
    artist: "artist3",
    writer: "writer1, writer3",
    album: "album 2",
    year: 2001,
    "plays-june": 100,
    "plays-july": 100,
    "plays-august": 105,
    plays: 305,
  },
  {
    song: "song 6",
    artist: "artist3",
    writer: "writer1",
    album: "album 3",
    year: 2002,
    "plays-june": 30,
    "plays-july": 35,
    "plays-august": 20,
    plays: 85,
  },
  {
    song: "song 7",
    artist: "artist4",
    writer: "writer1, writer4",
    album: "album 4",
    year: 2003,
    "plays-june": 20,
    "plays-july": 25,
    "plays-august": 40,
    plays: 85,
  },
  {
    song: "songsong 8",
    artist: "artist5",
    writer: "writer1, writer5",
    album: "album 5",
    year: 2005,
    "plays-june": 11,
    "plays-july": 13,
    "plays-august": 15,
    plays: 39,
  },
  {
    song: "song 9",
    artist: "artist5",
    writer: "writer1, writer6",
    album: "album 5",
    year: 2005,
    "plays-june": 9,
    "plays-july": 10,
    "plays-august": 11,
    plays: 30,
  },
];
