import { docClient, DYNAMODB_TABLE_NAME } from "../aws";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

/**
 * Manages state for automated cron jobs in DynamoDB.
 * Uses a dedicated SK prefix "CRON#" to avoid collisions.
 */

const CRON_PK = "SYSTEM#CRON";

export async function getCronState(jobName) {
  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    Key: {
      pk: CRON_PK,
      sk: `JOB#${jobName.toUpperCase()}`,
    },
  };

  try {
    const data = await docClient.send(new GetCommand(params));
    return data.Item || null;
  } catch (error) {
    console.error(`Error fetching cron state for ${jobName}:`, error);
    return null;
  }
}

export async function updateCronState(jobName, fingerprint, extraData = {}) {
  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    Item: {
      pk: CRON_PK,
      sk: `JOB#${jobName.toUpperCase()}`,
      jobName,
      lastRun: new Date().toISOString(),
      fingerprint,
      ...extraData,
    },
  };

  try {
    await docClient.send(new PutCommand(params));
    return true;
  } catch (error) {
    console.error(`Error updating cron state for ${jobName}:`, error);
    return false;
  }
}
