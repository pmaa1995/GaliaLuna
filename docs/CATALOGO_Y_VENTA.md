# Catálogo y venta por WhatsApp

## Decisión de plataforma

Se mantiene Sanity para productos, fotografías y portada, y D1 para registrar pedidos. El cliente prepara su pedido en la tienda y termina la confirmación por WhatsApp. Esta es la modalidad elegida por el negocio el 1 de octubre de 2026.

El panel de edición vive en el paquete independiente `studio/`; la tienda sólo necesita el SDK de datos. Actualizar el panel no debe obligar a actualizar Next o React de la tienda. No se migran documentos ni se cambian las URL de producto al reorganizar el código.

## Qué productos existen

La consulta pública realizada el 1 de octubre de 2026 encontró **20 productos publicados**: 5 anillos, 5 aretes, 2 cadenas y 8 collares. Origen, CDN y enlaces de la portada de producción coinciden. Los productos de demostración del código no son publicaciones adicionales.

La API pública no permite descartar borradores privados. Para comprobarlos se debe abrir el Studio con una cuenta autorizada. Un producto debe estar publicado, tener activado **Mostrar en tienda** y contener nombre, slug y precio válido en DOP para aparecer. Tener stock desconocido no lo oculta por defecto; se consulta disponibilidad al confirmar.

La portada es una selección de cuatro piezas representativa de distintas categorías. Indica el tamaño real de la colección y enlaza a ella. La colección muestra hasta 24 piezas al entrar, por lo que los 20 productos actuales están visibles sin pulsar «Ver más». El catálogo conserva paginación para crecer y las fotografías fuera de pantalla cargan de forma diferida.

## Publicar y revisar contenido

Las recomendaciones de resolución, proporción y peso del original son advertencias. No bloquean una publicación válida: la tienda solicita al CDN imágenes adaptadas al dispositivo. Una entrada de galería sin archivo, o una referencia cuyo archivo se ha eliminado, sí requiere corrección. El texto alternativo sigue siendo obligatorio.

Ejecuta `npm run catalog:audit -- --output catalogo.json --csv catalogo.csv` para obtener un informe reproducible y una lista del catálogo publicado. La herramienta realiza lecturas públicas; no publica, modifica precios, descuenta stock ni obtiene borradores privados.

Antes de modificar datos comerciales, revisar con la persona responsable:

- **Dormilona Instantes de Cararol negro:** precio publicado RD$200, mientras otras dos dormilonas cuestan RD$2.000. Las tres comparten la misma fotografía. Puede ser intencional; no se corrige automáticamente.
- **Gargantilla Instantes de Caracol:** dos documentos con ese nombre y precios RD$3.000/RD$3.200. Si son piezas distintas, distinguirlas claramente en el nombre.
- **El gigante del ámbar:** segunda entrada de imagen vacía. La tienda omite la entrada; en Studio hay que eliminarla o añadir el archivo.
- Conservar el slug histórico `Cadena-instantes-de-larimar`; cualquier cambio de URL debe incluir una redirección.

## Prioridades siguientes para vender mejor

1. Completar fotografías propias y datos verificables de cada pieza: material, medidas, cuidado y variantes cuando correspondan. Evitar fotos repetidas que confundan modelos.
2. Definir zonas, costo y plazos de entrega reales para reducir preguntas antes de pedir. Las condiciones actuales se acuerdan por WhatsApp; no se deben inventar promesas en la web.
3. Probar después del despliegue un pedido controlado: registro en D1, confirmación manual, inventario, historial y sesión de administración. Abrir WhatsApp no demuestra que el cliente envió el mensaje ni que pagó.
4. Completar la estrategia de caché persistente de OpenNext y comprobar que publicar, desactivar o cambiar un producto actualiza portada, colección y ficha. La configuración actual no declara almacenamiento ISR persistente; no basta con asumir que los tiempos `revalidate` garantizan frescura en producción.
5. Medir rendimiento y recorrido de compra con tráfico real: vista de producto, añadir al pedido, intento de registro y pedido confirmado. Un resultado local de laboratorio no prueba mejoras de conversión.

## Referencias

- [Sanity: errores y advertencias de validación](https://www.sanity.io/docs/studio/validation).
- [Sanity: transformación y optimización de imágenes](https://www.sanity.io/docs/apis-and-sdks/image-urls).
- [OpenNext: caché e invalidación en Cloudflare](https://opennext.js.org/cloudflare/caching).

Los cambios del código y del Studio se validan localmente antes de publicar. El nuevo código no modifica por sí solo el sitio ni el panel alojados.
