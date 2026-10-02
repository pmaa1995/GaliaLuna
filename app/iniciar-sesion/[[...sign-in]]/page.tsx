import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

import AuthPage from "../../../components/auth/AuthPage";
import { clerkFormAppearance } from "../../../components/auth/clerkFormAppearance";

export const metadata: Metadata = { title: "Iniciar sesión" };

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SignInPage() {
  return (
    <AuthPage mode="sign-in" enabled={clerkEnabled}>
      <SignIn path="/iniciar-sesion" routing="path" signUpUrl="/registrarse" fallbackRedirectUrl="/mi-cuenta" appearance={clerkFormAppearance} />
    </AuthPage>
  );
}
