import type { Metadata } from "next";

import PolicyPage from "../../components/legal/PolicyPage";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description:
    "Condiciones de uso de la tienda web de Galia Luna y lineamientos para compras coordinadas por WhatsApp.",
};

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Términos y condiciones"
      intro={
        <p>
          Estos términos regulan el uso de la web de Galia Luna y el proceso de
          compra coordinado por WhatsApp. Al utilizar la web, aceptas estas
          condiciones para consultas, pedidos y coordinación de entrega.
        </p>
      }
      sections={[
        {
          title: "Uso de la web",
          content: (
            <>
              <p>
                La web tiene como objetivo mostrar piezas disponibles, facilitar la
                selección de productos y organizar pedidos antes de la confirmación
                final por WhatsApp con una asesora.
              </p>
              <p className="mt-3">
                Nos reservamos el derecho de actualizar productos, precios,
                disponibilidad, descripciones y fotografías cuando sea necesario.
              </p>
            </>
          ),
        },
        {
          title: "Disponibilidad y precios",
          content: (
            <>
              <p>
                Los precios publicados son de referencia para el momento de la
                consulta. La disponibilidad final se confirma por WhatsApp antes de
                cerrar el pedido.
              </p>
              <p className="mt-3">
                En piezas artesanales o de edición limitada, la disponibilidad puede
                cambiar sin previo aviso si una pieza ya fue reservada o vendida.
              </p>
            </>
          ),
        },
        {
          title: "Confirmación del pedido",
          content: (
            <>
              <p>
                Un pedido se considera confirmado cuando ambas partes (cliente y
                Galia Luna) validan por WhatsApp la disponibilidad, condiciones de
                pago y modalidad de entrega o envío.
              </p>
            </>
          ),
        },
        {
          title: "Atención y comunicación",
          content: (
            <>
              <p>
                Las consultas, seguimiento y coordinación de pedidos se gestionan
                principalmente por WhatsApp. El uso de la cuenta web es opcional y
                se ofrece para agilizar el proceso, no como requisito para comprar.
              </p>
            </>
          ),
        },
        {
          title: "Actualizaciones",
          content: (
            <p>
              Estos términos pueden actualizarse para reflejar cambios en la
              operación de la tienda, servicios o métodos de compra. Publicaremos la
              versión vigente en esta sección.
            </p>
          ),
        },
      ]}
    />
  );
}

