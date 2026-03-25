import { docClient, DYNAMODB_TABLE_NAME } from "../aws";
import {
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

// Simple memory cache to prevent DynamoDB throttling on expensive scans
const CACHE_TTL = 60000; // 60 seconds
let ordersCache = { data: null, timestamp: 0 };
let usersCache = { data: null, timestamp: 0 };

export const invalidateOrdersCache = () => {
  ordersCache = { data: null, timestamp: 0 };
};

export const invalidateUsersCache = () => {
  usersCache = { data: null, timestamp: 0 };
};

export async function createOrder(orderData) {
  const orderId = uuidv4();

  // Generate structured activation codes for each ring purchased
  const totalQuantity = orderData.items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const activationCodes = Array.from({ length: totalQuantity }).map(() => ({
    code: `NEXCURA-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    status: "Inactive",
    activatedAt: null,
    activatedBy: null,
    createdAt: new Date().toISOString(),
  }));

  // Group shipments by unique address
  const uniqueAddresses = Array.from(new Set(orderData.shippingAddresses || [orderData.shippingAddress]));
  const shipments = uniqueAddresses.map(addr => {
    // Find which items belong to this address (if shippingAddresses matches items array)
    const itemIndices = [];
    if (orderData.shippingAddresses) {
      orderData.shippingAddresses.forEach((a, idx) => {
        if (a === addr) itemIndices.push(idx);
      });
    }

    return {
      address: addr,
      itemIndices, // Track which rings are in this shipment
      status: "PAID",
      trackingNumber: "",
      updatedAt: new Date().toISOString()
    };
  });

  const orderItem = {
    pk: `ORDER#${orderId}`,
    sk: "METADATA",
    id: orderId,
    ...orderData,
    activationCodes,
    shipments,
    status: "PAID",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Remove redundant fields that were merged into the structured object or are handled via orderData
  delete orderItem.subscriptionCode;
  delete orderItem.subscriptionCodes;
  // Use shippingAddresses array as source of truth, remove flat shippingAddress if redundant
  // We keep it for now if backward compat is strictly needed, but internal logic prefers the array.

  try {
    // Check if user already exists
    const getUserParams = {
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        pk: `USER#${orderData.customer.email}`,
        sk: "METADATA",
      },
    };

    const existingUser = await docClient.send(new GetCommand(getUserParams));

    if (existingUser.Item) {
      // Update existing user
      await docClient.send(
        new UpdateCommand({
          TableName: DYNAMODB_TABLE_NAME,
          Key: {
            pk: `USER#${orderData.customer.email}`,
            sk: "METADATA",
          },
          UpdateExpression:
            "SET #name = :name, #address = :address, #street = :street, #city = :city, #state = :state, #zip = :zip, #country = :country, lastOrderAt = :now, totalOrders = totalOrders + :inc, #role = :role",
          ExpressionAttributeNames: {
            "#name": "name",
            "#address": "address",
            "#street": "street",
            "#city": "city",
            "#state": "state",
            "#zip": "zip",
            "#country": "country",
            "#role": "role",
          },
          ExpressionAttributeValues: {
            ":name": orderData.customer.name,
            ":address": orderData.shippingAddress,
            ":street": orderData.customer.address,
            ":city": orderData.customer.city,
            ":state": orderData.customer.state,
            ":zip": orderData.customer.zip,
            ":country": orderData.country || "US",
            ":now": new Date().toISOString(),
            ":inc": 1,
            ":role": "user",
          },
        }),
      );
    } else {
      // Create New User
      const userItem = {
        pk: `USER#${orderData.customer.email}`,
        sk: "METADATA",
        email: orderData.customer.email,
        name: orderData.customer.name,
        address: orderData.shippingAddress,
        street: orderData.customer.address,
        city: orderData.customer.city,
        state: orderData.customer.state,
        zip: orderData.customer.zip,
        country: orderData.country || "US",
        joinedAt: new Date().toISOString(),
        lastOrderAt: new Date().toISOString(),
        totalOrders: 1,
        role: "user",
      };
      await docClient.send(
        new PutCommand({
          TableName: DYNAMODB_TABLE_NAME,
          Item: userItem,
        }),
      );
    }

    // Save Order
    await docClient.send(
      new PutCommand({
        TableName: DYNAMODB_TABLE_NAME,
        Item: orderItem,
      }),
    );

    invalidateOrdersCache();
    invalidateUsersCache();
    return { ...orderItem };
  } catch (error) {
    console.error("Error creating order/user:", error);
    throw error;
  }
}

export async function getOrderById(id) {
  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    Key: {
      pk: `ORDER#${id}`,
      sk: "METADATA",
    },
  };

  try {
    const data = await docClient.send(new GetCommand(params));
    return data.Item || null;
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    throw error;
  }
}

export async function updateShipmentStatus(id, shipmentIndex, status, trackingNumber = "") {
  // First, get the current order to modify the shipments array
  const order = await getOrderById(id);
  if (!order || !order.shipments) {
    throw new Error("Order or shipments not found");
  }

  const updatedShipments = [...order.shipments];
  
  if (shipmentIndex === "all") {
    // Update all shipments
    for (let i = 0; i < updatedShipments.length; i++) {
      updatedShipments[i] = {
        ...updatedShipments[i],
        status,
        trackingNumber: trackingNumber || updatedShipments[i].trackingNumber,
        updatedAt: new Date().toISOString()
      };
    }
  } else {
    // Update specific shipment
    if (shipmentIndex < 0 || shipmentIndex >= updatedShipments.length) {
      throw new Error("Invalid shipment index");
    }
    updatedShipments[shipmentIndex] = {
      ...updatedShipments[shipmentIndex],
      status,
      trackingNumber: trackingNumber || updatedShipments[shipmentIndex].trackingNumber,
      updatedAt: new Date().toISOString()
    };
  }

  // Determine global status based on shipments
  let globalStatus = "PAID";
  const statuses = updatedShipments.map(s => s.status);
  
  if (statuses.every(s => s === "DELIVERED")) {
    globalStatus = "DELIVERED";
  } else if (statuses.every(s => s === "CANCELLED")) {
    globalStatus = "CANCELLED";
  } else if (statuses.some(s => s === "SHIPPED" || s === "DELIVERED")) {
    globalStatus = "SHIPPED";
  } else if (statuses.some(s => s === "PROCESSING")) {
    globalStatus = "PROCESSING";
  }

  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    Key: {
      pk: `ORDER#${id}`,
      sk: "METADATA",
    },
    UpdateExpression: "SET #status = :status, shipments = :shipments, updatedAt = :now",
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":status": globalStatus,
      ":shipments": updatedShipments,
      ":now": new Date().toISOString(),
    },
    ReturnValues: "ALL_NEW",
  };

  const result = await docClient.send(new UpdateCommand(params));
  invalidateOrdersCache();
  return result.Attributes;
}

export async function deleteOrder(id) {
  try {
    // 1. Fetch order to identify the associated customer
    const order = await getOrderById(id);
    if (!order) return true;

    const email = order.customer?.email;

    // 2. Identify if this is the user's last order
    if (email) {
      // Fetch all orders for this email
      const userOrders = await getOrdersByEmail(email);
      const otherOrders = userOrders.filter(o => o.id !== id);

      // Only purge user record if no other orders exist
      if (otherOrders.length === 0) {
        const userParams = {
          TableName: DYNAMODB_TABLE_NAME,
          Key: {
            pk: `USER#${email}`,
            sk: "METADATA",
          },
        };
        await docClient.send(new DeleteCommand(userParams));
        console.log(`Cascade Deletion: Last order removed. User ${email} profile purged.`);
      } else {
        console.log(`Selective Deletion: Keep User ${email} profile. ${otherOrders.length} orders remaining.`);
      }
    }

    // 3. Delete the order metadata
    const orderParams = {
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        pk: `ORDER#${id}`,
        sk: "METADATA",
      },
    };

    await docClient.send(new DeleteCommand(orderParams));
    invalidateOrdersCache();
    return true;
  } catch (error) {
    console.error("Cascade Deletion Error:", error);
    throw error;
  }
}

export async function getAllOrders() {
  const now = Date.now();
  if (ordersCache.data && now - ordersCache.timestamp < CACHE_TTL) {
    return ordersCache.data;
  }

  try {
    const data = await docClient.send(
      new ScanCommand({
        TableName: DYNAMODB_TABLE_NAME,
        FilterExpression: "begins_with(pk, :pkPrefix)",
        ProjectionExpression: 
          "#id, #country, #currency, #total, #status, #createdAt, #customer, #items, activationCodes, shipments, shippingAddress, shippingAddresses, isGift, appliedCoupon, phone",
        ExpressionAttributeNames: {
          "#id": "id",
          "#country": "country",
          "#currency": "currency",
          "#total": "total",
          "#status": "status",
          "#createdAt": "createdAt",
          "#customer": "customer",
          "#items": "items",
        },
        ExpressionAttributeValues: {
          ":pkPrefix": "ORDER#",
        },
      }),
    );
    const result = data.Items || [];
    ordersCache = { data: result, timestamp: Date.now() };
    return result;
  } catch (error) {
    console.error("Error fetching all orders:", error);
    throw error;
  }
}

export async function getAllUsers() {
  const now = Date.now();
  if (usersCache.data && now - usersCache.timestamp < CACHE_TTL) {
    return usersCache.data;
  }

  try {
    const data = await docClient.send(
      new ScanCommand({
        TableName: DYNAMODB_TABLE_NAME,
        FilterExpression: "begins_with(pk, :pkPrefix)",
        ProjectionExpression: "pk, #email, #name, #role, #adminType, #adminCountry, #createdAt, #country, isDependant, mainPurchaserEmail",
        ExpressionAttributeNames: {
          "#email": "email",
          "#name": "name",
          "#role": "role",
          "#adminType": "adminType",
          "#adminCountry": "adminCountry",
          "#createdAt": "createdAt",
          "#country": "country",
        },
        ExpressionAttributeValues: {
          ":pkPrefix": "USER#",
        },
      }),
    );
    const result = data.Items || [];
    usersCache = { data: result, timestamp: Date.now() };
    return result;
  } catch (error) {
    console.error("Error fetching all users:", error);
    throw error;
  }
}

export async function getAllDependents() {
  try {
    // 1. Get from DEPENDANTS partition
    const depData = await docClient.send(
      new QueryCommand({
        TableName: DYNAMODB_TABLE_NAME,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: {
          ":pk": "DEPENDANTS",
        },
      }),
    );
    const partitionDeps = depData.Items || [];

    // 2. Get from USER# partition (regular users who became dependants)
    const allUserRecords = await getAllUsers();
    const manualDeps = allUserRecords.filter((u) => u.isDependant);

    // 3. Combine and return
    return [...partitionDeps, ...manualDeps];
  } catch (error) {
    console.error("Error fetching all dependents:", error);
    throw error;
  }
}

export async function getOrderBySubscriptionCode(code) {
  // Scan for subscription code (not efficient but workaround for no index)
  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    FilterExpression:
      "subscriptionCode = :code OR contains(subscriptionCodes, :code)",
    ExpressionAttributeValues: {
      ":code": code,
    },
  };

  try {
    const data = await docClient.send(new ScanCommand(params));
    return data.Items?.[0] || null;
  } catch (error) {
    console.error("Error fetching order by code:", error);
    throw error;
  }
}

export async function getOrdersByEmail(email) {
  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    FilterExpression: "customer.email = :email",
    ExpressionAttributeValues: {
      ":email": email,
    },
  };

  try {
    const data = await docClient.send(new ScanCommand(params));
    // Sort by createdAt descending
    return (data.Items || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  } catch (error) {
    console.error("Error fetching orders by email:", error);
    throw error;
  }
}

export async function verifyActivationCodes(codes) {
  if (!Array.isArray(codes) || codes.length === 0) return { success: false, error: "No codes provided" };

  try {
    // Scan for orders that contain these codes
    // Note: In production with many orders, an index or different schema would be better.
    const params = {
      TableName: DYNAMODB_TABLE_NAME,
      FilterExpression: "begins_with(pk, :orderPrefix)",
      ExpressionAttributeValues: {
        ":orderPrefix": "ORDER#",
      },
    };

    const data = await docClient.send(new ScanCommand(params));
    const orders = data.Items || [];

    const verificationResults = [];
    let foundAll = true;

    for (const code of codes) {
      let foundInOrder = null;
      let codeObj = null;

      for (const order of orders) {
        if (order.activationCodes) {
          const match = order.activationCodes.find(c => c.code === code);
          if (match) {
            foundInOrder = order;
            codeObj = match;
            break;
          }
        }
      }

      if (foundInOrder) {
        verificationResults.push({
          code,
          isValid: true,
          status: codeObj.status,
          orderId: foundInOrder.id,
          purchaserEmail: foundInOrder.customer.email,
          createdAt: foundInOrder.createdAt,
          items: foundInOrder.items
        });
      } else {
        verificationResults.push({ code, isValid: false, error: "Code not found" });
        foundAll = false;
      }
    }

    return {
      success: foundAll,
      results: verificationResults
    };
  } catch (error) {
    console.error("Error verifying codes:", error);
    throw error;
  }
}

export async function activateSubscriptionCodes(orderId, codes, activationData) {
  const { email, mainEmail, planType, billingDetails } = activationData;

  try {
    const order = await getOrderById(orderId);
    if (!order) throw new Error("Order not found");

    const updatedActivationCodes = order.activationCodes.map(c => {
      if (codes.includes(c.code)) {
        return {
          ...c,
          status: "Active",
          activatedAt: new Date().toISOString(),
          activatedBy: email,
        };
      }
      return c;
    });

    // Update Order with active codes
    await docClient.send(
      new UpdateCommand({
        TableName: DYNAMODB_TABLE_NAME,
        Key: {
          pk: `ORDER#${orderId}`,
          sk: "METADATA",
        },
        UpdateExpression: "SET activationCodes = :codes, updatedAt = :now",
        ExpressionAttributeValues: {
          ":codes": updatedActivationCodes,
          ":now": new Date().toISOString(),
        },
      })
    );

    // Update or Create User record with subscription info
    const userParams = {
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        pk: `USER#${email}`,
        sk: "METADATA",
      },
    };

    const userRes = await docClient.send(new GetCommand(userParams));
    const existingUser = userRes.Item;

    const subscription = {
      status: "Active",
      plan: planType, // 'Essential' or 'Comprehensive'
      nextBillDate: new Date(new Date(order.createdAt).setFullYear(new Date(order.createdAt).getFullYear() + 1)).toISOString(),
      billingDetails,
      activatedAt: new Date().toISOString(),
      orderId: orderId,
      mainEmail: mainEmail !== email ? mainEmail : null, // Record main purchaser if different
    };

    if (existingUser) {
      await docClient.send(
        new UpdateCommand({
          TableName: DYNAMODB_TABLE_NAME,
          Key: {
            pk: `USER#${email}`,
            sk: "METADATA",
          },
          UpdateExpression: "SET subscription = :sub, updatedAt = :now, isDependant = :isDep, mainPurchaserEmail = :mainEmail, country = :country",
          ExpressionAttributeValues: {
            ":sub": subscription,
            ":now": new Date().toISOString(),
            ":isDep": mainEmail !== email,
            ":mainEmail": mainEmail,
            ":country": order.country || "US",
          },
        })
      );
    } else {
      // Create a basic user entry for a dependant
      // Consolidated into "DEPENDANTS" partition for better DB organization
      await docClient.send(
        new PutCommand({
          TableName: DYNAMODB_TABLE_NAME,
          Item: {
            pk: "DEPENDANTS",
            sk: `USER#${email}`,
            email,
            subscription,
            isDependant: true,
            mainPurchaserEmail: mainEmail,
            country: order.country || "US",
            joinedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        })
      );
    }

    invalidateOrdersCache();
    invalidateUsersCache();
    return { success: true };
  } catch (error) {
    console.error("Error activating codes:", error);
    throw error;
  }
}
