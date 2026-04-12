import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .regex(/[a-zA-Z]/, "Password must include at least one letter.")
  .regex(/[0-9]/, "Password must include at least one number.");

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address.").trim(),
  password: z.string().min(1, "Password is required."),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters long.")
    .max(50, "Name is too long.")
    .trim(),
  email: z.string().email("Enter a valid email address.").trim(),
  password: passwordSchema,
});

export const registerVerificationSchema = z.object({
  email: z.string().email("Enter a valid email address.").trim(),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit verification code."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address.").trim(),
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});

export type AuthActionState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    code?: string[];
  };
  message?: string;
};

export const initialAuthActionState: AuthActionState = {};
