import Link from "next/link";
import { UserProfile } from "@clerk/nextjs";
import { ChevronLeft } from "lucide-react";

import { clerkFormAppearance } from "../../../../components/auth/clerkFormAppearance";
import StoreShell from "../../../../components/store/StoreShell";
import { isClerkServerConfigured } from "../../../../lib/clerkConfig";

export default function AccountSecurityPage() {
  const configured = isClerkServerConfigured();
  return (
    <StoreShell>
      <div className="acct acct-security shop-container">
        <Link href="/mi-cuenta" className="acct-back"><ChevronLeft size={15} aria-hidden="true" />Mi cuenta</Link>
        <header className="acct-head">
          <h1>Seguridad y acceso</h1>
          <p>
            {configured
              ? "Cambia tu correo, tu forma de entrar o cierra sesión en otros dispositivos."
              : "Esta sección estará disponible cuando el acceso de cuentas esté activo."}
          </p>
        </header>
        {configured ? <UserProfile path="/mi-cuenta/seguridad" routing="path" appearance={clerkFormAppearance} /> : null}
      </div>
    </StoreShell>
  );
}
