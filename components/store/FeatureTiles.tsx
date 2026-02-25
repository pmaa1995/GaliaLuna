import { memo } from "react";

const items = [
  {
    label: "Envios",
    text: "Coordinacion personalizada en RD con seguimiento por WhatsApp.",
  },
  {
    label: "Atencion",
    text: "Acompañamiento directo para confirmar pedido, pago y entrega.",
  },
  {
    label: "Curaduria",
    text: "Piezas seleccionadas con acabado premium y gesto atemporal.",
  },
] as const;

function FeatureTilesComponent() {
  return (
    <section
      aria-label="Notas de la casa"
      className="mt-10 border-y border-[color:var(--border-warm)] py-5"
    >
      <div className="grid gap-5 md:grid-cols-3 md:gap-6">
        {items.map((item, index) => (
          <div
            key={item.label}
            className={`relative ${index > 0 ? "md:pl-5" : ""}`}
          >
            {index > 0 ? (
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 hidden h-full w-px bg-[color:var(--border-warm)] md:block"
              />
            ) : null}
            <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
              {item.label}
            </p>
            <p className="mt-2 [font-family:var(--font-inter)] text-sm leading-6 text-[color:var(--ink)]/76">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

const FeatureTiles = memo(FeatureTilesComponent);

export default FeatureTiles;
