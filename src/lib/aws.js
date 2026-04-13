import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION || "ap-south-1";
const s3Region = process.env.S3_REGION || region;

const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

export const ddbClient = new DynamoDBClient({
  region,
  credentials,
});

export const docClient = DynamoDBDocumentClient.from(ddbClient);

export const s3Client = new S3Client({
  region: s3Region,
  credentials,
});

export const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "genai";
export const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || "nexring_products";
export const ORDERS_TABLE = process.env.ORDERS_TABLE || "nexring_orders";
export const USERS_TABLE = process.env.USERS_TABLE || "nexring_users";
export const SETTINGS_TABLE = process.env.SETTINGS_TABLE || "nexring_settings";

export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "website-assets";
export const S3_PREFIX = process.env.S3_PREFIX || "admin-uploads/";
