# Galia Luna

Tienda de joyería de [www.galialuna.com](https://www.galialuna.com), con catálogo administrado en Sanity, cuentas en Clerk y pedidos coordinados por WhatsApp. Este repositorio es el proyecto existente; el historial de conversación no es necesario para ejecutarlo.

## Ubicación y continuidad

- Carpeta de trabajo: C:\PROYECTOS_WEB\GaliaLuna
- Repositorio: https://github.com/pmaa1995/GaliaLuna
- Rama de optimización: codex/optimization-2026-10-01
- Punto de partida: 3c5b492 (main al comenzar esta revisión).
- Chat anterior: Diseñar identidad visual joyería, ID 019c8b86-f9af-7110-8405-c4ffaad7418c.
- Objetivo actual: mejorar la web existente, su uso en móvil, búsqueda, estabilidad, permisos, consistencia de pedidos y mantenimiento.

## Desarrollo

Requiere Node.js 22.13 o posterior (verificado con 22.20). Instala con `npm ci`, copia los nombres de variables de `.env.example` a un archivo local e introduce únicamente las credenciales necesarias. No subir credenciales al repositorio.

- `npm run dev`: desarrollo de la tienda.
- `npm run studio`: administración de contenido Sanity.
- `npm run lint`, `npm run typecheck`, `npm test`: comprobaciones de calidad.
- `npm run build`: compilación de Next.js.
- `npm run cf:build`: compilación del adaptador Cloudflare, sin publicar.
- `npm run cf:deploy`: publicación en Cloudflare; afecta a la web pública.

## Mapa del código

- `app/`: páginas, metadatos, rutas de API, cuenta y administración.
- `components/store/`: interfaz activa de tienda, carrito y checkout.
- `lib/catalogData.ts`: lectura del catálogo y consulta fresca para checkout.
- `lib/admin/auth.ts`: autorización del panel administrativo.
- `lib/orders/`: validación, almacenamiento D1 e inventario Sanity.
- `store/cartStore.ts`: carrito persistido en el navegador.
- `sanity/`: esquema y cliente del CMS.
- `tests/`: pruebas de regresión sin pedidos ni mutaciones reales.
- `wrangler.jsonc`: dominios, binding de imágenes y base D1 de producción.
- `.github/workflows/`: validación y despliegue al actualizar main.

## Configuración importante

La navegación pública usa el catálogo publicado. Un catálogo vacío debe permanecer vacío; un fallo de Sanity no debe reemplazarlo por productos de demostración. El checkout consulta el catálogo de origen para validar precio y disponibilidad.

Los administradores se configuran con metadatos public/private controlados desde el servidor de Clerk o mediante correo verificado incluido en ADMIN_EMAIL_ALLOWLIST. Los metadatos unsafe del usuario no dan acceso administrativo.

Los pedidos se registran antes de abrir WhatsApp. Confirmar y sincronizar inventario depende de la base D1, de SANITY_WRITE_TOKEN y del flujo administrativo. Un pedido no equivale a un pago ni a una reserva de stock.

## Despliegue y verificación real

La integración de Cloudflare y los secretos de producción deben comprobarse con el entorno desplegado. El proyecto conserva la configuración OpenNext existente sin almacenamiento persistente de caché ISR. El caché de archivos estáticos se define en public/_headers; la persistencia de ISR requiere infraestructura adicional y validación antes de activarla.

La revisión local no sustituye una prueba de inicio de sesión con Clerk, un pedido de prueba autorizado en D1/WhatsApp ni mediciones de Core Web Vitals con tráfico real. No se deben enviar pedidos reales al ejecutar las pruebas automáticas.

Fuentes técnicas: [Next.js JSON-LD](https://nextjs.org/docs/app/guides/json-ld), [OpenNext caché](https://opennext.js.org/cloudflare/caching), [Clerk metadatos](https://clerk.com/docs/guides/users/extending).

## Dependencias revisadas el 1 de octubre de 2026

Versiones fijadas: Next.js 15.5.27, React/React DOM 19.1.9, Clerk 6.39.7, OpenNext Cloudflare 1.20.7 y Wrangler 4.146.0. Overrides compatibles corrigen PostCSS dentro de Next y glob en las herramientas de Sanity.

La auditoría de dependencias de producción pasó de 63 a 15 avisos: 11 moderados, 3 altos y 1 crítico. Los avisos restantes pertenecen a Sanity/Studio y sus herramientas de línea de comandos (adm-zip, decompress y cadenas relacionadas). No se considera una auditoría limpia. Resolverlos requiere actualizar y validar el conjunto Sanity/next-sanity; no aplicar npm audit fix --force sin comprobar las migraciones y el Studio.

Los tests simulan Clerk/Sanity y prueban transacciones con SQLite en memoria. No modifican pedidos, usuarios ni inventario reales. El despliegue y las pruebas con las credenciales de producción son un paso posterior.
## Prueba opcional de navegador

`tests/storefront.browser.cjs` comprueba búsqueda, filtros, navegación, carrito, accesibilidad y checkout simulado. Requiere Playwright y Chrome/Chromium disponibles en el entorno. Ejecuta primero una compilación y un servidor local (`npm run build` y `npm run start`). Configura `STOREFRONT_URL` con la URL local y ejecuta `node tests/storefront.browser.cjs`.

Si Playwright no está instalado en el proyecto, `PLAYWRIGHT_MODULE` puede apuntar a una instalación externa. `CHROME_PATH` permite elegir el ejecutable del navegador y `STOREFRONT_SCREENSHOTS` la carpeta de capturas. El script rechaza dominios no locales, intercepta los pedidos y no envía mensajes reales. No forma parte de `npm test`, porque requiere el navegador y el servidor en ejecución.


## Rediseño comercial y WSL

La portada editorial se sirve desde HomeEditorial (componente servidor). /coleccion agrupa el catálogo y /coleccion/[categoria] ofrece las categorías. CatalogBrowser mantiene búsqueda, precio máximo, stock confirmado, orden y paginación en la URL; recupera filtros y posición al volver desde una pieza. Precio y stock también funcionan mediante formulario GET sin JavaScript. La colección se renderiza en servidor bajo demanda y reutiliza la lectura cacheada del catálogo. Las combinaciones de filtros tienen canonical a su categoría y noindex.

StoreShell comparte cabecera y pie entre portada, colección y producto. El carrito y el formulario de compra se cargan cuando se necesitan. La portada mantiene salvia, coral, arena y tipografía editorial; utiliza fotografías del catálogo y no promete existencias, materiales ni condiciones de entrega que no estén verificados. Las categorías vacías no ocupan un espacio destacado en la portada.

Para compilar con tu Ubuntu WSL2, sigue [docs/WSL_BUILD.md](docs/WSL_BUILD.md). El script scripts/wsl-snapshot.sh prepara una copia aislada en ext4 con Node 22.20.0 Linux; conserva el Node global y separa los node_modules de Windows. WSL resuelve el entorno de compilación Linux. No sustituye las mediciones de visitantes después de publicar.

Pruebas de navegador adicionales: node tests/product-detail.browser.cjs valida galería, zoom, accesibilidad y checkout directo simulado. Ambas suites aceptan STOREFRONT_URL local, PLAYWRIGHT_MODULE, CHROME_PATH, STOREFRONT_SCREENSHOTS y STOREFRONT_REPORT. No apuntarlas a producción. Las sesiones reales de Clerk y un pedido real siguen pendientes de una validación controlada posterior al despliegue.

Las fotografías usan un loader de next/image hacia el CDN de Sanity: se solicita el ancho apropiado al dispositivo, calidad explícita y formato automático directamente al proveedor. Así se conserva srcset/lazy-loading sin retransformar cada foto en el Worker. Las imágenes locales de fallback siguen disponibles. Fuentes: https://nextjs.org/docs/app/api-reference/config/next-config-js/images y https://www.sanity.io/docs/apis-and-sdks/image-urls.
