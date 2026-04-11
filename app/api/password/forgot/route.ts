import { NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validation";
import { createPasswordResetRequest } from "@/lib/password-reset";

export async function POST(request: Request) {
  const body = await request.json();
  const validatedFields = forgotPasswordSchema.safeParse(body);

  if (!validatedFields.success) {
    return NextResponse.json(
      {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Enter a valid email address.",
      },
      { status: 400 },
    );
  }

  try {
    await createPasswordResetRequest(validatedFields.data.email);
  } catch (error) {
    console.error("Password reset email failed", error);
    return NextResponse.json(
      {
        message: "Could not send the reset email right now.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message:
      "If an account with that email exists, a password reset link has been sent.",
  });
}
