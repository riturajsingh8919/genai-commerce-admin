import { docClient, DYNAMODB_TABLE_NAME } from "../aws";
import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

// Simple memory cache to prevent DynamoDB throttling on expensive scans
const CACHE_TTL = 60000; // 60 seconds
let productsCache = { data: null, timestamp: 0 };

export const PRODUCT_STATUS = {
  ACTIVE: "Active",
  OUT_OF_STOCK: "Out of Stock",
  DRAFT: "Draft",
};

export async function getAllProducts() {
  const now = Date.now();
  if (productsCache.data && now - productsCache.timestamp < CACHE_TTL) {
    return productsCache.data;
  }

  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    ProjectionExpression: "#pk, #sk, #title, #status, #inventory, #country, #mainImage, #colors",
    ExpressionAttributeNames: {
      "#pk": "pk",
      "#sk": "sk",
      "#title": "title",
      "#status": "status",
      "#inventory": "inventory",
      "#country": "country",
      "#mainImage": "mainImage",
      "#colors": "colors",
    },
  };

  try {
    const data = await docClient.send(new ScanCommand(params));
    const items = data.Items || [];

    // Group items by product ID
    const productGroups = {};
    const countryRecords = [];

    items.forEach((item) => {
      if (item.sk === "METADATA") {
        const id = item.pk.replace("PRODUCT#", "");
        productGroups[id] = {
          ...item,
          id,
          totalStock: 0,
          stockByCountry: {},
          granularInventory: {},
        };
      } else if (item.sk.startsWith("COUNTRY#")) {
        countryRecords.push(item);
      }
    });

    // Calculate total stock and store granular inventory for each product
    countryRecords.forEach((record) => {
      const id = record.pk.replace("PRODUCT#", "");
      if (productGroups[id] && record.inventory) {
        productGroups[id].granularInventory[record.country] = record.inventory;

        let countryCount = 0;
        Object.values(record.inventory).forEach((colors) => {
          Object.values(colors).forEach((stock) => {
            countryCount += Number(stock || 0);
          });
        });
        productGroups[id].totalStock += countryCount;
        productGroups[id].stockByCountry[record.country] = countryCount;
      }
    });

    const result = Object.values(productGroups);
    productsCache = { data: result, timestamp: Date.now() };
    return result;
  } catch (error) {
    console.error("Error fetching all products:", error);
    throw error;
  }
}

export async function getProductById(id) {
  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    Key: {
      pk: `PRODUCT#${id}`,
      sk: "METADATA",
    },
  };

  try {
    const data = await docClient.send(new GetCommand(params));
    return data.Item;
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    throw error;
  }
}

export async function createProduct(productData) {
  const id = uuidv4();
  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    Item: {
      pk: `PRODUCT#${id}`,
      sk: "METADATA",
      id,
      ...productData,
      status: productData.status || PRODUCT_STATUS.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };

  try {
    await docClient.send(new PutCommand(params));
    return { id, ...productData };
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}

export async function updateProduct(id, productData) {
  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    Item: {
      pk: `PRODUCT#${id}`,
      sk: "METADATA",
      id,
      ...productData,
      updatedAt: new Date().toISOString(),
    },
  };

  try {
    await docClient.send(new PutCommand(params));
    return { id, ...productData };
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
}

export async function deleteProduct(id) {
  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    Key: {
      pk: `PRODUCT#${id}`,
      sk: "METADATA",
    },
  };

  try {
    await docClient.send(new DeleteCommand(params));
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}

export async function patchProductStatus(id, status) {
  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    Key: {
      pk: `PRODUCT#${id}`,
      sk: "METADATA",
    },
    UpdateExpression: "SET #status = :status, updatedAt = :now",
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":status": status,
      ":now": new Date().toISOString(),
    },
    ReturnValues: "ALL_NEW",
  };

  try {
    const data = await docClient.send(new UpdateCommand(params));
    return data.Attributes;
  } catch (error) {
    console.error("Error patching product status:", error);
    throw error;
  }
}

export async function getProductBySlug(slug) {
  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    FilterExpression: "slug = :slug",
    ExpressionAttributeValues: {
      ":slug": slug,
    },
  };

  try {
    const data = await docClient.send(new ScanCommand(params));
    return data.Items?.[0] || null;
  } catch (error) {
    console.error("Error fetching product by slug:", error);
    throw error;
  }
}

// ─── Country Pricing ───────────────────────────────────────────────

export async function getCountryPricing(productId, countryCode) {
  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    Key: {
      pk: `PRODUCT#${productId}`,
      sk: `COUNTRY#${countryCode}`,
    },
  };

  try {
    const data = await docClient.send(new GetCommand(params));
    return data.Item || null;
  } catch (error) {
    console.error("Error fetching country pricing:", error);
    throw error;
  }
}

export async function getAllCountryPricing(productId) {
  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    KeyConditionExpression: "pk = :pk AND begins_with(sk, :skPrefix)",
    ExpressionAttributeValues: {
      ":pk": `PRODUCT#${productId}`,
      ":skPrefix": "COUNTRY#",
    },
  };

  try {
    const data = await docClient.send(new QueryCommand(params));
    return data.Items || [];
  } catch (error) {
    console.error("Error fetching all country pricing:", error);
    throw error;
  }
}

export async function upsertCountryPricing(
  productId,
  country,
  currency,
  price,
  mrp,
  taxRate = 12,
  shippingFee = 15,
  membershipPrice = null,
  coupons = [],
  discountPercent = null,
  startDate = null,
  endDate = null,
) {
  // Fetch existing country record to preserve inventory map if resolving a pricing-only update
  const existing = await getCountryPricing(productId, country);

  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    Item: {
      pk: `PRODUCT#${productId}`,
      sk: `COUNTRY#${country}`,
      country,
      currency,
      price: Number(price),
      mrp: Number(mrp),
      taxRate: Number(taxRate),
      shippingFee: Number(shippingFee),
      membershipPrice: membershipPrice ? Number(membershipPrice) : null,
      coupons: Array.isArray(coupons) ? coupons : [],
      discountPercent: discountPercent ? Number(discountPercent) : null,
      startDate: startDate || null,
      endDate: endDate || null,
      inventory: existing?.inventory || {},
      updatedAt: new Date().toISOString(),
    },
  };

  try {
    await docClient.send(new PutCommand(params));
    return {
      country,
      currency,
      price,
      mrp,
      taxRate,
      shippingFee,
      membershipPrice,
      coupons,
      discountPercent,
      startDate,
      endDate,
    };
  } catch (error) {
    console.error("Error upserting country pricing:", error);
    throw error;
  }
}

export async function deleteCountryPricing(productId, country) {
  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    Key: {
      pk: `PRODUCT#${productId}`,
      sk: `COUNTRY#${country}`,
    },
  };

  try {
    await docClient.send(new DeleteCommand(params));
    return { success: true };
  } catch (error) {
    console.error("Error deleting country pricing:", error);
    throw error;
  }
}

// ─── Inventory ─────────────────────────────────────────────────────

export async function getInventoryForCountry(productId, country) {
  let countryData = await getCountryPricing(productId, country);

  // US Fallback: If no inventory for this country, try US
  if (
    (!countryData ||
      !countryData.inventory ||
      Object.keys(countryData.inventory).length === 0) &&
    country !== "US"
  ) {
    countryData = await getCountryPricing(productId, "US");
  }

  const items = [];
  if (countryData && countryData.inventory) {
    for (const [color, sizes] of Object.entries(countryData.inventory)) {
      if (sizes && typeof sizes === "object") {
        for (const [size, stock] of Object.entries(sizes)) {
          items.push({ country: countryData.country, color, size, stock });
        }
      }
    }
  }
  return items;
}

export async function getAllInventory(productId) {
  const allCountries = await getAllCountryPricing(productId);
  const items = [];

  for (const countryData of allCountries) {
    if (countryData.inventory) {
      for (const [color, sizes] of Object.entries(countryData.inventory)) {
        for (const [size, stock] of Object.entries(sizes)) {
          items.push({ country: countryData.country, color, size, stock });
        }
      }
    }
  }
  return items;
}

export async function upsertInventoryItem(
  productId,
  country,
  color,
  size,
  stock,
) {
  // Ensure the country record exists first, grabbing existing inventory map
  let countryData = await getCountryPricing(productId, country);
  if (!countryData) {
    // If pricing wasn't set yet, create a shell record
    countryData = {
      pk: `PRODUCT#${productId}`,
      sk: `COUNTRY#${country}`,
      country,
      currency: "USD",
      price: 0,
      mrp: 0,
      inventory: {},
    };
  } else if (!countryData.inventory) {
    countryData.inventory = {};
  }

  const upperColor = color.toUpperCase();
  if (!countryData.inventory[upperColor]) {
    countryData.inventory[upperColor] = {};
  }

  countryData.inventory[upperColor][String(size)] = Number(stock);
  countryData.updatedAt = new Date().toISOString();

  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    Item: countryData,
  };

  try {
    await docClient.send(new PutCommand(params));
    return { country, color, size, stock };
  } catch (error) {
    console.error("Error upserting inventory item:", error);
    throw error;
  }
}

export async function bulkUpsertInventoryItems(productId, country, items) {
  // Fetch the existing document once to prevent race conditions during concurrent updating
  let countryData = await getCountryPricing(productId, country);
  if (!countryData) {
    countryData = {
      pk: `PRODUCT#${productId}`,
      sk: `COUNTRY#${country}`,
      country,
      currency: "USD",
      price: 0,
      mrp: 0,
      inventory: {},
    };
  } else if (!countryData.inventory) {
    countryData.inventory = {};
  }

  // Sequentially merge all requested color/size updates into the memory document
  items.forEach(({ color, size, stock }) => {
    const upperColor = color.toUpperCase();
    if (!countryData.inventory[upperColor]) {
      countryData.inventory[upperColor] = {};
    }
    countryData.inventory[upperColor][String(size)] = Number(stock);
  });

  countryData.updatedAt = new Date().toISOString();

  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    Item: countryData,
  };

  try {
    await docClient.send(new PutCommand(params));
    return items;
  } catch (error) {
    console.error("Error bulk upserting inventory items:", error);
    throw error;
  }
}

export async function deleteInventoryItem(productId, country, color, size) {
  const countryData = await getCountryPricing(productId, country);
  if (!countryData || !countryData.inventory) return { success: true };

  const upperColor = color.toUpperCase();
  if (
    countryData.inventory[upperColor] &&
    countryData.inventory[upperColor][String(size)] !== undefined
  ) {
    delete countryData.inventory[upperColor][String(size)];

    // Cleanup empty color objects
    if (Object.keys(countryData.inventory[upperColor]).length === 0) {
      delete countryData.inventory[upperColor];
    }

    countryData.updatedAt = new Date().toISOString();

    const params = {
      TableName: DYNAMODB_TABLE_NAME,
      Item: countryData,
    };

    try {
      await docClient.send(new PutCommand(params));
    } catch (error) {
      console.error("Error deleting inventory item via merge:", error);
      throw error;
    }
  }

    return { success: true };
}

export async function deleteInventoryForColor(productId, color) {
  const allCountries = await getAllCountryPricing(productId);
  const upperColor = color.toUpperCase();
  
  for (const countryData of allCountries) {
    if (countryData.inventory && countryData.inventory[upperColor]) {
      delete countryData.inventory[upperColor];
      
      countryData.updatedAt = new Date().toISOString();
      const params = {
        TableName: DYNAMODB_TABLE_NAME,
        Item: countryData,
      };
      
      try {
        await docClient.send(new PutCommand(params));
      } catch (error) {
        console.error(`Error deleting inventory for color ${color} in ${countryData.country}:`, error);
      }
    }
  }
  return { success: true };
}

export async function decrementStock(productId, country, color, size, qty = 1) {

  let countryCode = country;
  let countryData = await getCountryPricing(productId, countryCode);

  // US Fallback logic for decrementing stock
  if (
    (!countryData ||
      !countryData.inventory ||
      !countryData.inventory[color.toUpperCase()] ||
      countryData.inventory[color.toUpperCase()][String(size)] === undefined) &&
    countryCode !== "US"
  ) {
    countryCode = "US";
    countryData = await getCountryPricing(productId, "US");
  }

  if (!countryData || !countryData.inventory) return;

  const upperColor = color.toUpperCase();
  const strSize = String(size);

  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    Key: {
      pk: `PRODUCT#${productId}`,
      sk: `COUNTRY#${countryCode}`,
    },
    UpdateExpression: `SET inventory.#col.#sz = inventory.#col.#sz - :qty, updatedAt = :now`,
    ConditionExpression: `inventory.#col.#sz >= :qty`,
    ExpressionAttributeNames: {
      "#col": upperColor,
      "#sz": strSize,
    },
    ExpressionAttributeValues: {
      ":qty": Number(qty),
      ":now": new Date().toISOString(),
    },
    ReturnValues: "ALL_NEW",
  };

  try {
    const data = await docClient.send(new UpdateCommand(params));
    return data.Attributes;
  } catch (error) {
    if (
      error.name === "ConditionalCheckFailedException" ||
      error.name === "ValidationException"
    ) {
      throw new Error(
        `Insufficient stock for ${color} size ${size} in ${country}`,
      );
    }
    console.error("Error decrementing stock:", error);
    throw error;
  }
}
