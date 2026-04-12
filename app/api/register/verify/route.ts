import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerVerificationSchema } from "@/lib/validation";

function getSignupIdentifier(email: string) {
  return `signup:${email}`;
}

export async function POST(request: Request) {
  const body = await request.json();

  const validatedFields = registerVerificationSchema.safeParse(body);

  if (!validatedFields.success) {
    return NextResponse.json(
      {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Enter the verification code we sent to your email.",
      },
      { status: 400 },
    );
  }

  const email = validatedFields.data.email.toLowerCase();
  const identifier = getSignupIdentifier(email);
  const tokens = await prisma.verificationToken.findMany({
    where: {
      identifier,
      expires: {
        gt: new Date(),
      },
    },
    orderBy: {
      expires: "desc",
    },
  });

  const matchingToken = tokens.find((item) =>
    item.token.startsWith(`${validatedFields.data.code}:`),
  );

  if (!matchingToken) {
    return NextResponse.json(
      {
        message: "The verification code is invalid or expired.",
      },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  });

  if (!user) {
    return NextResponse.json(
      {
        message: "No pending account was found for this email.",
      },
      { status: 404 },
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
      },
    }),
    prisma.verificationToken.deleteMany({
      where: {
        identifier,
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    message: "Email verified successfully.",
  });
}
