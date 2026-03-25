const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config({ path: ".env.local" });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

async function seedAdmin() {
  const tableName = process.env.DYNAMODB_TABLE_NAME || "genai";
  const email = "riturajsingh8919@gmail.com";
  const password = "Temp@2026";
  const name = "Rituraj Singh";

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    const params = {
      TableName: tableName,
      Item: {
        pk: `USER#${id}`,
        sk: "METADATA",
        id,
        name,
        email,
        password: hashedPassword,
        role: "admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    console.log(`Seeding admin user: ${email}...`);
    await docClient.send(new PutCommand(params));
    console.log("Admin user seeded successfully.");
  } catch (error) {
    console.error("Seeding failed:", error);
  }
}

seedAdmin();
