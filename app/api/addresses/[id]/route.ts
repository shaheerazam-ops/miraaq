import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type Context = {
  params: {
    id: string;
  };
};

export async function GET(
  req: NextRequest,
  context: Context
) {
  try {
    const { id } = context.params;

    const address = await prisma.address.findUnique({
      where: { id },
    });

    return Response.json(address);
  } catch (error) {
    return new Response("Error fetching address", { status: 500 });
  }
}