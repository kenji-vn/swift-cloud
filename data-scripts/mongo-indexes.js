const collection = db.taylorsongs;
collection.createIndex(
  {
    song: 1,
  },
  {
    unique: true,
    collation: { locale: "en", strength: 2 },
  },
);

collection.createIndex(
  {
    artist: 1,
  },
  {
    collation: { locale: "en", strength: 2 },
  },
);

collection.createIndex(
  {
    writer: 1,
  },
  {
    collation: { locale: "en", strength: 2 },
  },
);

collection.createIndex(
  {
    album: 1,
  },
  {
    collation: { locale: "en", strength: 2 },
  },
);

collection.createIndex({
  year: -1,
});

collection.createIndex({
  "plays-june": -1,
});

collection.createIndex({
  "plays-july": -1,
});

collection.createIndex({
  "plays-august": -1,
});

collection.createIndex({
  plays: -1,
});
