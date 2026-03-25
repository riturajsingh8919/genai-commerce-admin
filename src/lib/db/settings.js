import { docClient, DYNAMODB_TABLE_NAME } from "../aws";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const SETTINGS_PK = "SETTING#GLOBAL";
const SETTINGS_SK = "CONFIG";

export async function getGlobalSettings() {
  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    Key: {
      pk: SETTINGS_PK,
      sk: SETTINGS_SK,
    },
  };

  try {
    const data = await docClient.send(new GetCommand(params));
    return (
      data.Item || {
        currency: "USD ($)",
        taxRate: "12",
        shippingCharges: "15",
        shipFrom: "Warehouse 1, Silicon Valley, CA",
        soldBy: "NexCura Health Labs",
        coupons: [],
        featureBadges: [
          { label: "2-day shipping" },
          { label: "30-day returns" },
          { label: "1-year warranty" },
          { label: "Charger included" },
        ],
        membership: {
          name: "NexCura Membership",
          price: "5.99",
          description:
            "New members receive a free trial month. $5.99 USD/month afterwards.",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching settings:", error);
    throw error;
  }
}

export async function updateGlobalSettings(settings) {
  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    Item: {
      pk: SETTINGS_PK,
      sk: SETTINGS_SK,
      ...settings,
      updatedAt: new Date().toISOString(),
    },
  };

  try {
    await docClient.send(new PutCommand(params));
    return settings;
  } catch (error) {
    console.error("Error updating settings:", error);
    throw error;
  }
}
