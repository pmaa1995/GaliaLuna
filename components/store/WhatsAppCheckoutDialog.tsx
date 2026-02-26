"use client";

import { MessageCircle, PackageCheck, UserRound, X } from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import type { CartItem } from "../../store/cartStore";
import { WHATSAPP_OWNER_NUMBER, WHATSAPP_PHONE_DISPLAY } from "../../lib/contact";
import type {
  CheckoutSource,
  CreateWhatsAppOrderResponse,
  WhatsAppOrderCustomerInput,
} from "../../lib/orders/types";
import { formatDOP } from "../../types/product";

type CheckoutFormValues = WhatsAppOrderCustomerInput;

type GaliaLunaUnsafeProfile = {
  deliveryPhone?: string;
  alternatePhone?: string;
  province?: string;
  city?: string;
  sector?: string;
  addressLine1?: string;
  addressLine2?: string;
  reference?: string;
  deliveryNotes?: string;
};

type ClerkLikeUser = {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  username?: string | null;
  primaryEmailAddress?: { emailAddress?: string | null } | null;
  emailAddresses?: Array<{ emailAddress?: string | null }>;
  unsafeMetadata?: unknown;
};

const GUEST_CHECKOUT_STORAGE_KEY = "galia-luna-guest-checkout-v1";

const emptyForm: CheckoutFormValues = {
  fullName: "",
  email: "",
  phone: "",
  province: "",
  city: "",
  sector: "",
  addressLine1: "",
  addressLine2: "",
  reference: "",
  deliveryNotes: "",
};

function textValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readGuestDraft(): CheckoutFormValues {
  if (typeof window === "undefined") return emptyForm;

  try {
    const raw = window.localStorage.getItem(GUEST_CHECKOUT_STORAGE_KEY);
    if (!raw) return emptyForm;
    const parsed = JSON.parse(raw) as Partial<CheckoutFormValues>;

    return {
      fullName: textValue(parsed.fullName),
      email: textValue(parsed.email),
      phone: textValue(parsed.phone),
      province: textValue(parsed.province),
      city: textValue(parsed.city),
      sector: textValue(parsed.sector),
      addressLine1: textValue(parsed.addressLine1),
      addressLine2: textValue(parsed.addressLine2),
      reference: textValue(parsed.reference),
      deliveryNotes: textValue(parsed.deliveryNotes),
    };
  } catch {
    return emptyForm;
  }
}

function saveGuestDraft(values: CheckoutFormValues) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      GUEST_CHECKOUT_STORAGE_KEY,
      JSON.stringify(values),
    );
  } catch {
    // Ignore storage failures to avoid blocking checkout.
  }
}

function readAccountPrefill(user: ClerkLikeUser | null) {
  if (!user) return emptyForm;

  const primaryEmail =
    user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress ?? "";
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.fullName ||
    user.username ||
    "";

  let profile: GaliaLunaUnsafeProfile = {};
  const unsafe = user.unsafeMetadata;
  if (unsafe && typeof unsafe === "object") {
    const nested = (unsafe as Record<string, unknown>).galiaLunaProfile;
    if (nested && typeof nested === "object") {
      profile = nested as GaliaLunaUnsafeProfile;
    }
  }

  return {
    fullName: name,
    email: primaryEmail,
    phone: textValue(profile.deliveryPhone),
    province: textValue(profile.province),
    city: textValue(profile.city),
    sector: textValue(profile.sector),
    addressLine1: textValue(profile.addressLine1),
    addressLine2: textValue(profile.addressLine2),
    reference: textValue(profile.reference),
    deliveryNotes: textValue(profile.deliveryNotes),
  };
}

function readClerkUserFromWindow(): ClerkLikeUser | null {
  if (typeof window === "undefined") return null;

  const win = window as Window & {
    Clerk?: {
      user?: ClerkLikeUser | null;
    };
  };

  return win.Clerk?.user ?? null;
}

function normalizeForm(values: CheckoutFormValues): CheckoutFormValues {
  return {
    fullName: values.fullName.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    province: values.province.trim(),
    city: values.city.trim(),
    sector: values.sector.trim(),
    addressLine1: values.addressLine1.trim(),
    addressLine2: values.addressLine2.trim(),
    reference: values.reference.trim(),
    deliveryNotes: values.deliveryNotes.trim(),
  };
}

function buildOrderMessage({
  items,
  values,
  source,
  signedIn,
  orderCode,
}: {
  items: CartItem[];
  values: CheckoutFormValues;
  source: CheckoutSource;
  signedIn: boolean;
  orderCode?: string | null;
}) {
  const normalized = normalizeForm(values);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemLines = items.map(
    (item) => `- ${item.quantity}x ${item.name} (${formatDOP(item.price)})`,
  );

  const lines = [
    "Hola Galia Luna, quiero confirmar este pedido de la web.",
    ...(orderCode
      ? [`Codigo de pedido web: ${orderCode}`, "Estado inicial: Pendiente de confirmacion"]
      : []),
    "",
    "Productos:",
    ...itemLines,
    `Total estimado: ${formatDOP(total)}`,
    "",
    "Datos de entrega:",
    `Nombre: ${normalized.fullName}`,
    `Telefono: ${normalized.phone}`,
    `Correo: ${normalized.email || "No indicado"}`,
    `Provincia: ${normalized.province}`,
    `Ciudad/Municipio: ${normalized.city}`,
    `Sector: ${normalized.sector || "No indicado"}`,
    `Direccion principal: ${normalized.addressLine1}`,
  ];

  if (normalized.addressLine2) {
    lines.push(`Direccion (linea 2): ${normalized.addressLine2}`);
  }
  if (normalized.reference) {
    lines.push(`Referencia: ${normalized.reference}`);
  }
  if (normalized.deliveryNotes) {
    lines.push(`Instrucciones: ${normalized.deliveryNotes}`);
  }

  lines.push(
    "",
    `Origen: ${source === "cart" ? "Pedido desde carrito web" : "Compra directa de pieza"}`,
    `Cuenta web: ${signedIn ? "Si" : "No (invitado)"}`,
    "Por favor confirmame disponibilidad, forma de pago y entrega.",
  );

  return lines.join("\n");
}

async function saveOrderBeforeWhatsApp({
  items,
  values,
  source,
}: {
  items: CartItem[];
  values: CheckoutFormValues;
  source: CheckoutSource;
}): Promise<CreateWhatsAppOrderResponse | null> {
  try {
    const response = await fetch("/api/orders/whatsapp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          quantity: item.quantity,
          currency: item.currency,
          imageUrl: item.imageUrl,
        })),
        customer: values,
      }),
    });

    const data = (await response.json()) as CreateWhatsAppOrderResponse;
    return data;
  } catch (error) {
    console.error("No se pudo registrar el pedido antes de WhatsApp", error);
    return null;
  }
}

function fieldClassName() {
  return "mt-2 h-11 w-full rounded-[12px] border border-[color:var(--line)] bg-[color:var(--paper)] px-3 text-sm text-[color:var(--ink)] outline-none transition placeholder:text-[color:var(--ink-soft)] focus:border-[color:var(--brand-sage)]";
}

function textareaClassName() {
  return "mt-2 w-full rounded-[12px] border border-[color:var(--line)] bg-[color:var(--paper)] px-3 py-2.5 text-sm text-[color:var(--ink)] outline-none transition placeholder:text-[color:var(--ink-soft)] focus:border-[color:var(--brand-sage)]";
}

interface WhatsAppCheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  source: CheckoutSource;
  onSubmitted?: () => void;
}

export default function WhatsAppCheckoutDialog({
  open,
  onClose,
  items,
  source,
  onSubmitted,
}: WhatsAppCheckoutDialogProps) {
  const [formValues, setFormValues] = useState<CheckoutFormValues>(emptyForm);
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  useEffect(() => {
    if (!open) return;

    const clerkUser = readClerkUserFromWindow();
    const prefill = clerkUser ? readAccountPrefill(clerkUser) : readGuestDraft();
    setFormValues(prefill);
    setSignedIn(Boolean(clerkUser));
    setError("");
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const updateField =
    (key: keyof CheckoutFormValues) =>
    (
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      const value = event.target.value;
      setFormValues((current) => ({ ...current, [key]: value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalized = normalizeForm(formValues);
    const missingRequired = [
      ["nombre", normalized.fullName],
      ["telefono", normalized.phone],
      ["provincia", normalized.province],
      ["ciudad/municipio", normalized.city],
      ["direccion principal", normalized.addressLine1],
    ].find(([, value]) => !value);

    if (items.length === 0) {
      setError("No hay productos en el pedido.");
      return;
    }

    if (missingRequired) {
      setError(`Completa ${missingRequired[0]} para continuar.`);
      return;
    }

    if (!signedIn) {
      saveGuestDraft(normalized);
    }

    // Open the tab synchronously from the click event so browsers don't block it
    // after the async order-save request completes.
    const whatsappTab =
      typeof window !== "undefined"
        ? window.open("", "_blank", "noopener,noreferrer")
        : null;

    setIsSubmitting(true);
    const saveResult = await saveOrderBeforeWhatsApp({
      items,
      values: normalized,
      source,
    });

    const message = buildOrderMessage({
      items,
      values: normalized,
      source,
      signedIn,
      orderCode: saveResult?.orderCode,
    });

    const url = `https://wa.me/${WHATSAPP_OWNER_NUMBER}?text=${encodeURIComponent(message)}`;

    if (whatsappTab) {
      try {
        whatsappTab.location.href = url;
      } catch {
        window.location.assign(url);
      }
    } else {
      // Fallback for popup-blocked browsers.
      window.location.assign(url);
    }
    setIsSubmitting(false);
    onSubmitted?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-[color:var(--ink)]/28 px-3 py-4 backdrop-blur-[2px] sm:px-6 sm:py-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Confirmar pedido por WhatsApp"
        className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-[1080px] flex-col overflow-hidden border border-[color:var(--line-strong)] bg-[color:var(--panel)] shadow-[0_28px_70px_rgba(43,42,40,0.18)] sm:max-h-[calc(100vh-4rem)]"
      >
        <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-[color:var(--brand-coral)]/18 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-44 w-44 rounded-full bg-[color:var(--brand-sage)]/16 blur-3xl" />

        <header className="relative z-10 flex items-start justify-between gap-3 border-b border-[color:var(--line)] bg-[color:var(--paper)]/85 px-4 py-4 sm:px-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
              Confirmar pedido
            </p>
            <h2 className="mt-1 [font-family:var(--font-playfair)] text-[1.65rem] leading-[0.95] tracking-[-0.02em] text-[color:var(--ink)] sm:text-[1.9rem]">
              WhatsApp con datos completos
            </h2>
            <p className="mt-1 text-xs text-[color:var(--ink-soft)]">
              {signedIn
                ? "Revisa tus datos de entrega y envia el pedido sin repetir informacion."
                : "Completa tus datos una vez para enviar el pedido sin tantas preguntas por chat."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar confirmacion de pedido"
            className="inline-flex h-9 w-9 items-center justify-center border border-[color:var(--line)] bg-[color:var(--paper)] text-[color:var(--ink)] transition hover:bg-[color:var(--bg-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="relative z-10 grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
          <section className="min-h-0 overflow-y-auto border-b border-[color:var(--line)] bg-[color:var(--paper)] p-4 sm:p-5 lg:border-b-0 lg:border-r">
            <div className="grid gap-4">
              <div className="rounded-[16px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">
                <div className="flex items-center gap-2 text-[color:var(--ink)]">
                  <PackageCheck className="h-4 w-4" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                    Resumen del pedido
                  </p>
                </div>

                <ul className="mt-3 space-y-2">
                  {items.map((item) => (
                    <li
                      key={`${item.id}-${item.quantity}`}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-[color:var(--ink)]">
                          {item.quantity}x {item.name}
                        </p>
                        <p className="text-xs text-[color:var(--ink-soft)]">
                          {item.category}
                        </p>
                      </div>
                      <p className="shrink-0 text-[color:var(--ink)]">
                        {formatDOP(item.price * item.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 border-t border-[color:var(--line)] pt-3">
                  <div className="flex items-center justify-between text-sm font-semibold text-[color:var(--ink)]">
                    <span>Total estimado</span>
                    <span>{formatDOP(total)}</span>
                  </div>
                  <p className="mt-1 text-xs leading-6 text-[color:var(--ink-soft)]">
                    El pago y la confirmacion final se coordinan por WhatsApp con una asesora.
                  </p>
                </div>
              </div>

              <div className="rounded-[16px] border border-[color:var(--line)] bg-[color:var(--paper)] p-4">
                <div className="flex items-center gap-2 text-[color:var(--ink)]">
                  <UserRound className="h-4 w-4" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                    {signedIn ? "Cuenta detectada" : "Compra sin cuenta"}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-7 text-[color:var(--ink-soft)]">
                  {signedIn
                    ? "Tomamos tus datos guardados de la cuenta para agilizar la entrega. Puedes editarlos antes de enviar."
                    : "Puedes pedir sin cuenta. Guardaremos estos datos en este dispositivo para que no tengas que escribirlos otra vez."}
                </p>
                {!signedIn ? (
                  <div className="mt-3 rounded-[12px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-3">
                    <p className="text-xs leading-6 text-[color:var(--ink-soft)]">
                      WhatsApp de soporte: {WHATSAPP_PHONE_DISPLAY}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="min-h-0 overflow-y-auto bg-[color:var(--paper)] p-4 sm:p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-[color:var(--ink)] sm:col-span-2">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                    Nombre completo *
                  </span>
                  <input
                    value={formValues.fullName}
                    onChange={updateField("fullName")}
                    className={fieldClassName()}
                    placeholder="Nombre y apellido"
                    autoComplete="name"
                    required
                  />
                </label>

                <label className="block text-sm text-[color:var(--ink)]">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                    Telefono *
                  </span>
                  <input
                    value={formValues.phone}
                    onChange={updateField("phone")}
                    className={fieldClassName()}
                    placeholder="Ej. 809-000-0000"
                    autoComplete="tel"
                    required
                  />
                </label>

                <label className="block text-sm text-[color:var(--ink)]">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                    Correo
                  </span>
                  <input
                    value={formValues.email}
                    onChange={updateField("email")}
                    className={fieldClassName()}
                    placeholder="correo@ejemplo.com"
                    autoComplete="email"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-[color:var(--ink)]">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                    Provincia *
                  </span>
                  <input
                    value={formValues.province}
                    onChange={updateField("province")}
                    className={fieldClassName()}
                    placeholder="Santo Domingo"
                    required
                  />
                </label>

                <label className="block text-sm text-[color:var(--ink)]">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                    Ciudad / Municipio *
                  </span>
                  <input
                    value={formValues.city}
                    onChange={updateField("city")}
                    className={fieldClassName()}
                    placeholder="Santo Domingo Este"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-[color:var(--ink)]">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                    Sector
                  </span>
                  <input
                    value={formValues.sector}
                    onChange={updateField("sector")}
                    className={fieldClassName()}
                    placeholder="Sector / barrio"
                  />
                </label>

                <label className="block text-sm text-[color:var(--ink)]">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                    Direccion (linea 2)
                  </span>
                  <input
                    value={formValues.addressLine2}
                    onChange={updateField("addressLine2")}
                    className={fieldClassName()}
                    placeholder="Apto, edificio, nivel"
                  />
                </label>
              </div>

              <label className="block text-sm text-[color:var(--ink)]">
                <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                  Direccion principal *
                </span>
                <input
                  value={formValues.addressLine1}
                  onChange={updateField("addressLine1")}
                  className={fieldClassName()}
                  placeholder="Calle, numero y direccion base"
                  required
                />
              </label>

              <label className="block text-sm text-[color:var(--ink)]">
                <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                  Referencia
                </span>
                <textarea
                  value={formValues.reference}
                  onChange={updateField("reference")}
                  rows={2}
                  className={textareaClassName()}
                  placeholder="Punto de referencia para ubicar la entrega"
                />
              </label>

              <label className="block text-sm text-[color:var(--ink)]">
                <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                  Instrucciones (opcional)
                </span>
                <textarea
                  value={formValues.deliveryNotes}
                  onChange={updateField("deliveryNotes")}
                  rows={2}
                  className={textareaClassName()}
                  placeholder="Horario preferido, quien recibe, indicaciones utiles"
                />
              </label>

              {error ? (
                <div className="rounded-[12px] border border-[color:var(--brand-coral)]/45 bg-[color:var(--brand-coral)]/12 px-3 py-2 text-sm text-[color:var(--ink)]">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)] transition hover:bg-[color:var(--bg-soft)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--brand-coral)]/35 bg-[color:var(--brand-coral)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)] transition hover:brightness-95"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  {isSubmitting ? "Preparando pedido..." : "Enviar por WhatsApp"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
