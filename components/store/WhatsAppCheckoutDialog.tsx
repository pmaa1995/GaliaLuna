"use client";

import { ChevronLeft, MessageCircle, X } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import type { CartItem } from "../../store/cartStore";
import { loadSignedInClerk } from "../../lib/clerkBrowser";
import useModalAccessibility from "./useModalAccessibility";
import { WHATSAPP_OWNER_NUMBER } from "../../lib/contact";
import { DR_PROVINCES, matchProvince } from "../../lib/orders/provinces";
import { hasEnoughLetters, isValidCheckoutPhone } from "../../lib/orders/validation";
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
      province: matchProvince(textValue(parsed.province)),
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
    province: matchProvince(textValue(profile.province)),
    city: textValue(profile.city),
    sector: textValue(profile.sector),
    addressLine1: textValue(profile.addressLine1),
    addressLine2: textValue(profile.addressLine2),
    reference: textValue(profile.reference),
    deliveryNotes: textValue(profile.deliveryNotes),
  };
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

// Same rules as the server, checked first so the shopper gets a clear message without a round trip.
function validateForm(values: CheckoutFormValues): { message: string; inDetails?: boolean } | null {
  const missing = [
    ["nombre", values.fullName],
    ["teléfono", values.phone],
    ["provincia", values.province],
    ["ciudad o municipio", values.city],
    ["dirección", values.addressLine1],
  ].filter(([, value]) => !value).map(([label]) => label);
  if (missing.length) return { message: `Completa ${missing.join(", ")}.` };
  if (!hasEnoughLetters(values.fullName, 3)) return { message: "Escribe tu nombre y apellido." };
  if (!isValidCheckoutPhone(values.phone)) return { message: "Escribe un teléfono válido, por ejemplo 809-555-1234." };
  if (!hasEnoughLetters(values.city, 2)) return { message: "Escribe tu ciudad o municipio." };
  if (values.addressLine1.length < 5) return { message: "Escribe la dirección completa: calle y número." };
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return { message: "Revisa el correo.", inDetails: true };
  return null;
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
    ...(orderCode ? [`Código de pedido: ${orderCode}`] : []),
    "",
    "Productos:",
    ...itemLines,
    `Total estimado: ${formatDOP(total)}`,
    "",
    "Datos de entrega:",
    `Nombre: ${normalized.fullName}`,
    `Teléfono: ${normalized.phone}`,
    `Provincia: ${normalized.province}`,
    `Ciudad o municipio: ${normalized.city}`,
    `Dirección: ${normalized.addressLine1}`,
  ];

  if (normalized.sector) lines.push(`Sector: ${normalized.sector}`);
  if (normalized.addressLine2) lines.push(`Apto., edificio o casa: ${normalized.addressLine2}`);
  if (normalized.reference) lines.push(`Referencia: ${normalized.reference}`);
  if (normalized.deliveryNotes) lines.push(`Instrucciones: ${normalized.deliveryNotes}`);
  if (normalized.email) lines.push(`Correo: ${normalized.email}`);

  lines.push(
    "",
    `Origen: ${source === "cart" ? "carrito de la web" : "compra directa de una pieza"}${signedIn ? " · con cuenta" : ""}`,
    "Por favor confírmame disponibilidad, forma de pago y entrega.",
  );

  return lines.join("\n");
}

export async function saveOrderBeforeWhatsApp({
  items,
  values,
  source,
  website = "",
}: {
  items: CartItem[];
  values: CheckoutFormValues;
  source: CheckoutSource;
  website?: string;
}): Promise<CreateWhatsAppOrderResponse | null> {
  try {
    const response = await fetch("/api/orders/whatsapp", {
      method: "POST",
      signal: AbortSignal.timeout(20_000),
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source,
        website,
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
    if (!response.ok || data?.ok !== true || data?.persisted !== true || typeof data.orderCode !== "string" || !data.orderCode) {
      return { ok: false, persisted: false, orderCode: null,
        error: typeof data?.error === "string" ? data.error : "No se pudo registrar el pedido. Intenta de nuevo." };
    }
    return data;
  } catch (error) {
    console.error("No se pudo registrar el pedido antes de WhatsApp", error);
    return null;
  }
}

function openWhatsAppBridgeTab() {
  if (typeof window === "undefined") return null;

  const bridgeTab = window.open("/whatsapp-bridge.html", "_blank");
  if (!bridgeTab) return null;

  try {
    bridgeTab.opener = null;
  } catch {
    // Ignore opener restrictions.
  }

  return bridgeTab;
}

function buildWhatsAppBridgeUrl(targetUrl: string) {
  if (typeof window === "undefined") {
    return `/whatsapp-bridge.html?to=${encodeURIComponent(targetUrl)}`;
  }

  const bridgeUrl = new URL("/whatsapp-bridge.html", window.location.origin);
  bridgeUrl.searchParams.set("to", targetUrl);
  return bridgeUrl.toString();
}

interface WhatsAppCheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  source: CheckoutSource;
  onSubmitted?: (result: WhatsAppCheckoutSubmitResult) => void;
}

export interface WhatsAppCheckoutSubmitResult {
  ok: boolean;
  persisted: boolean;
  orderCode: string | null;
  signedIn: boolean;
  source: CheckoutSource;
  // Lets the confirmation reopen WhatsApp if the shopper closed it before sending.
  whatsappUrl: string | null;
}

export default function WhatsAppCheckoutDialog({
  open,
  onClose,
  items,
  source,
  onSubmitted,
}: WhatsAppCheckoutDialogProps) {
  const [formValues, setFormValues] = useState<CheckoutFormValues>(emptyForm);
  const [website, setWebsite] = useState("");
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const editedRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalAccessibility(dialogRef, open, onClose, !isSubmitting);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );
  const pieces = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    editedRef.current = false;
    const draft = readGuestDraft();
    setFormValues(draft);
    setShowDetails(Boolean(draft.sector || draft.addressLine2 || draft.deliveryNotes));
    setSignedIn(false);
    setError("");
    // Resolves immediately for guests; signed-in shoppers get their saved delivery data.
    void loadSignedInClerk().then((clerk) => {
      if (cancelled || !clerk?.user) return;
      setSignedIn(true);
      if (!editedRef.current) setFormValues(readAccountPrefill(clerk.user));
    });
    return () => { cancelled = true; };
  }, [open]);

  if (!open) return null;

  const updateField =
    (key: keyof CheckoutFormValues) =>
    (
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
      const value = event.target.value;
      editedRef.current = true;
      setFormValues((current) => ({ ...current, [key]: value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;
    setError("");

    if (items.length === 0) {
      setError("No hay productos en el pedido.");
      return;
    }

    const normalized = normalizeForm(formValues);
    const problem = validateForm(normalized);
    if (problem) {
      if (problem.inDetails) setShowDetails(true);
      setError(problem.message);
      return;
    }

    if (!signedIn) {
      saveGuestDraft(normalized);
    }

    // Open a bridge tab synchronously from the click event so browsers don't block it
    // after the async order-save request completes.
    const whatsappTab = openWhatsAppBridgeTab();

    submittingRef.current = true;
    setIsSubmitting(true);
    // A loaded Clerk keeps the session cookie fresh, so the order is linked to the account.
    await loadSignedInClerk();
    const saveResult = await saveOrderBeforeWhatsApp({
      items,
      values: normalized,
      source,
      website,
    });

    if (!saveResult?.ok || !saveResult.persisted || !saveResult.orderCode) {
      try { whatsappTab?.close(); } catch { /* Tab may already be closed. */ }
      setError(saveResult?.error || "No se pudo registrar el pedido. Intenta de nuevo.");
      submittingRef.current = false;
      setIsSubmitting(false);
      return;
    }

    const message = buildOrderMessage({
      items,
      values: normalized,
      source,
      signedIn,
      orderCode: saveResult.orderCode,
    });

    const url = `https://api.whatsapp.com/send?phone=${WHATSAPP_OWNER_NUMBER}&text=${encodeURIComponent(message)}`;

    onSubmitted?.({
      ok: true,
      persisted: true,
      orderCode: saveResult.orderCode,
      signedIn,
      source,
      whatsappUrl: url,
    });

    if (whatsappTab) {
      try {
        whatsappTab.location.replace(buildWhatsAppBridgeUrl(url));
      } catch {
        window.location.assign(url);
      }
    } else {
      // Popup blocked: fall back to same-tab redirect (no extra blank tabs).
      window.location.assign(url);
    }
    submittingRef.current = false;
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="sheet-overlay" onClick={(event) => { if (event.target === event.currentTarget && !isSubmitting) onClose(); }}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Confirmar pedido por WhatsApp"
        className="sheet sheet--animated"
      >
        <header className="sheet-head">
          <button type="button" className="sheet-back" onClick={onClose} disabled={isSubmitting}>
            <ChevronLeft size={16} aria-hidden="true" />
            {source === "cart" ? "Volver al pedido" : "Volver"}
          </button>
          <button type="button" className="sheet-close" onClick={onClose} disabled={isSubmitting} aria-label="Cerrar confirmación de pedido">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="sheet-form" noValidate>
          <div className="sheet-body">
            <h2 className="sheet-title">Datos de entrega</h2>
            <p className="sheet-lead">
              {signedIn ? "Usamos los datos de tu cuenta. Puedes cambiarlos antes de enviar." : "Solo lo necesario para preparar tu entrega."}
            </p>

            <details className="sheet-summary">
              <summary>
                <span>{pieces} {pieces === 1 ? "pieza" : "piezas"} · {formatDOP(total)}</span>
                <span className="sheet-summary-toggle">Ver piezas</span>
              </summary>
              <ul>
                {items.map((item) => (
                  <li key={`${item.id}-${item.quantity}`}>
                    <span>{item.quantity} × {item.name}</span>
                    <span>{formatDOP(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
            </details>

            <fieldset className="sheet-group">
              <legend>Contacto</legend>
              <label className="sheet-field">
                Nombre y apellido
                <input data-modal-initial-focus maxLength={140} value={formValues.fullName} onChange={updateField("fullName")} autoComplete="name" required />
              </label>
              <label className="sheet-field">
                Teléfono (WhatsApp)
                <input type="tel" inputMode="tel" maxLength={40} value={formValues.phone} onChange={updateField("phone")} placeholder="809-555-1234" autoComplete="tel" required />
              </label>
            </fieldset>

            <fieldset className="sheet-group">
              <legend>Entrega</legend>
              <div className="sheet-field">
                <label htmlFor="checkout-province">Provincia</label>
                <select id="checkout-province" value={formValues.province} onChange={updateField("province")} autoComplete="address-level1" required>
                  <option value="">Elige tu provincia</option>
                  {DR_PROVINCES.map((province) => <option key={province} value={province}>{province}</option>)}
                </select>
              </div>
              <label className="sheet-field">
                Ciudad o municipio
                <input maxLength={100} value={formValues.city} onChange={updateField("city")} autoComplete="address-level2" required />
              </label>
              <label className="sheet-field">
                Dirección
                <input maxLength={200} value={formValues.addressLine1} onChange={updateField("addressLine1")} placeholder="Calle y número" autoComplete="address-line1" required />
              </label>
              <label className="sheet-field">
                Referencia (opcional)
                <input maxLength={260} value={formValues.reference} onChange={updateField("reference")} placeholder="Un lugar conocido cerca" />
              </label>
            </fieldset>

            <details className="sheet-more" open={showDetails} onToggle={(event) => setShowDetails(event.currentTarget.open)}>
              <summary>Añadir más detalles (opcional)</summary>
              <div className="sheet-group">
                <label className="sheet-field">
                  Sector
                  <input maxLength={140} value={formValues.sector} onChange={updateField("sector")} autoComplete="address-level3" />
                </label>
                <label className="sheet-field">
                  Apto., edificio o casa
                  <input maxLength={200} value={formValues.addressLine2} onChange={updateField("addressLine2")} autoComplete="address-line2" />
                </label>
                <label className="sheet-field">
                  Correo
                  <input type="email" maxLength={180} value={formValues.email} onChange={updateField("email")} autoComplete="email" />
                </label>
                <label className="sheet-field">
                  Instrucciones de entrega
                  <textarea maxLength={360} rows={2} value={formValues.deliveryNotes} onChange={updateField("deliveryNotes")} placeholder="Horario, quién recibe…" />
                </label>
              </div>
            </details>

            {/* Honeypot: hidden from people and assistive tech; bots that fill it are rejected by the server. */}
            <div className="sheet-hp" aria-hidden="true">
              <label>No completes este campo<input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
            </div>
          </div>

          <footer className="sheet-foot">
            {error ? <p role="alert" className="sheet-error">{error}</p> : null}
            <p className="sheet-total"><span>Total estimado</span><strong>{formatDOP(total)}</strong></p>
            <button type="submit" disabled={isSubmitting} className="sheet-submit">
              <MessageCircle size={16} aria-hidden="true" />
              {isSubmitting ? "Preparando tu pedido…" : "Enviar pedido por WhatsApp"}
            </button>
            <p className="sheet-note">Se abrirá WhatsApp con tu pedido listo. Envía el mensaje y una asesora te confirma disponibilidad, pago y entrega.</p>
          </footer>
        </form>
      </div>
    </div>
  );
}
