import { NextResponse } from "next/server";

// GET /api/export/pdf - PDF export (stub - not yet implemented)
// Full PDF generation will be implemented in a separate task.
export async function GET() {
  return NextResponse.json({ error: "PDF export not yet implemented" }, { status: 501 });
}
