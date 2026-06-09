import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const address = await prisma.address.findUnique({
      where: {
        id,
      },
    });

    return Response.json(address);
  } catch (error) {
    return new Response("Error fetching address", { status: 500 });
  }
}