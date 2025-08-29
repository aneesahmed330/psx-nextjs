import { NextRequest, NextResponse } from "next/server";
import { getCollection, COLLECTIONS } from "@/lib/mongodb";
import { Alert } from "@/types";

export async function GET() {
  try {
    const alertsCollection = await getCollection(COLLECTIONS.ALERTS);
    const alerts = await alertsCollection.find({}).toArray();

    return NextResponse.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const alertData: Omit<Alert, "_id"> = await request.json();

    // Validate required fields
    if (
      !alertData.symbol ||
      alertData.min_price === undefined ||
      alertData.max_price === undefined
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const alertsCollection = await getCollection(COLLECTIONS.ALERTS);

    const alert: Omit<Alert, "_id"> = {
      ...alertData,
      trigger: false, // Default value
    };

    const result = await alertsCollection.insertOne(alert);

    return NextResponse.json({
      success: true,
      data: { ...alert, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Error saving alert:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save alert" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const alertUpdate = await request.json();

    const alertsCollection = await getCollection(COLLECTIONS.ALERTS);

    if (action === "toggle") {
      const { symbol, min_price, max_price, enabled } = alertUpdate;

      const result = await alertsCollection.updateOne(
        { symbol, min_price, max_price },
        { $set: { enabled } }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, error: "Alert not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Alert updated successfully",
      });
    }

    if (action === "trigger") {
      const { symbol, min_price, max_price, trigger } = alertUpdate;

      const result = await alertsCollection.updateOne(
        { symbol, min_price, max_price },
        { $set: { trigger } }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, error: "Alert not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Alert trigger updated successfully",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating alert:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update alert" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { symbol, min_price, max_price } = await request.json();

    const alertsCollection = await getCollection(COLLECTIONS.ALERTS);

    const result = await alertsCollection.deleteOne({
      symbol,
      min_price,
      max_price,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Alert not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Alert deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting alert:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete alert" },
      { status: 500 }
    );
  }
}


