import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const address = await prisma.address.findUnique({
      where: {
        id: params.id,
      },
    });

    return Response.json(address);
  } catch (error) {
    return new Response("Error fetching address", { status: 500 });
  }
}