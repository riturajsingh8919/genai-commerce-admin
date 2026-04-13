const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const dotenv = require("dotenv");

// Load local .env.local if present
dotenv.config({ path: '.env.local' });

const region = process.env.AWS_REGION || "ap-south-1";
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

const client = new DynamoDBClient({ region, credentials });

const tables = [
  "nexring_products",
  "nexring_orders",
  "nexring_users",
  "nexring_settings"
];

async function createTable(tableName) {
  const params = {
    TableName: tableName,
    AttributeDefinitions: [
      { AttributeName: "pk", AttributeType: "S" },
      { AttributeName: "sk", AttributeType: "S" }
    ],
    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" },
      { AttributeName: "sk", KeyType: "RANGE" }
    ],
    BillingMode: "PAY_PER_REQUEST"
  };

  try {
    console.log(`Checking if table ${tableName} exists...`);
    try {
      await client.send(new DescribeTableCommand({ TableName: tableName }));
      console.log(`Table ${tableName} already exists. Skipping creation.`);
      return;
    } catch (err) {
      if (err.name !== "ResourceNotFoundException") throw err;
    }

    console.log(`Creating table ${tableName}...`);
    await client.send(new CreateTableCommand(params));
    console.log(`Successfully initiated creation of ${tableName}.`);
  } catch (error) {
    console.error(`Error processing table ${tableName}:`, error.message);
  }
}

async function run() {
  if (!credentials.accessKeyId || !credentials.secretAccessKey) {
    console.error("AWS credentials missing from environment variables!");
    process.exit(1);
  }

  for (const table of tables) {
    await createTable(table);
  }
  console.log("\nTable creation process complete.");
}

run();
