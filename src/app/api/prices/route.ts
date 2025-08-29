import { NextRequest, NextResponse } from "next/server";
import { getCollection, COLLECTIONS } from "@/lib/mongodb";
import { Price } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get("symbols")?.split(",") || [];
    const latest = searchParams.get("latest") === "true";

    const pricesCollection = await getCollection(COLLECTIONS.PRICES);

    let query: any = {};
    if (symbols.length > 0) {
      query.symbol = { $in: symbols };
    }

    let prices: Price[];

    if (latest) {
      // Get latest price for each symbol
      const pipeline = [
        { $match: query },
        { $sort: { fetched_at: -1 } },
        {
          $group: {
            _id: "$symbol",
            symbol: { $first: "$symbol" },
            price: { $first: "$price" },
            change_value: { $first: "$change_value" },
            percentage: { $first: "$percentage" },
            direction: { $first: "$direction" },
            last_update: { $first: "$fetched_at" },
          },
        },
      ];

      const result = await pricesCollection.aggregate(pipeline).toArray();
      prices = result.map((doc) => ({
        symbol: doc.symbol,
        price: doc.price,
        change_value: doc.change_value,
        percentage: doc.percentage,
        direction: doc.direction,
        fetched_at: doc.last_update,
      }));
    } else {
      // Get all price history
      prices = await pricesCollection
        .find(query)
        .sort({ fetched_at: -1 })
        .limit(1000)
        .toArray();
    }

    return NextResponse.json({
      success: true,
      data: prices,
    });
  } catch (error) {
    console.error("Error fetching prices:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch prices" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const priceData: Omit<Price, "_id"> = await request.json();

    const pricesCollection = await getCollection(COLLECTIONS.PRICES);

    // Add timestamp
    const price: Omit<Price, "_id"> = {
      ...priceData,
      fetched_at: new Date().toISOString(),
    };

    const result = await pricesCollection.insertOne(price);

    return NextResponse.json({
      success: true,
      data: { ...price, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Error saving price:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save price" },
      { status: 500 }
    );
  }
}


