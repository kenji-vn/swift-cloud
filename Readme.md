# Swift Cloud 

Welcome to SwiftCloud.

Let's discover Taylor Swift's songs with the API !

https://swiftcloud.fly.dev

Here are some interesting facts about Taylor Swift songs you can query:

- Most 20 popular songs all time:
    * https://swiftcloud.fly.dev/song?limit=20&sort=-plays,song
- Top 5 most played songs in August:
    * https://swiftcloud.fly.dev/song?limit=5&sort=-plays-august,song
- All songs in the album "Sounds of the season"
    * https://swiftcloud.fly.dev/song?album=sounds%20of%20the%20Season
- All songs in the year 2015,2016,2017 order by total play all time
    * https://swiftcloud.fly.dev/song?year=2015,2016,2017&sort=-plays
- All songs, with song name starts with the word You.
    * https://swiftcloud.fly.dev/song?question=title(You)
- Top 5 trending songs in August
    * https://swiftcloud.fly.dev/song?question=trending&limit=5
- Top 3 album, sort by total plays
    * https://swiftcloud.fly.dev/album?sort=-plays&limit=3


### API usage
Swagger: https://swiftcloud.fly.dev/docs/static/index.html

There are 2 endpoints: 

    /song - query info about songs, return list of songs and info

    /album - query info about albums, return list of albums and info

* There are 9 fields you can built your params with: 

    * song, artist, writer, album, year: data field of the song.
    * plays-june, plays-july , plays-august , plays:  play counts in each month, with "plays" is the total play counts of all time.
    * Example: `/song?album=folklore,artist=Taylor%20Swift`

* Beside "=", you can use !=, >, >=, <, <=
    * Example: `/song?year>=2015&album=folklore,Fearless&plays>=100`
        - This queries all song with year >= 2015, in album Folklore and album Fearless, with total play counts >= 100
* You can also use these keywords: sort, skip, limit
    * Example: `/song?year>=2015&sort=-plays&limit=5`
        - This queries top 5 songs, sort by "plays" descending (- for descending, default is ascending) and year >=2015
    * You can sort with more than 1 field: `sort=-plays,song`
        - Sort by plays descending, then by song name ascending
    * skip and limit are optional, but appear max 1 time in the query
* No regex support for the params
* For complex queries or queries need regex, you can use the **Question** feature
    * Question is a built-in query in server side, API consumers just need to provide the question, and maybe params of the question.
    * This feature is to demo the idea that complex queries and maybe-not-safe regex should be checked and put on the server.
    * This API has 2 built in Question
        - `/song?question=title(You)`
            + Query all songs that have name start with the word "You"
        - `/song?trending&limit=5`
            + Query Top 5 trending songs in August. Trending is calculated by plays-august subtract plays-july

### Technical notes

- API is built with TypeScript and Fastify framework
- Fastify framework has an interesting plugins system, check it here: [The hitchhiker's guide to plugins](https://www.fastify.io/docs/latest/Guides/Plugins-Guide/)
- Main logic of this API is called with the plugin `taylor-bot.ts`
- Data is put in a MongoDb database, where it can be queried by the schema and keywords described in the API usage section.
- My personal goal is to make the API params easy to read, easy to support complex queries but not to expose the powerful regex to the clients.

- The main code files:
    - `src/services/taylor-query-parser.ts`
        - This converts API query params to a DB query object to use with Mongo DB. Support these operators: =,!=, >, >=, <, <= and also support the **Question** feature.
    - `src/services/taylor-query-service.ts`
        - Main service to query MongoDb, with the provided DB query from the parser.
        - Support query song, query album (Aggregation with MongoDb), Question
    - `src/services/taylor-questions.ts`
        - 2 Mongo db queries preset: title(regex) and trending
    - `src/routes/swift-cloud.ts`
        - All routes of the API
    - `src/plugins/taylor-bot.ts`
        - Plugin for Fastify, using taylor-query-service.ts
    - `src/plugins/db-connector.ts`
        - MongoDb setup, for both local and the one on https://swiftcloud.fly.dev
        - For demo purpose, connection string and password are hardcoded here, the user has read-only permission.
    - `data-scripts`
        - Just for reference purpose, no need for running this project on local
    - `test/services`
        - Unit tests for this project
        - For testing taylor-query-service.ts, this project uses "mongodb-memory-server"
### Local setup guide

- The machine should have Nodejs (18 or 20)
1. To install all dependencies: `npm install`
2. To build
    `npm run build`
3. To start the local server
    `npm run start`
- In order to build and then start, run
    `npm run dstart`
- To run test
    `npm run test`
- To enforce coding standard
    `npm run lint`

### Deploy on cloud

- This project can be deployed easily on cloud where docker can run.
- https://swiftcloud.fly.dev is hosted on fly.io

### Future work

- Add more unit tests to make it complete, now test coverage is high but still missing some area.
- More interesting idea: Question should support real questions
    - The basic of this app is converting query to a DB query, and use it with MongoDB
    - With a bit of sample training using OpenApi, we can have a function in our app, that converts a real question to a DB query

