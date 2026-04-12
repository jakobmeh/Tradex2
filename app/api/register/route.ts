import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { randomInt, randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendSignupVerificationEmail } from "@/lib/mail";
import { registerSchema } from "@/lib/validation";

function getSignupIdentifier(email: string) {
  return `signup:${email}`;
}

function createVerificationCode() {
  return String(randomInt(100000, 1000000));
}

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
    select: { id: true, emailVerified: true },
  });

  if (existingUser?.emailVerified) {
    return NextResponse.json(
      {
        message: "An account with this email already exists.",
      },
      { status: 409 },
    );
  }

  const hashedPassword = await hash(validatedFields.data.password, 12);
  const code = createVerificationCode();
  const identifier = getSignupIdentifier(email);

  await prisma.$transaction(async (tx) => {
    if (existingUser) {
      await tx.user.update({
        where: { id: existingUser.id },
        data: {
          name: validatedFields.data.name,
          password: hashedPassword,
        },
      });
    } else {
      await tx.user.create({
        data: {
          name: validatedFields.data.name,
          email,
          password: hashedPassword,
        },
      });
    }

    await tx.verificationToken.deleteMany({
      where: {
        identifier,
      },
    });

    await tx.verificationToken.create({
      data: {
        identifier,
        token: `${code}:${randomUUID()}`,
        expires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
  });

  try {
    await sendSignupVerificationEmail({
      email,
      name: validatedFields.data.name,
      code,
    });
  } catch (error) {
    console.error("Signup verification email failed", error);

    return NextResponse.json(
      {
        message: "Could not send the verification email right now.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "We sent a 6-digit verification code to your email.",
  });
}
