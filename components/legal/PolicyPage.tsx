import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
import type { ReactNode } from "react";

import {
  CALL_OWNER_NUMBER,
  CALL_PHONE_DISPLAY,
  WHATSAPP_OWNER_NUMBER,
  WHATSAPP_PHONE_DISPLAY,
} from "../../lib/contact";

type PolicySection = {
  title: string;
  content: ReactNode;
};

interface PolicyPageProps {
  eyebrow: string;
  title: string;
  intro: ReactNode;
  sections: PolicySection[];
  updatedLabel?: string;
}

export default function PolicyPage({
  eyebrow,
  title,
  intro,
  sections,
  updatedLabel = "Última actualización: febrero 2026",
}: PolicyPageProps) {
  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="inline-block h-px w-7 bg-[color:var(--metal)]" />
          <Link
            href="/"
            className="[font-family:var(--font-playfair)] text-[1.2rem] leading-none tracking-[0.06em] text-[color:var(--ink)]"
          >
            GALIA LUNA
          </Link>
        </div>
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-[color:var(--line)] bg-[color:var(--bg-soft)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
        >
          Volver al catálogo
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_22rem]">
        <section className="border border-[color:var(--line)] bg-[color:var(--paper)] p-5 sm:p-7">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
            {eyebrow}
          </p>
          <h1 className="mt-3 [font-family:var(--font-playfair)] text-[clamp(2rem,4vw,3.1rem)] leading-[0.92] tracking-[-0.03em] text-[color:var(--ink)]">
            {title}
          </h1>
          <div className="mt-4 text-sm leading-7 text-[color:var(--ink-soft)]">
            {intro}
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
            {updatedLabel}
          </p>

          <div className="mt-8 space-y-6">
            {sections.map((section) => (
              <section
                key={section.title}
                className="rounded-[16px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4 sm:p-5"
              >
                <h2 className="[font-family:var(--font-playfair)] text-[1.55rem] leading-[0.95] tracking-[-0.02em] text-[color:var(--ink)]">
                  {section.title}
                </h2>
                <div className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
                  {section.content}
                </div>
              </section>
            ))}
          </div>
        </section>

        <aside className="space-y-6 lg:sticky lg:top-[1.5rem] lg:self-start">
          <section className="border border-[color:var(--line)] bg-[color:var(--paper)] p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
              Atención
            </p>
            <h2 className="mt-2 [font-family:var(--font-playfair)] text-[1.7rem] leading-[0.95] tracking-[-0.02em] text-[color:var(--ink)]">
              Soporte de compra y entrega
            </h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
              Si tienes dudas sobre políticas, cambios, disponibilidad o entrega, te atendemos de forma directa por WhatsApp o llamada.
            </p>
            <div className="mt-4 rounded-[14px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                WhatsApp
              </p>
              <p className="mt-1 text-sm font-medium text-[color:var(--ink)]">
                {WHATSAPP_PHONE_DISPLAY}
              </p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                Llamadas directas
              </p>
              <p className="mt-1 text-sm font-medium text-[color:var(--ink)]">
                {CALL_PHONE_DISPLAY}
              </p>
              <div className="mt-4 grid gap-2">
                <a
                  href={`https://wa.me/${WHATSAPP_OWNER_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--brand-coral)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Escribir por WhatsApp
                </a>
                <a
                  href={`tel:+${CALL_OWNER_NUMBER}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)]"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Llamar
                </a>
              </div>
            </div>
          </section>

          <section className="border border-[color:var(--line)] bg-[color:var(--paper)] p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
              Documentos
            </p>
            <div className="mt-3 grid gap-2 text-sm text-[color:var(--ink)]">
              <Link href="/privacidad">Política de privacidad</Link>
              <Link href="/terminos">Términos y condiciones</Link>
              <Link href="/cambios-y-devoluciones">Cambios y devoluciones</Link>
              <Link href="/envios">Envíos y entregas</Link>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

