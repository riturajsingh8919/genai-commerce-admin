import { NextResponse } from "next/server";
import { docClient, DYNAMODB_TABLE_NAME } from "@/lib/aws";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const params = {
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        pk: `USER#${email}`,
        sk: "METADATA",
      },
    };

    const { Item } = await docClient.send(new GetCommand(params));

    if (Item) {
      // Return profile data for pre-filling
      return NextResponse.json({
        exists: true,
        user: {
          name: Item.name,
          email: Item.email,
          address: Item.street || Item.address, // Fallback to flat address if structured not available
          city: Item.city || "",
          state: Item.state || "",
          zip: Item.zip || "",
        }
      });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error("User Check API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
