import { z } from "zod";

// Schema per la registrazione
export const signUpSchema = z.object({
  email: z
    .string()
    .email("Inserisci un'email valida")
    .min(1, "L'email è obbligatoria"),
  password: z
    .string()
    .min(8, "La password deve essere lunga almeno 8 caratteri")
    .regex(/[A-Z]/, "La password deve contenere almeno una lettera maiuscola")
    .regex(/[a-z]/, "La password deve contenere almeno una lettera minuscola")
    .regex(/[0-9]/, "La password deve contenere almeno un numero")
    .regex(
      /[^A-Za-z0-9]/,
      "La password deve contenere almeno un carattere speciale",
    ),
  confirmPassword: z.string().min(1, "Conferma la password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non corrispondono",
  path: ["confirmPassword"],
});

// Schema per il login
export const signInSchema = z.object({
  email: z
    .string()
    .email("Inserisci un'email valida")
    .min(1, "L'email è obbligatoria"),
  password: z
    .string()
    .min(1, "La password è obbligatoria"),
});

// Schema per la verifica OTP
export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "Il codice OTP deve essere di 6 caratteri")
    .regex(/^\d+$/, "Il codice OTP deve contenere solo numeri"),
});

// Tipi TypeScript derivati dagli schemi
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type OtpFormData = z.infer<typeof otpSchema>;
