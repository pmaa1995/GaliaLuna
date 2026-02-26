import type { Metadata } from "next";

import PolicyPage from "../../components/legal/PolicyPage";

export const metadata: Metadata = {
  title: "Envíos y entregas",
  description:
    "Información sobre coordinación de entrega, envíos y tiempos de despacho de Galia Luna.",
};

export default function ShippingPage() {
  return (
    <PolicyPage
      eyebrow="Políticas"
      title="Envíos y entregas"
      intro={
        <p>
          Las entregas y envíos se coordinan por WhatsApp una vez confirmado el
          pedido. El objetivo es validar disponibilidad, dirección y horario de
          entrega de forma clara antes de despachar.
        </p>
      }
      sections={[
        {
          title: "Coordinación de entrega",
          content: (
            <>
              <p>
                Al confirmar tu pedido, revisamos contigo el método de entrega o
                envío según tu zona. Si tienes cuenta, puedes guardar tus datos de
                entrega para agilizar futuras compras.
              </p>
            </>
          ),
        },
        {
          title: "Datos de entrega",
          content: (
            <>
              <p>
                Para procesar una entrega correctamente necesitamos nombre, teléfono,
                provincia, ciudad/municipio, dirección y referencia. La web ya te
                ayuda a organizar estos datos antes de enviarnos el pedido por
                WhatsApp.
              </p>
            </>
          ),
        },
        {
          title: "Tiempos estimados",
          content: (
            <>
              <p>
                Los tiempos de entrega pueden variar según disponibilidad de la
                pieza, horario de confirmación, ubicación y método de envío. Te
                informaremos un tiempo estimado durante la confirmación del pedido.
              </p>
            </>
          ),
        },
        {
          title: "Seguimiento",
          content: (
            <>
              <p>
                El seguimiento se gestiona por WhatsApp. Cuando aplique, te
                compartiremos información de despacho o referencia de mensajería para
                que puedas dar seguimiento a tu entrega.
              </p>
            </>
          ),
        },
        {
          title: "Incidencias de entrega",
          content: (
            <p>
              Si surge algún inconveniente con dirección, horario o recepción,
              contáctanos por WhatsApp para ayudarte a recoordinar la entrega lo más
              rápido posible.
            </p>
          ),
        },
      ]}
    />
  );
}

