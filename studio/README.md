# Galia Luna Studio

Este paquete administra el mismo catálogo de Sanity (`nepto6np`, dataset `production`). Separarlo de la tienda permite actualizar el editor sin cambiar Next.js, sin trasladar productos y sin instalar sus herramientas en el Worker.

Desde la raíz del proyecto, con Node.js 22.13 o posterior:

```sh
npm run studio:install
npm run studio
```

El servidor de desarrollo muestra su dirección local al iniciar. Inicia sesión con la cuenta de Sanity que tiene acceso al proyecto. La tienda y Studio tienen instalaciones y archivos de bloqueo independientes; `npm ci` en la raíz sólo instala la tienda.

```sh
npm run studio:typecheck
npm run studio:build
```

Estos comandos validan tipos y generan `studio/dist`; no publican cambios. `npm run studio:deploy` publica el editor y requiere autenticación y un destino configurado. Ninguno migra el dataset.

La configuración usa exclusivamente los identificadores públicos `SANITY_STUDIO_PROJECT_ID` y `SANITY_STUDIO_DATASET`, con los valores del proyecto como predeterminados. Si necesitas otro dataset, colócalos en `studio/.env.local`. Nunca pongas tokens de lectura/escritura, claves de Clerk o datos de clientes en variables `SANITY_STUDIO_*`: se incluyen en el código público del editor.

Los esquemas están en `studio/schemaTypes`. Comparten las categorías de `types/product.ts` y las reglas puras de imagen de `sanity/lib/productImageValidation.ts`. Los nombres de documentos, campos, referencias, IDs y URLs del catálogo siguen siendo los mismos. La calidad recomendada de una foto genera una advertencia; una imagen sin archivo o sin texto alternativo sigue bloqueando la publicación.

Versiones fijadas: Sanity 6.17.0, React/React DOM 19.3.0 y styled-components 6.5.3. La tienda utiliza directamente `@sanity/client` 7.27.0. No se necesita `next-sanity` porque no utiliza edición visual, vista previa de borradores ni Studio embebido en Next.js.

Para auditar ambos paquetes:

```sh
npm audit
npm --prefix studio audit
```

La integración continua compila Studio en un trabajo separado. Una actualización del editor debe pasar su comprobación de tipos, compilación y revisión de publicación antes de desplegarse.

Auditoría del 1 de octubre de 2026: tienda 0 avisos conocidos; Studio 14 (10 moderados, 4 altos, 0 críticos). Los cuatro altos restantes proceden de versiones fijadas por herramientas de la CLI: `adm-zip`/`undici` en Module Federation y `js-yaml`/`smol-toml` en `@vercel/frameworks`. No forman parte de la instalación de la tienda. Se actualizó styled-components a 6.5.3 para retirar el PostCSS vulnerable. No se aplicaron overrides para ocultar estos avisos ni el downgrade de Sanity que sugiere `npm audit fix --force`. Actualizar y volver a comprobar cuando los proveedores corrijan esas cadenas sigue siendo trabajo pendiente.
