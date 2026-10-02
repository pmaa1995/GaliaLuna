import Link from "next/link";
import type { ReactNode } from "react";

import StoreShell from "../store/StoreShell";

interface AuthPageProps {
  mode: "sign-in" | "sign-up";
  enabled: boolean;
  children: ReactNode;
}

// Two quiet columns, as on luxury storefronts: the form, and the way to the other action.
export default function AuthPage({ mode, enabled, children }: AuthPageProps) {
  const signIn = mode === "sign-in";
  return <StoreShell>
    <div className="auth shop-container">
      <div className="auth-grid">
        <section className="auth-form">
          {enabled ? children : <div className="auth-unavailable">
            <h1>{signIn ? "Iniciar sesión" : "Crear cuenta"}</h1>
            <p>El acceso a cuentas estará disponible pronto. Mientras tanto, puedes comprar y confirmar tu pedido por WhatsApp.</p>
          </div>}
        </section>
        <aside className="auth-alt" aria-labelledby="auth-alt-title">
          <h2 id="auth-alt-title">{signIn ? "¿Aún no tienes cuenta?" : "¿Ya tienes cuenta?"}</h2>
          <p>{signIn ? "Guarda tu dirección para comprar más rápido y sigue tus pedidos en un solo lugar." : "Entra para ver tus pedidos y tus datos de entrega."}</p>
          <Link href={signIn ? "/registrarse" : "/iniciar-sesion"} className="auth-button">{signIn ? "Crear cuenta" : "Iniciar sesión"}</Link>
          <p className="auth-guest">¿Solo quieres comprar? No necesitas una cuenta. <Link href="/coleccion">Ver la colección</Link></p>
        </aside>
      </div>
    </div>
  </StoreShell>;
}
