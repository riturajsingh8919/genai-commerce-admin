const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");
const dotenv = require("dotenv");
dotenv.config({ path: '.env.local' });
const region = process.env.AWS_REGION || "ap-south-1";
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

const ddbClient = new DynamoDBClient({ region, credentials });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const SOURCE_TABLE = process.env.DYNAMODB_TABLE_NAME || "genai";
const TABLES = {
  PRODUCT: process.env.PRODUCTS_TABLE || "nexring_products",
  ORDER: process.env.ORDERS_TABLE || "nexring_orders",
  USER: process.env.USERS_TABLE || "nexring_users",
  SETTINGS: process.env.SETTINGS_TABLE || "nexring_settings",
  DEPENDANTS: process.env.USERS_TABLE || "nexring_users", // Dependants go to Users table
};

async function migrate() {
  console.log(`Starting migration from ${SOURCE_TABLE}...`);
  
  let totalProcessed = 0;
  let successCount = 0;
  let lastEvaluatedKey = null;

  do {
    const params = {
      TableName: SOURCE_TABLE,
    };
    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }

    const data = await docClient.send(new ScanCommand(params));
    const items = data.Items || [];

    for (const item of items) {
      totalProcessed++;
      const pkType = item.pk.split("#")[0];
      const targetTable = TABLES[pkType];

      if (targetTable) {
        try {
          await docClient.send(new PutCommand({
            TableName: targetTable,
            Item: item
          }));
          successCount++;
        } catch (err) {
          console.error(`Error migrating item ${item.pk}:`, err.message);
        }
      } else {
        // Handle special cases
        if (pkType === "SETTING" || pkType === "SYSTEM" || item.pk === "SETTINGS") {
          await docClient.send(new PutCommand({
            TableName: TABLES.SETTINGS,
            Item: item
          }));
          successCount++;
        } else if (pkType === "VERIFY" || pkType === "DEPENDANTS" || item.pk === "DEPENDANTS") {
           await docClient.send(new PutCommand({
            TableName: TABLES.USER,
            Item: item
          }));
          successCount++;
        } else {
          console.log(`Unknown PK type: ${item.pk}. Skipping.`);
        }
      }
    }

    lastEvaluatedKey = data.LastEvaluatedKey;
    console.log(`Processed ${totalProcessed} items so far...`);
  } while (lastEvaluatedKey);

  console.log("\nMigration Complete!");
  console.log(`Total Items Scanned: ${totalProcessed}`);
  console.log(`Total Items Migrated: ${successCount}`);
}

if (!credentials.accessKeyId || !credentials.secretAccessKey) {
  console.error("AWS credentials missing from environment variables!");
  process.exit(1);
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
