### mongoimport --uri  mongodb+srv://swiftapi:<enter_password>@swiftdb.wmhjazu.mongodb.net/SwiftDb  --collection  taylorsongs  --type CSV --file ./swift-cloud.csv --headerline

To connect with mongo shell
### mongosh "mongodb+srv://swiftdb.wmhjazu.mongodb.net/SwiftDb" --apiVersion 1 --username swiftapi

To create indexes for the database
### mongosh "mongodb+srv://swiftdb.wmhjazu.mongodb.net/SwiftDb" --apiVersion 1 --username swiftapi .\mongo-indexes.js