import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // TODO: handle SafePay webhook logic here
    console.log("SafePay webhook received:", body);

    // Example: verify signature (if SafePay provides one)
    // const signature = req.headers.get("x-safepay-signature");

    return NextResponse.json({
      success: true,
      message: "SafePay webhook received",
    });
  } catch (error) {
    console.error("SafePay webhook error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Invalid webhook payload",
      },
      { status: 400 }
    );
  }
}