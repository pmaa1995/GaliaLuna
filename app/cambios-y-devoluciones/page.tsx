import type { Metadata } from "next";

import PolicyPage from "../../components/legal/PolicyPage";

export const metadata: Metadata = {
  title: "Cambios y devoluciones",
  description:
    "Lineamientos de cambios, devoluciones y revisión de piezas en Galia Luna.",
};

export default function ReturnsPage() {
  return (
    <PolicyPage
      eyebrow="Políticas"
      title="Cambios y devoluciones"
      intro={
        <p>
          En Galia Luna revisamos cada pedido con atención antes de la entrega o
          envío. Si necesitas reportar un inconveniente, escríbenos por WhatsApp
          con tu referencia de pedido y una asesora te ayudará a validar el caso.
        </p>
      }
      sections={[
        {
          title: "Reporte de incidencias",
          content: (
            <>
              <p>
                Si tu pedido presenta un problema al recibirlo, contáctanos lo antes
                posible por WhatsApp e incluye fotos claras de la pieza y del empaque
                si aplica. Esto nos ayuda a evaluar el caso rápidamente.
              </p>
            </>
          ),
        },
        {
          title: "Condiciones para cambios",
          content: (
            <>
              <p>
                Los cambios están sujetos a evaluación de estado de la pieza,
                disponibilidad de inventario y tipo de producto. Las piezas deben
                conservarse en buen estado, sin alteraciones ni uso inadecuado.
              </p>
            </>
          ),
        },
        {
          title: "Piezas de edición limitada y personalizadas",
          content: (
            <>
              <p>
                Las piezas de edición limitada o elaboradas bajo pedido pueden tener
                condiciones especiales. Estas condiciones se confirman durante la
                conversación de compra antes de cerrar el pedido.
              </p>
            </>
          ),
        },
        {
          title: "Devoluciones",
          content: (
            <>
              <p>
                Las devoluciones se evalúan caso por caso según el motivo del
                reclamo, estado de la pieza y condiciones informadas al momento de la
                compra. La coordinación se realiza por WhatsApp para dar seguimiento
                directo.
              </p>
            </>
          ),
        },
        {
          title: "Proceso de atención",
          content: (
            <p>
              Para agilizar la gestión, escribe con tu nombre, número de contacto y
              detalle del pedido. Si tienes cuenta en la web, eso ayuda a ubicar la
              información más rápido, pero no es obligatorio.
            </p>
          ),
        },
      ]}
    />
  );
}

