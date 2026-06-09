import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // TODO: handle PayFast webhook logic here
    console.log("PayFast webhook received:", body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PayFast webhook error:", error);

    return NextResponse.json(
      { success: false },
      { status: 400 }
    );
  }
}