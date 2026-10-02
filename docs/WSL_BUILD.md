# Compilar Galia Luna en Ubuntu WSL

La copia de trabajo Windows sigue siendo la fuente principal. La compilación Cloudflare se ejecuta en una copia nueva dentro del filesystem Linux, con su propio Node y sus propios `node_modules`. No se publica nada con este procedimiento.

## Preparar una copia aislada

Desde PowerShell abre Ubuntu:

```powershell
wsl.exe -d Ubuntu
```

Ejecuta lo siguiente dentro de Ubuntu:

```bash
cd /mnt/c/PROYECTOS_WEB/GaliaLuna
bash scripts/wsl-snapshot.sh create "$PWD"
```

El script descarga Node **22.20.0** de `nodejs.org`, valida el SHA256 oficial y muestra al final la ruta creada bajo `~/codex-builds/galia-luna/`. No reemplaza el Node instalado en Ubuntu. Requiere `rsync`, `curl`, `tar`, `sha256sum` y `realpath`.

Asigna a `snapshot` la ruta mostrada, sin añadir `/source`:

```bash
snapshot=/home/TU_USUARIO/codex-builds/galia-luna/RUTA_MOSTRADA
export PATH="$snapshot/runtime/bin:$PATH"
export CI=1 NEXT_TELEMETRY_DISABLED=1 WRANGLER_SEND_METRICS=false
cd "$snapshot/source"
node -p 'process.version + " " + process.platform'
npm ci --no-audit --no-fund
```

La salida de Node debe indicar `linux` y una versión igual o superior a **22.13.0**. Ese mínimo permite ejecutar las pruebas que usan `node:sqlite`. No reutilices los `node_modules` de Windows.

## Sincronizar el código final

Detén los builds o previews de esta copia antes de sincronizar. Desde Ubuntu:

```bash
bash /mnt/c/PROYECTOS_WEB/GaliaLuna/scripts/wsl-snapshot.sh sync \
  /mnt/c/PROYECTOS_WEB/GaliaLuna "$snapshot"
cd "$snapshot/source"
```

La sincronización elimina archivos de fuente obsoletos únicamente dentro de la copia marcada. Conserva el Node portable, los `node_modules` Linux y los directorios de build. Si cambió `package-lock.json`, vuelve a ejecutar `npm ci --no-audit --no-fund` antes de compilar.

El script no copia `.git`, `.env*`, `.dev.vars*`, dependencias ni artefactos Windows. Los valores públicos de Sanity tienen defaults en el código. Para validar integraciones autenticadas, configura sus variables en la copia Linux de forma explícita; una compilación sin esas variables no verifica sesiones, permisos ni secretos de producción.

## Verificar y generar el worker

Desde el directorio `"$snapshot/source"`, con el PATH anterior:

```bash
set -o pipefail
npm run lint
npm run typecheck
npm test
npm run cf:build 2>&1 | tee "$snapshot/logs/cf-build.log"
test -s .open-next/worker.js
```

`cf:build` ya ejecuta la compilación Next y después genera el worker. La salida está en `.open-next/`. No ejecutes `cf:deploy` para una validación local. No uses `npm audit fix` en esta copia: los cambios de dependencias deben quedar revisados y registrados en el proyecto Windows.

Para comparar el lock del snapshot con el registrado por el script:

```bash
sha256sum --check "$snapshot/lock.sha256"
```

## Validación del entorno — 1 de octubre de 2026

- Ubuntu en WSL2, filesystem Linux ext4.
- Node portable 22.20.0 Linux y npm 10.9.3.
- La instalación anterior al desacoplamiento de Studio instaló 1.662 paquetes. La tienda ahora tiene un lock separado y ya no instala el editor ni su CLI; el número exacto puede variar por plataforma y dependencias opcionales.
- La nueva instalación Linux de la tienda instaló 700 paquetes; lint, TypeScript, 54 pruebas y la compilación OpenNext terminaron correctamente con ese lock.
- El Node global de Ubuntu era 20.19.5 y se conservó.

Los resultados de la compilación final se registran cuando termina la sincronización del código final; instalar dependencias por sí solo no confirma el build del worker.

## Validar Studio de forma independiente

Studio tiene su propio `studio/package-lock.json`. Desde `"$snapshot/source"`, con el mismo Node Linux:

```bash
npm run studio:install
npm run studio:typecheck
npm run studio:build
```

`npm ci` en la raíz no instala Studio. Estos pasos sólo son necesarios si se trabaja en el editor; el Worker se compila con las dependencias de la tienda. La sincronización excluye también `studio/node_modules`, artefactos y variables de entorno. Si cambia el lock de Studio, repite `npm run studio:install`. La configuración del editor sólo admite identificadores públicos `SANITY_STUDIO_PROJECT_ID` y `SANITY_STUDIO_DATASET`; nunca agregues tokens a variables con ese prefijo.

## Resultado de la validación

La compilación completa de OpenNext se ejecutó correctamente en Ubuntu WSL2 con Node22.20.0 Linux. Se generó .open-next/worker.js y se comprobó el Worker con Wrangler --local en el puerto3210. Las pruebas de interfaz interceptan cualquier pedido y navegación a WhatsApp. No se han desplegado cambios ni conectado la base D1 de producción.

Para abrir una vista previa de un snapshot ya compilado, desde su carpeta source y con el PATH indicado arriba:

```bash
npx wrangler dev --local --ip 127.0.0.1 --port 3210
```

Abrir http://127.0.0.1:3210 desde Windows. La advertencia de OpenNext sobre Windows nativo no aplica a esta compilación Linux. Se conserva la compatibility_date existente: cambiarla exige su propia validación. Los resultados detallados del rediseño y sus capturas están en el informe de entrega.
