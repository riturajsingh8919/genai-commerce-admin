import { docClient, DYNAMODB_TABLE_NAME } from "../aws";
import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { hashPassword } from "../auth";

export const USER_TYPE = {
  USER: "user",
  ADMIN: "admin",
};

export async function getAllAdmins() {
  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    FilterExpression: "#role = :role",
    ExpressionAttributeNames: {
      "#role": "role",
    },
    ExpressionAttributeValues: {
      ":role": USER_TYPE.ADMIN,
    },
  };

  try {
    const { Items } = await docClient.send(new ScanCommand(params));
    return Items || [];
  } catch (error) {
    console.error("Error fetching admins:", error);
    throw error;
  }
}

export async function getUserByEmail(email) {
  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    IndexName: "EmailIndex",
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: {
      ":email": email,
    },
  };

  try {
    const data = await docClient.send(new QueryCommand(params));
    return data.Items[0];
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
}

export async function createUser({
  name,
  email,
  password,
  role = USER_TYPE.USER,
  adminType = "SUPER_ADMIN",
  adminCountry = null,
}) {
  const id = uuidv4();
  const hashedPassword = await hashPassword(password);

  const item = {
    pk: `USER#${id}`,
    sk: "METADATA",
    id,
    name,
    email,
    password: hashedPassword,
    role,
    adminType,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Only store adminCountry for COUNTRY_ADMIN
  if (adminType === "COUNTRY_ADMIN" && adminCountry) {
    item.adminCountry = adminCountry;
  }

  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    Item: item,
  };

  try {
    await docClient.send(new PutCommand(params));
    return { pk: item.pk, id, name, email, role, adminType, adminCountry };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

export async function updateUser(email, userData) {
  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    Item: {
      ...userData,
      email, // Ensure email stays consistent as it's our lookup key
      updatedAt: new Date().toISOString(),
    },
  };

  try {
    await docClient.send(new PutCommand(params));
    return { email, ...userData };
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

// Initial Admin Creator (helper for setup)
export async function ensureAdminExists() {
  const adminEmail = "riturajsingh8919@gmail.com";
  const existingAdmin = await getUserByEmail(adminEmail);

  if (!existingAdmin) {
    const temporaryPassword = "Temp@2026";
    await createUser({
      name: "Rituraj Singh",
      email: adminEmail,
      password: temporaryPassword,
      role: USER_TYPE.ADMIN,
    });
    console.log(`Initial admin created with email: ${adminEmail}`);
  }
}

export async function deleteUser(pk, sk = "METADATA") {
  try {
    await docClient.send(
      new DeleteCommand({
        TableName: DYNAMODB_TABLE_NAME,
        Key: { pk, sk },
      }),
    );
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}
