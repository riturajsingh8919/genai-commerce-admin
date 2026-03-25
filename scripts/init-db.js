const {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
} = require("@aws-sdk/client-dynamodb");
require("dotenv").config({ path: ".env.local" });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function initDB() {
  const tableName = process.env.DYNAMODB_TABLE_NAME || "genai";

  const params = {
    TableName: tableName,
    AttributeDefinitions: [
      { AttributeName: "pk", AttributeType: "S" },
      { AttributeName: "sk", AttributeType: "S" },
      { AttributeName: "email", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" },
      { AttributeName: "sk", KeyType: "RANGE" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "EmailIndex",
        KeySchema: [{ AttributeName: "email", KeyType: "HASH" }],
        Projection: {
          ProjectionType: "ALL",
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };

  try {
    console.log(`Creating table ${tableName}...`);
    const data = await client.send(new CreateTableCommand(params));
    console.log("Table creation initiated:", data.TableDescription.TableStatus);

    // Wait for table to become active
    console.log("Waiting for table to become active...");
    let isActive = false;
    while (!isActive) {
      const description = await client.send(
        new DescribeTableCommand({ TableName: tableName }),
      );
      if (description.Table.TableStatus === "ACTIVE") {
        isActive = true;
        console.log("Table is now ACTIVE.");
      } else {
        process.stdout.write(".");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  } catch (error) {
    if (error.name === "ResourceInUseException") {
      console.log("Table already exists.");
    } else {
      console.error("Error creating table:", error);
    }
  }
}

initDB();
