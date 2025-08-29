import { NextRequest, NextResponse } from "next/server";
import { getCollection, COLLECTIONS } from "@/lib/mongodb";
import { Trade } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const tradesCollection = await getCollection(COLLECTIONS.TRADES);

    let query: any = {};

    if (symbol && symbol !== "All") {
      query.symbol = symbol;
    }

    if (startDate && endDate) {
      query.trade_date = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const trades = await tradesCollection
      .find(query)
      .sort({ trade_date: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: trades,
    });
  } catch (error) {
    console.error("Error fetching trades:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch trades" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tradeData: Omit<Trade, "_id"> = await request.json();

    // Validate required fields
    if (
      !tradeData.symbol ||
      !tradeData.trade_type ||
      !tradeData.quantity ||
      !tradeData.price
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const tradesCollection = await getCollection(COLLECTIONS.TRADES);

    const trade: Omit<Trade, "_id"> = {
      ...tradeData,
      trade_date:
        tradeData.trade_date || new Date().toISOString().split("T")[0],
    };

    const result = await tradesCollection.insertOne(trade);

    return NextResponse.json({
      success: true,
      data: { ...trade, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Error saving trade:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save trade" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Trade ID is required" },
        { status: 400 }
      );
    }

    const tradesCollection = await getCollection(COLLECTIONS.TRADES);
    const { ObjectId } = await import("mongodb");

    const result = await tradesCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Trade not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Trade deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting trade:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete trade" },
      { status: 500 }
    );
  }
}


