import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { consumePasswordResetToken } from "@/lib/password-reset";
import { resetPasswordSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const token = typeof body.token === "string" ? body.token : "";

  if (!token) {
    return NextResponse.json(
      { message: "Reset token is missing." },
      { status: 400 },
    );
  }

  const validatedFields = resetPasswordSchema.safeParse({
    password: body.password,
  });

  if (!validatedFields.success) {
    return NextResponse.json(
      {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Password does not meet the requirements.",
      },
      { status: 400 },
    );
  }

  const passwordHash = await hash(validatedFields.data.password, 12);
  const success = await consumePasswordResetToken(token, passwordHash);

  if (!success) {
    return NextResponse.json(
      {
        message: "Reset link is invalid or expired.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
  });
}
