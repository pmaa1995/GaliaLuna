import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ChevronRight, MessageCircle, Pencil, Phone, ShieldCheck } from "lucide-react";

import { saveAccountProfileAction } from "../../app/mi-cuenta/actions";
import { CALL_OWNER_NUMBER, WHATSAPP_OWNER_NUMBER } from "../../lib/contact";
import { DR_PROVINCES, matchProvince } from "../../lib/orders/provinces";
import AccountSignOutButton from "../auth/AccountSignOutButton";

export interface DeliveryProfile {
  deliveryPhone: string;
  alternatePhone: string;
  province: string;
  city: string;
  sector: string;
  addressLine1: string;
  addressLine2: string;
  reference: string;
  deliveryNotes: string;
}

interface AccountDashboardProps {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  profile: DeliveryProfile;
  isAdmin: boolean;
  profileStatus: "" | "guardado" | "error";
  orders: ReactNode;
}

function Field({ label, name, value, required, placeholder, wide, type = "text", autoComplete, inputMode }: {
  label: string; name: keyof DeliveryProfile | "firstName" | "lastName"; value: string; required?: boolean; placeholder?: string; wide?: boolean;
  type?: string; autoComplete?: string; inputMode?: "tel" | "text";
}) {
  return (
    <label className={`acct-field${wide ? " acct-field--wide" : ""}`}>
      {label}{required ? " *" : ""}
      <input name={name} type={type} required={required} defaultValue={value} placeholder={placeholder} autoComplete={autoComplete} inputMode={inputMode} />
    </label>
  );
}

export default function AccountDashboard({ firstName, lastName, displayName, email, profile, isAdmin, profileStatus, orders }: AccountDashboardProps) {
  const hasProfile = Boolean(profile.deliveryPhone && profile.addressLine1 && profile.city && profile.province);
  return (
    <div className="acct shop-container">
      <header className="acct-head">
        <p className="shop-eyebrow">MI CUENTA</p>
        <h1>Hola, {firstName || displayName}</h1>
        <p>{email}</p>
        {profileStatus === "guardado" ? <p className="acct-alert" role="status">Tus datos de entrega se guardaron.</p> : null}
        {profileStatus === "error" ? <p className="acct-alert acct-alert--error" role="alert">Completa los campos obligatorios para guardar tus datos.</p> : null}
      </header>

      {isAdmin ? (
        <Link href="/admin/pedidos" className="acct-admin">
          <ShieldCheck size={22} strokeWidth={1.5} aria-hidden="true" />
          <span><strong>Panel de pedidos</strong><small>Confirma, prepara y sigue los pedidos de la web.</small></span>
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      ) : null}

      <div className="acct-grid">
        <div>{orders}</div>

        <div className="acct-side">
          <section aria-labelledby="delivery-title">
            <div className="acct-section-head"><h2 id="delivery-title">Datos de entrega</h2></div>
            {hasProfile ? (
              <div className="acct-profile acct-profile--saved">
                <p><strong>{[firstName, lastName].filter(Boolean).join(" ") || displayName}</strong></p>
                <p>{profile.deliveryPhone}{profile.alternatePhone ? <span> · {profile.alternatePhone}</span> : null}</p>
                <p>{profile.addressLine1}{profile.addressLine2 ? `, ${profile.addressLine2}` : ""}</p>
                <p>{[profile.sector, profile.city, profile.province].filter(Boolean).join(", ")}</p>
                {profile.reference ? <p><span>Referencia:</span> {profile.reference}</p> : null}
              </div>
            ) : (
              <p className="acct-profile"><span>Guárdalos una vez y no tendrás que escribirlos en cada pedido.</span></p>
            )}
            <details className="acct-details" open={!hasProfile || profileStatus === "error"}>
              <summary><Pencil size={14} aria-hidden="true" />Editar datos de entrega</summary>
              <form action={saveAccountProfileAction} className="acct-form">
                <Field label="Nombre" name="firstName" value={firstName} required autoComplete="given-name" />
                <Field label="Apellido" name="lastName" value={lastName} required autoComplete="family-name" />
                <Field label="Teléfono" name="deliveryPhone" value={profile.deliveryPhone} required placeholder="809-000-0000" type="tel" inputMode="tel" autoComplete="tel" />
                <Field label="Teléfono alterno" name="alternatePhone" value={profile.alternatePhone} placeholder="Opcional" type="tel" inputMode="tel" />
                <div className="acct-field">
                  <label htmlFor="profile-province">Provincia *</label>
                  <select id="profile-province" name="province" required defaultValue={matchProvince(profile.province)} autoComplete="address-level1">
                    <option value="">Elige tu provincia</option>
                    {DR_PROVINCES.map((province) => <option key={province} value={province}>{province}</option>)}
                  </select>
                </div>
                <Field label="Ciudad o municipio" name="city" value={profile.city} required placeholder="Santo Domingo Este" autoComplete="address-level2" />
                <Field label="Dirección" name="addressLine1" value={profile.addressLine1} required placeholder="Calle y número" wide autoComplete="address-line1" />
                <Field label="Sector" name="sector" value={profile.sector} placeholder="Opcional" autoComplete="address-level3" />
                <Field label="Apto., edificio" name="addressLine2" value={profile.addressLine2} placeholder="Opcional" autoComplete="address-line2" />
                <label className="acct-field acct-field--wide">Referencia
                  <textarea name="reference" rows={2} defaultValue={profile.reference} placeholder="Un punto conocido cerca de tu dirección" />
                </label>
                <label className="acct-field acct-field--wide">Instrucciones de entrega
                  <textarea name="deliveryNotes" rows={2} defaultValue={profile.deliveryNotes} placeholder="Horario, quién recibe… (opcional)" />
                </label>
                <button type="submit" className="shop-button shop-button-primary">Guardar datos</button>
                <p className="acct-form-note">Solo los usamos para coordinar tus entregas.</p>
              </form>
            </details>
          </section>

          <section className="acct-help" aria-labelledby="help-title">
            <div className="acct-section-head"><h2 id="help-title">¿Necesitas ayuda?</h2></div>
            <p>Una asesora te atiende por WhatsApp para dudas sobre piezas, pagos o entregas.</p>
            <div className="acct-help-actions">
              <a className="shop-button shop-button-secondary" href={`https://wa.me/${WHATSAPP_OWNER_NUMBER}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} aria-hidden="true" />WhatsApp</a>
              <a className="shop-button shop-button-outline" href={`tel:+${CALL_OWNER_NUMBER}`}><Phone size={16} aria-hidden="true" />Llamar</a>
            </div>
          </section>

          <nav className="acct-links" aria-label="Opciones de la cuenta">
            <Link href="/mi-cuenta/seguridad">Seguridad y acceso <ChevronRight size={16} aria-hidden="true" /></Link>
            <Link href="/coleccion">Seguir comprando <ChevronRight size={16} aria-hidden="true" /></Link>
            <AccountSignOutButton />
          </nav>
        </div>
      </div>
    </div>
  );
}
