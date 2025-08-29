import { NextRequest, NextResponse } from "next/server";
import { getCollection, COLLECTIONS } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get("symbols");
    const days = parseInt(searchParams.get("days") || "7");
    const source = searchParams.get("source") || "both";

    if (!symbols) {
      return NextResponse.json(
        { success: false, error: "Symbols parameter is required" },
        { status: 400 }
      );
    }

    const symbolList = symbols.split(",");
    const pricesCollection = await getCollection(COLLECTIONS.PRICES);
    const performanceData = [];

    for (const symbol of symbolList) {
      const rowData: any = { Symbol: symbol };

      // Get recent records for this symbol
      const recentDocs = await pricesCollection
        .find({ symbol: symbol })
        .sort({ fetched_at: -1 })
        .limit(1000)
        .toArray();

      if (recentDocs.length > 0) {
        // Group by date and keep only the latest record per date (excluding weekends)
        const dateRecords: { [key: string]: any[] } = {};

        for (const doc of recentDocs) {
          const fetchedAt = doc.fetched_at;
          if (fetchedAt) {
            let dateStr: string;
            let weekday: number;

            if (typeof fetchedAt === "string") {
              try {
                const dt = new Date(fetchedAt.replace("Z", "+00:00"));
                dateStr = dt.toISOString().split("T")[0];
                weekday = dt.getDay(); // Sunday=0, Saturday=6
              } catch {
                dateStr = fetchedAt.substring(0, 10);
                const dateObj = new Date(dateStr);
                weekday = dateObj.getDay();
              }
            } else {
              const dt = new Date(fetchedAt);
              dateStr = dt.toISOString().split("T")[0];
              weekday = dt.getDay();
            }

            // Skip weekends (Saturday=5, Sunday=0)
            if (weekday === 0 || weekday === 6) {
              continue;
            }

            if (!dateRecords[dateStr]) {
              dateRecords[dateStr] = [];
            }
            dateRecords[dateStr].push(doc);
          }
        }

        // For each date, find the record with the latest timestamp
        const finalDateRecords: { [key: string]: any } = {};
        for (const [dateStr, docsForDate] of Object.entries(dateRecords)) {
          if (docsForDate.length > 0) {
            const latestDoc = docsForDate.reduce((latest, current) => {
              return new Date(current.fetched_at) > new Date(latest.fetched_at)
                ? current
                : latest;
            });
            finalDateRecords[dateStr] = latestDoc;
          }
        }

        // Sort dates and take the last N unique trading days
        const allDates = Object.keys(finalDateRecords).sort().reverse();
        const sortedDates = allDates.slice(0, days).reverse(); // Oldest to newest for display

        // Extract percentages for each unique date
        for (const dateStr of sortedDates) {
          const doc = finalDateRecords[dateStr];
          const percentage = doc.percentage || "0%";

          // Clean percentage string and convert to float
          let pctValue: number | null = null;
          if (typeof percentage === "string") {
            const cleanPct = percentage.replace("%", "").trim();
            try {
              pctValue = parseFloat(cleanPct);
            } catch {
              pctValue = null;
            }
          } else {
            pctValue = typeof percentage === "number" ? percentage : null;
          }

          // Format date for display (e.g., "Aug 25")
          try {
            const dateObj = new Date(dateStr);
            const displayDate = dateObj.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            rowData[displayDate] = pctValue;
          } catch {
            rowData[dateStr] = pctValue;
          }
        }

        // Calculate net change by summing all daily percentage changes
        const dailyPercentages: number[] = [];
        for (const dateStr of sortedDates) {
          const doc = finalDateRecords[dateStr];
          const percentage = doc.percentage || "0%";

          if (typeof percentage === "string") {
            const cleanPct = percentage.replace("%", "").trim();
            try {
              const pctValue = parseFloat(cleanPct);
              if (!isNaN(pctValue)) {
                dailyPercentages.push(pctValue);
              }
            } catch {
              // Skip invalid percentages
            }
          } else if (typeof percentage === "number") {
            dailyPercentages.push(percentage);
          }
        }

        // Sum all daily percentages for net change
        if (dailyPercentages.length > 0) {
          const netChange = dailyPercentages.reduce((sum, pct) => sum + pct, 0);
          rowData["_net_change"] = netChange;
        } else {
          rowData["_net_change"] = null;
        }
      } else {
        // No data for this symbol
        rowData["_net_change"] = null;
      }

      performanceData.push(rowData);
    }

    // Create DataFrame-like structure and reorder columns
    if (performanceData.length > 0) {
      // Get all columns except Symbol and _net_change
      const dateColumns = Object.keys(performanceData[0]).filter(
        (col) => col !== "Symbol" && col !== "_net_change"
      );

      // Sort date columns chronologically
      dateColumns.sort();

      // Reorder: Symbol, then date columns, then Net Change
      const netChangeCol = `Net Change (${days}d)`;
      const columnOrder = ["Symbol", ...dateColumns, netChangeCol];

      // Rename _net_change to Net Change (Nd)
      performanceData.forEach((row) => {
        row[netChangeCol] = row._net_change;
        delete row._net_change;
      });

      // Reorder columns for each row
      performanceData.forEach((row) => {
        const reorderedRow: any = {};
        columnOrder.forEach((col) => {
          if (row.hasOwnProperty(col)) {
            reorderedRow[col] = row[col];
          }
        });
        Object.assign(row, reorderedRow);
      });
    }

    return NextResponse.json({
      success: true,
      data: performanceData,
    });
  } catch (error) {
    console.error("Error fetching stock performance data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stock performance data" },
      { status: 500 }
    );
  }
}
