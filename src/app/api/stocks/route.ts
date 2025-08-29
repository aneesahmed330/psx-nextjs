import { NextRequest, NextResponse } from "next/server";
import { getCollection, COLLECTIONS } from "@/lib/mongodb";
import { Stock } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbolsOnly = searchParams.get("symbolsOnly") === "true";

    const stocksCollection = await getCollection(COLLECTIONS.STOCKS);

    let projection = {};
    if (symbolsOnly) {
      projection = { symbol: 1, _id: 0 };
    }

    const stocks = await stocksCollection.find({}, { projection }).toArray();

    return NextResponse.json({
      success: true,
      data: stocks,
    });
  } catch (error) {
    console.error("Error fetching stocks:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stocks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { symbol } = await request.json();

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: "Symbol is required" },
        { status: 400 }
      );
    }

    const stocksCollection = await getCollection(COLLECTIONS.STOCKS);

    const stock: Omit<Stock, "_id"> = {
      symbol: symbol.toUpperCase(),
      payouts: [],
      financials: { annual: [], quarterly: [] },
      ratios: [],
    };

    const result = await stocksCollection.updateOne(
      { symbol: symbol.toUpperCase() },
      { $setOnInsert: stock },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      data: { ...stock, _id: result.upsertedId },
    });
  } catch (error) {
    console.error("Error saving stock:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save stock" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { symbol } = await request.json();

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: "Symbol is required" },
        { status: 400 }
      );
    }

    const stocksCollection = await getCollection(COLLECTIONS.STOCKS);

    const result = await stocksCollection.deleteOne({
      symbol: symbol.toUpperCase(),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Stock not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Stock deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting stock:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete stock" },
      { status: 500 }
    );
  }
}


