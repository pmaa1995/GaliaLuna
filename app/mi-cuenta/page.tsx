import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  CheckCircle2,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";

import AccountOrderHistoryPanel from "../../components/account/AccountOrderHistoryPanel";
import AccountSignOutButton from "../../components/auth/AccountSignOutButton";
import { isAdminFromClerkUser } from "../../lib/admin/auth";
import {
  CALL_OWNER_NUMBER,
  CALL_PHONE_DISPLAY,
  WHATSAPP_OWNER_NUMBER,
  WHATSAPP_PHONE_DISPLAY,
} from "../../lib/contact";
import { saveAccountProfileAction } from "./actions";

type PageSearchParams = {
  perfil?: string | string[];
  pedido?: string | string[];
};

type DeliveryProfile = {
  deliveryPhone: string;
  alternatePhone: string;
  province: string;
  city: string;
  sector: string;
  addressLine1: string;
  addressLine2: string;
  reference: string;
  deliveryNotes: string;
};

const emptyProfile: DeliveryProfile = {
  deliveryPhone: "",
  alternatePhone: "",
  province: "",
  city: "",
  sector: "",
  addressLine1: "",
  addressLine2: "",
  reference: "",
  deliveryNotes: "",
};

const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readProfileFromMetadata(unsafeMetadata: unknown): DeliveryProfile {
  if (!unsafeMetadata || typeof unsafeMetadata !== "object") return emptyProfile;

  const record = unsafeMetadata as Record<string, unknown>;
  const nested = record.galiaLunaProfile;
  if (!nested || typeof nested !== "object") return emptyProfile;

  const p = nested as Record<string, unknown>;

  return {
    deliveryPhone: asString(p.deliveryPhone),
    alternatePhone: asString(p.alternatePhone),
    province: asString(p.province),
    city: asString(p.city),
    sector: asString(p.sector),
    addressLine1: asString(p.addressLine1),
    addressLine2: asString(p.addressLine2),
    reference: asString(p.reference),
    deliveryNotes: asString(p.deliveryNotes),
  };
}

function getPerfilStatus(searchParams?: PageSearchParams) {
  const raw = searchParams?.perfil;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "guardado" || value === "error") return value;
  return "";
}

function getPedidoCode(searchParams?: PageSearchParams) {
  const raw = searchParams?.pedido;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === "string" ? value.trim() : "";
}

function inputClassName() {
  return "mt-2 h-11 w-full rounded-[12px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] px-3 text-sm text-[color:var(--ink)] outline-none transition placeholder:text-[color:var(--ink-soft)] focus:border-[color:var(--brand-sage)]";
}

function textareaClassName() {
  return "mt-2 w-full rounded-[12px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] px-3 py-2.5 text-sm text-[color:var(--ink)] outline-none transition placeholder:text-[color:var(--ink-soft)] focus:border-[color:var(--brand-sage)]";
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: PageSearchParams;
}) {
  if (!clerkEnabled) {
    return (
      <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[960px] px-4 py-8 sm:px-6 lg:px-8">
        <section className="border border-[color:var(--line)] bg-[color:var(--paper)] p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
            Mi cuenta
          </p>
          <h1 className="mt-3 [font-family:var(--font-playfair)] text-[clamp(2rem,4vw,3rem)] leading-[0.9] tracking-[-0.03em] text-[color:var(--ink)]">
            Acceso de cuenta disponible pronto
          </h1>
          <p className="mt-4 text-sm leading-7 text-[color:var(--ink-soft)]">
            Esta seccion estara disponible muy pronto. Mientras tanto, puedes comprar desde el catalogo y confirmar tu pedido por WhatsApp.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex items-center rounded-full bg-[color:var(--brand-sage)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
            >
              Ir al catalogo
            </Link>
            <Link
              href="/iniciar-sesion"
              className="inline-flex items-center rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
            >
              Iniciar sesion
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const session = await auth();
  if (!session.userId) {
    redirect("/iniciar-sesion");
  }

  const user = await currentUser();
  const perfilStatus = getPerfilStatus(searchParams);

  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? "";
  const firstName = user?.firstName ?? "";
  const lastName = user?.lastName ?? "";
  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") || user?.username || "Cliente";

  const profile = readProfileFromMetadata(user?.unsafeMetadata);
  const isAdmin = isAdminFromClerkUser(user);
  const selectedOrderCode = getPedidoCode(searchParams);

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="border border-[color:var(--line)] bg-[color:var(--paper)] p-5 sm:p-7">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
            Mi cuenta
          </p>
          <h1 className="mt-3 [font-family:var(--font-playfair)] text-[clamp(2rem,4vw,3.4rem)] leading-[0.9] tracking-[-0.03em] text-[color:var(--ink)]">
            Hola, {displayName}
          </h1>
          <p className="mt-4 max-w-[62ch] text-sm leading-7 text-[color:var(--ink-soft)]">
            Guarda tus datos de contacto y entrega para agilizar futuras compras por WhatsApp sin repetir informacion en cada pedido.
          </p>

          {perfilStatus === "guardado" ? (
            <div className="mt-5 rounded-[14px] border border-[color:var(--brand-sage)] bg-[color:var(--bg-soft)] p-4 text-sm text-[color:var(--ink)]">
              Datos de perfil y entrega actualizados correctamente.
            </div>
          ) : null}
          {perfilStatus === "error" ? (
            <div className="mt-5 rounded-[14px] border border-[color:var(--brand-coral)] bg-[color:var(--bg-soft)] p-4 text-sm text-[color:var(--ink)]">
              Completa los campos obligatorios para guardar tus datos.
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[16px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                Correo de acceso
              </p>
              <p className="mt-2 break-all text-sm font-medium text-[color:var(--ink)]">
                {primaryEmail || "No disponible"}
              </p>
            </div>
            <div className="rounded-[16px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                Tu telefono de entrega
              </p>
              <p className="mt-2 text-sm font-medium text-[color:var(--ink)]">
                {profile.deliveryPhone || "Aun no registrado"}
              </p>
              <p className="mt-1 text-xs leading-6 text-[color:var(--ink-soft)]">
                {profile.deliveryPhone
                  ? "Este numero se usa para coordinar la entrega."
                  : `WhatsApp de tienda: ${WHATSAPP_PHONE_DISPLAY}`}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-sage)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Seguir comprando
            </Link>
            <a
              href={`https://wa.me/${WHATSAPP_OWNER_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-coral)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Hablar con asesora
            </a>
            <Link
              href="/mi-cuenta/seguridad"
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)] transition hover:bg-[color:var(--bg-soft)]"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Seguridad y acceso
            </Link>
            {isAdmin ? (
              <Link
                href="/admin/pedidos"
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--brand-sage)]/45 bg-[color:var(--brand-sage)]/12 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)] transition hover:bg-[color:var(--brand-sage)]/20"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Panel admin pedidos
              </Link>
            ) : null}
            <AccountSignOutButton />
          </div>

          <div className="mt-8 border-t border-[color:var(--line)] pt-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--bg-soft)] text-[color:var(--ink)]">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                  Datos de entrega
                </p>
                <p className="text-sm font-medium text-[color:var(--ink)]">
                  Perfil y direccion guardada
                </p>
              </div>
            </div>

            <form action={saveAccountProfileAction} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-[color:var(--ink)]">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                    Nombre *
                  </span>
                  <input
                    name="firstName"
                    required
                    defaultValue={firstName}
                    className={inputClassName()}
                    placeholder="Nombre"
                  />
                </label>
                <label className="block text-sm text-[color:var(--ink)]">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                    Apellido *
                  </span>
                  <input
                    name="lastName"
                    required
                    defaultValue={lastName}
                    className={inputClassName()}
                    placeholder="Apellido"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-[color:var(--ink)]">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                    Telefono de entrega *
                  </span>
                  <input
                    name="deliveryPhone"
                    required
                    defaultValue={profile.deliveryPhone}
                    className={inputClassName()}
                    placeholder="Ej. 809-000-0000"
                  />
                </label>
                <label className="block text-sm text-[color:var(--ink)]">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                    Telefono alterno
                  </span>
                  <input
                    name="alternatePhone"
                    defaultValue={profile.alternatePhone}
                    className={inputClassName()}
                    placeholder="Opcional"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-[color:var(--ink)]">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                    Provincia *
                  </span>
                  <input
                    name="province"
                    required
                    defaultValue={profile.province}
                    className={inputClassName()}
                    placeholder="Santo Domingo"
                  />
                </label>
                <label className="block text-sm text-[color:var(--ink)]">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                    Ciudad / Municipio *
                  </span>
                  <input
                    name="city"
                    required
                    defaultValue={profile.city}
                    className={inputClassName()}
                    placeholder="Santo Domingo Este"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-[color:var(--ink)]">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                    Sector
                  </span>
                  <input
                    name="sector"
                    defaultValue={profile.sector}
                    className={inputClassName()}
                    placeholder="Sector / barrio"
                  />
                </label>
                <label className="block text-sm text-[color:var(--ink)]">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                    Direccion (linea 2)
                  </span>
                  <input
                    name="addressLine2"
                    defaultValue={profile.addressLine2}
                    className={inputClassName()}
                    placeholder="Apto, edificio, nivel (opcional)"
                  />
                </label>
              </div>

              <label className="block text-sm text-[color:var(--ink)]">
                <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                  Direccion principal *
                </span>
                <input
                  name="addressLine1"
                  required
                  defaultValue={profile.addressLine1}
                  className={inputClassName()}
                  placeholder="Calle, numero y direccion base"
                />
              </label>

              <label className="block text-sm text-[color:var(--ink)]">
                <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                  Referencia de entrega
                </span>
                <textarea
                  name="reference"
                  defaultValue={profile.reference}
                  rows={2}
                  className={textareaClassName()}
                  placeholder="Punto de referencia para ubicar la direccion"
                />
              </label>

              <label className="block text-sm text-[color:var(--ink)]">
                <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                  Instrucciones (opcional)
                </span>
                <textarea
                  name="deliveryNotes"
                  defaultValue={profile.deliveryNotes}
                  rows={3}
                  className={textareaClassName()}
                  placeholder="Horario preferido, persona que recibe, indicaciones utiles"
                />
              </label>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-sage)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Guardar datos de entrega
                </button>
                <p className="text-xs leading-6 text-[color:var(--ink-soft)]">
                  Estos datos se usan para coordinar tu entrega y agilizar atencion por WhatsApp.
                </p>
              </div>
            </form>
          </div>
        </section>

        <section className="space-y-6">
          <section className="border border-[color:var(--line)] bg-[color:var(--paper)] p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--bg-soft)] text-[color:var(--ink)]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                  Seguridad
                </p>
                <p className="text-sm font-medium text-[color:var(--ink)]">
                  Acceso seguro
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                "Correo verificado y sesion segura.",
                "La web no necesita guardar tarjetas para cerrar compras por WhatsApp.",
                "Tu cuenta se usa para agilizar contacto, soporte y entrega.",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--brand-sage)]" />
                  <p className="text-sm leading-6 text-[color:var(--ink)]">{item}</p>
                </div>
              ))}
            </div>

            {isAdmin ? (
              <div className="mt-4 rounded-[14px] border border-[color:var(--brand-sage)]/35 bg-[color:var(--brand-sage)]/10 p-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                  Acceso especial
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--ink)]">
                  Tu correo tiene acceso de administracion. Puedes gestionar estados y seguimiento desde el panel interno de pedidos.
                </p>
                <Link
                  href="/admin/pedidos"
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Ir al panel admin
                </Link>
              </div>
            ) : null}
          </section>

          <section className="border border-[color:var(--line)] bg-[color:var(--paper)] p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--bg-soft)] text-[color:var(--ink)]">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                  Soporte
                </p>
                <p className="text-sm font-medium text-[color:var(--ink)]">
                  Atencion y seguimiento por WhatsApp
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-[color:var(--ink-soft)]">
              El soporte y seguimiento se gestionan por WhatsApp con una asesora real. Si no recuerdas tu acceso, puedes volver a entrar con tu correo. Si luego activas contrasena, la podras cambiar desde Seguridad y acceso.
            </p>

            <div className="mt-4 rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                Contacto directo
              </p>
              <p className="mt-2 text-sm font-medium text-[color:var(--ink)]">
                {CALL_PHONE_DISPLAY}
              </p>
              <p className="mt-1 text-xs text-[color:var(--ink-soft)]">
                WhatsApp: {WHATSAPP_PHONE_DISPLAY}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={`https://wa.me/${WHATSAPP_OWNER_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-coral)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Escribir por WhatsApp
                </a>
                <a
                  href={`tel:+${CALL_OWNER_NUMBER}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Llamar
                </a>
              </div>
            </div>
          </section>

          <AccountOrderHistoryPanel
            clerkUserId={session.userId}
            selectedOrderCode={selectedOrderCode || undefined}
          />
        </section>
      </div>
    </main>
  );
}
