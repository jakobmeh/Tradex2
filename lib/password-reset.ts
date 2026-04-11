import { createHash, randomBytes } from "crypto";
import { addHours } from "date-fns";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mail";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getBaseUrl() {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.AUTH_URL ??
    "http://localhost:3000"
  );
}

export async function createPasswordResetRequest(email: string) {
  const normalizedEmail = email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
    },
  });

  // Do not reveal whether the email exists.
  if (!user?.email || !user.password) {
    return;
  }

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: addHours(new Date(), 1),
    },
  });

  const resetUrl = `${getBaseUrl()}/reset-password?token=${rawToken}`;

  await sendPasswordResetEmail({
    email: user.email,
    name: user.name,
    resetUrl,
  });
}

export async function validatePasswordResetToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);

  const token = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  if (!token) {
    return null;
  }

  if (token.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({
      where: { tokenHash },
    });
    return null;
  }

  return token;
}

export async function consumePasswordResetToken(
  rawToken: string,
  nextPasswordHash: string,
) {
  const token = await validatePasswordResetToken(rawToken);

  if (!token) {
    return false;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: token.userId },
      data: { password: nextPasswordHash },
    }),
    prisma.passwordResetToken.delete({
      where: { tokenHash: token.tokenHash },
    }),
  ]);

  return true;
}
