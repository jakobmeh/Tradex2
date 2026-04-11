import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json();

  const validatedFields = registerSchema.safeParse(body);

  if (!validatedFields.success) {
    return NextResponse.json(
      {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Check the highlighted fields and try again.",
      },
      { status: 400 },
    );
  }

  const email = validatedFields.data.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return NextResponse.json(
      {
        message: "An account with this email already exists.",
      },
      { status: 409 },
    );
  }

  const hashedPassword = await hash(validatedFields.data.password, 12);

  await prisma.user.create({
    data: {
      name: validatedFields.data.name,
      email,
      password: hashedPassword,
    },
  });

  return NextResponse.json({ ok: true });
}
