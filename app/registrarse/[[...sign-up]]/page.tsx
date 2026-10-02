import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

import AuthPage from "../../../components/auth/AuthPage";
import { clerkFormAppearance } from "../../../components/auth/clerkFormAppearance";

export const metadata: Metadata = { title: "Crear cuenta" };

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SignUpPage() {
  return (
    <AuthPage mode="sign-up" enabled={clerkEnabled}>
      <SignUp path="/registrarse" routing="path" signInUrl="/iniciar-sesion" fallbackRedirectUrl="/mi-cuenta" appearance={clerkFormAppearance} />
    </AuthPage>
  );
}
