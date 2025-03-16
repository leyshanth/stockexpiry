import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { stringify } from "csv-stringify/sync";
import { format } from "date-fns";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      "SELECT * FROM deleted_expiry WHERE user_id = $1 ORDER BY deleted_at DESC",
      [session.user.id]
    );

    // Format data for CSV
    const formattedData = result.rows.map(item => ({
      "Item Name": item.item_name,
      "Barcode": item.barcode,
      "Quantity": item.quantity,
      "Expiry Date": format(new Date(item.expiry_date), "yyyy-MM-dd"),
      "Deleted At": format(new Date(item.deleted_at), "yyyy-MM-dd HH:mm:ss")
    }));

    // Generate CSV
    const csv = stringify(formattedData, {
      header: true,
      columns: ["Item Name", "Barcode", "Quantity", "Expiry Date", "Deleted At"]
    });

    // Return CSV as a downloadable file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="deleted-items-${format(new Date(), "yyyy-MM-dd")}.csv"`
      }
    });
  } catch (error) {
    console.error("Error exporting deleted items:", error);
    return NextResponse.json(
      { error: "Failed to export deleted items" },
      { status: 500 }
    );
  }
} 