import { NextRequest, NextResponse } from "next/server";
import { getCollection, COLLECTIONS } from "@/lib/mongodb";
import { Portfolio, PortfolioSummary, Trade, Price } from "@/types";

export async function GET() {
  try {
    const tradesCollection = await getCollection(COLLECTIONS.TRADES);
    const pricesCollection = await getCollection(COLLECTIONS.PRICES);

    // Get all trades
    const trades = (await tradesCollection
      .find({})
      .toArray()) as unknown as Trade[];

    if (trades.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          portfolio: [],
          summary: {
            total_investment: 0,
            total_market_value: 0,
            total_unrealized_pl: 0,
            total_percent_updown: 0,
            realized_profit: 0,
          },
        },
      });
    }

    // Get portfolio symbols and calculate holdings correctly
    const symbolData = new Map<
      string,
      {
        netQuantity: number;
        totalBuyQuantity: number;
        totalBuyCost: number;
      }
    >();

    trades.forEach((trade) => {
      const current = symbolData.get(trade.symbol) || {
        netQuantity: 0,
        totalBuyQuantity: 0,
        totalBuyCost: 0,
      };

      if (trade.trade_type === "Buy") {
        current.netQuantity += trade.quantity;
        current.totalBuyQuantity += trade.quantity;
        current.totalBuyCost += trade.quantity * trade.price;
      } else if (trade.trade_type === "Sell") {
        current.netQuantity -= trade.quantity;
        // Don't modify buy totals for sells
      }

      symbolData.set(trade.symbol, current);
    });

    // Filter symbols with positive holdings
    const portfolioSymbols = Array.from(symbolData.entries())
      .filter(([_, data]) => data.netQuantity > 0)
      .map(([symbol]) => symbol);

    if (portfolioSymbols.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          portfolio: [],
          summary: {
            total_investment: 0,
            total_market_value: 0,
            total_unrealized_pl: 0,
            total_percent_updown: 0,
            realized_profit: 0,
          },
        },
      });
    }

    // Get latest prices for portfolio symbols
    const latestPrices = new Map<string, Price>();

    const pricesPipeline = [
      { $match: { symbol: { $in: portfolioSymbols } } },
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

    const latestPricesResult = await pricesCollection
      .aggregate(pricesPipeline)
      .toArray();
    (latestPricesResult as any[]).forEach((priceDoc) => {
      latestPrices.set(priceDoc.symbol, {
        symbol: priceDoc.symbol,
        price: priceDoc.price,
        change_value: priceDoc.change_value,
        percentage: priceDoc.percentage,
        direction: priceDoc.direction,
        fetched_at: priceDoc.last_update,
      });
    });

    // Calculate portfolio
    const portfolio: Portfolio[] = [];
    let totalInvestment = 0;
    let totalMarketValue = 0;
    let totalUnrealizedPL = 0;

    portfolioSymbols.forEach((symbol) => {
      const data = symbolData.get(symbol)!;
      const latestPrice = latestPrices.get(symbol);

      // Calculate average buy price correctly (Python logic)
      const avgBuyPrice =
        data.totalBuyQuantity > 0
          ? data.totalBuyCost / data.totalBuyQuantity
          : 0;

      // Investment is average buy price * current net holdings
      const investment = avgBuyPrice * data.netQuantity;

      const marketValue = latestPrice
        ? latestPrice.price * data.netQuantity
        : 0;

      const unrealizedPL = latestPrice
        ? (latestPrice.price - avgBuyPrice) * data.netQuantity
        : 0;

      const percentUpDown =
        latestPrice && avgBuyPrice > 0
          ? ((latestPrice.price - avgBuyPrice) / avgBuyPrice) * 100
          : 0;

      totalInvestment += investment;
      totalMarketValue += marketValue;
      totalUnrealizedPL += unrealizedPL;

      portfolio.push({
        symbol,
        shares_held: Math.round(data.netQuantity),
        avg_buy_price: avgBuyPrice,
        latest_price: latestPrice?.price || null,
        change_percentage: latestPrice?.percentage || null,
        market_value: marketValue,
        investment,
        percent_updown: percentUpDown,
        unrealized_pl: unrealizedPL,
        last_update: latestPrice?.fetched_at || null,
      });
    });

    // Calculate realized profit using FIFO
    const realizedProfit = calculateRealizedProfit(trades);

    const totalPercentUpDown =
      totalInvestment > 0
        ? ((totalMarketValue - totalInvestment) / totalInvestment) * 100
        : 0;

    const summary: PortfolioSummary = {
      total_investment: totalInvestment,
      total_market_value: totalMarketValue,
      total_unrealized_pl: totalUnrealizedPL,
      total_percent_updown: totalPercentUpDown,
      realized_profit: realizedProfit,
    };

    return NextResponse.json({
      success: true,
      data: {
        portfolio,
        summary,
      },
    });
  } catch (error) {
    console.error("Error calculating portfolio:", error);
    return NextResponse.json(
      { success: false, error: "Failed to calculate portfolio" },
      { status: 500 }
    );
  }
}

function calculateRealizedProfit(trades: Trade[]): number {
  let realized = 0;
  const symbols = [...new Set(trades.map((t) => t.symbol))];

  symbols.forEach((symbol) => {
    const symbolTrades = trades
      .filter((t) => t.symbol === symbol)
      .sort(
        (a, b) =>
          new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime()
      );

    // FIFO buy queue: [quantity_remaining, price]
    const buyQueue: Array<[number, number]> = [];

    symbolTrades.forEach((trade) => {
      if (trade.trade_type === "Buy") {
        buyQueue.push([trade.quantity, trade.price]);
      } else if (trade.trade_type === "Sell") {
        let qtyToSell = trade.quantity;
        const sellPrice = trade.price;

        // FIFO: match sell to earliest buys
        while (qtyToSell > 0 && buyQueue.length > 0) {
          const [buyQty, buyPrice] = buyQueue[0];
          const matchedQty = Math.min(qtyToSell, buyQty);

          realized += (sellPrice - buyPrice) * matchedQty;

          buyQueue[0][0] -= matchedQty;
          qtyToSell -= matchedQty;

          if (buyQueue[0][0] === 0) {
            buyQueue.shift();
          }
        }
      }
    });
  });

  return realized;
}
