import type { Metadata } from "next";

import PolicyPage from "../../components/legal/PolicyPage";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Cómo Galia Luna utiliza y protege los datos compartidos durante el proceso de compra y atención por WhatsApp.",
};

export default function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Política de privacidad"
      intro={
        <p>
          En Galia Luna utilizamos tus datos solo para atenderte, coordinar pedidos,
          gestionar entregas y ofrecer seguimiento de soporte. No vendemos ni
          compartimos tus datos personales con terceros fuera de los servicios
          necesarios para operar la tienda.
        </p>
      }
      sections={[
        {
          title: "Qué datos recopilamos",
          content: (
            <>
              <p>
                Podemos recopilar nombre, correo, teléfono, dirección de entrega,
                detalles del pedido y mensajes compartidos durante la atención por
                WhatsApp o mediante la cuenta web.
              </p>
              <p className="mt-3">
                Si creas una cuenta, parte de esa información puede guardarse para
                agilizar compras futuras y evitar que tengas que escribir los mismos
                datos en cada pedido.
              </p>
            </>
          ),
        },
        {
          title: "Cómo usamos la información",
          content: (
            <>
              <p>Usamos los datos para:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>confirmar disponibilidad y detalles de productos,</li>
                <li>coordinar pago, entrega o envío,</li>
                <li>dar seguimiento al pedido y soporte postventa,</li>
                <li>mejorar la experiencia de compra en la web.</li>
              </ul>
            </>
          ),
        },
        {
          title: "Pagos y datos sensibles",
          content: (
            <>
              <p>
                Actualmente las compras se coordinan por WhatsApp. La web no
                almacena datos de tarjetas para cerrar pedidos. Si en el futuro se
                habilitan pagos en línea, esta política se actualizará para reflejar
                ese proceso.
              </p>
            </>
          ),
        },
        {
          title: "Conservación y actualización de datos",
          content: (
            <>
              <p>
                Conservamos la información necesaria para atender pedidos, soporte y
                seguimiento. Puedes solicitar corrección o actualización de tus
                datos, o pedir que eliminemos información que no debamos conservar
                por razones operativas o legales.
              </p>
            </>
          ),
        },
        {
          title: "Contacto sobre privacidad",
          content: (
            <p>
              Si tienes preguntas sobre privacidad o manejo de datos, puedes escribirnos
              por WhatsApp desde la web y te orientamos directamente.
            </p>
          ),
        },
      ]}
    />
  );
}

