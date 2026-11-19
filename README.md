# Abrakadabra Music

Aplicación frontend independiente para la futura tienda editorial de música de Abrakadabra. Vive en `AbrakadabraMusicFront` y no reemplaza `AbrakadabraPortalFront` ni `AbrakadabraBack`.

## Diagnóstico de partida

- El entorno existente contiene un frontend Next.js 16.2.6 / React 19 (`AbrakadabraPortalFront`) y un backend Express/MySQL (`AbrakadabraBack`), ambos como repositorios Git separados.
- El portal existente usa `Inter` y `Playfair Display` desde `next/font/google`; el rojo principal está definido como `oklch(0.55 0.22 15)` y el logo real está en `AbrakadabraPortalFront/public/Logo.png`.
- Music conserva `Inter` para interfaz, precios y listados, y usa un display local provisional (`Bodoni 72 Smallcaps Book`, con `Bodoni 72` y `Didot` como fallback) antes de caer en `Playfair Display`. El valor computado del rojo se traduce solo a la aplicación como `#b41b1b` para mantener un contraste legible sobre la base oscura. El logo se copia sin rediseñarlo.
- Se mantiene una base configurable: `NEXT_PUBLIC_MUSIC_BASE_PATH=/music npm run dev` prepara una futura publicación bajo `/music`. No se hizo deploy ni se modificó DNS.

## Ejecutar

```bash
cd AbrakadabraMusicFront
npm install
PORT=3001 NEXT_PUBLIC_API_URL=http://localhost:3000/api npm run dev
```

La app queda disponible en `http://localhost:3000` (o el puerto que Next elija). El script usa Webpack para evitar dependencias de Turbopack en un montaje aislado; no añade dependencias nuevas al proyecto existente.

## Catálogo conectado

La aplicación intenta cargar el catálogo publicado desde `NEXT_PUBLIC_API_URL` (por defecto `http://localhost:3000/api`) mediante `/music/artists`, `/music/releases` y `/music/tracks`. Si el backend todavía no tiene contenido publicado, conserva el catálogo demo local para facilitar el desarrollo. Las pistas usan `preview_url` cuando existe y, mientras tanto, mantienen el audio demo local.

El checkout requiere iniciar sesión para crear un pedido persistente. En desarrollo local se puede aprobar con el simulador y consultar el resultado en `/account/orders` y `/account/library`; no se realizan cobros reales.

El registro está disponible en `/account/register`. Después de crear una cuenta, la persona puede entrar en `/account/artist-application` para postular su proyecto. La solicitud queda en revisión hasta que un usuario autorizado la aprueba desde el Portal.

## Rutas implementadas

`/`, `/artists`, `/artists/:id`, `/releases`, `/releases/:id`, `/tracks`, `/tracks/:id`, `/search`, `/account`, `/account/login`, `/account/register`, `/account/recover`, `/account/library`, `/account/favorites`, `/account/orders`, `/cart` (el carrito también se abre como drawer), `/checkout` y `/checkout/result?status=approved|pending|rejected|cancelled`.

## Iteración actual: portada completa y discografía del artista

Esta iteración conserva las rutas y comportamientos de la primera versión, pero corrige la composición de `/artists/lua-mar` y del componente compartido de artistas:

- El referente de composición fue el [portafolio fotográfico de Behance](https://www.behance.net/gallery/217589361/Portafolio-fotografico) y la captura adjunta: fotografía a sangre, nombre centrado en la zona inferior, tipografía alta y contrastada, campo negro y lectura editorial. No se copiaron fotografías, autoría ni la paleta rosa de la referencia.
- El hero del artista ya no está dentro de un `container`: ocupa el ancho y el alto del viewport, empieza detrás de la cabecera, no tiene marco ni márgenes laterales y termina naturalmente antes de la discografía.
- La cabecera se superpone a la fotografía y adquiere fondo definido al desplazarse. La portada muestra nombre centrado, procedencia del catálogo, canciones y categorías reales de lanzamiento, más demo y exploración.
- Se usa `object-position` por artista y una posición móvil independiente. Los artistas sin fotografía autorizada reciben un degradado cromático, no una imagen generada ni iniciales superpuestas.
- Se probaron en composición real `Bodoni 72 Smallcaps Book`, `Bodoni 72` y `Didot` como candidatos locales; la elección actual es `Bodoni 72 Smallcaps Book`, provisional. El nombre de la fuente de la referencia no está confirmado. La candidata de investigación [Artistic Condensed de 177Studio](https://177studio.com/product/artistic-condensed-font/) ofrece OTF/TTF y licencias, pero el recurso/licencia web todavía no está incorporado al proyecto. No se declara resuelta la fidelidad tipográfica.
- La entrada coordina escala de fotografía, revelación de palabras del nombre, procedencia/cantidades y acciones. `prefers-reduced-motion` elimina zoom, desplazamientos y esperas; el provider de audio permanece fuera del contenido desmontable.
- La discografía conserva portadas grandes, precio COP, demo, compra, filtros reales y una composición de dos publicaciones para Lua Mar. La lista de canciones continúa debajo sin alterar favoritos, precios, conflicto álbum/pista ni carrito.
- Taste Skill, UI UX Pro Max e Impeccable no están instalados en este entorno y no se reportan como ejecutados. No se añadieron dependencias ni una biblioteca de animación.

La fotografía `public/artists/lua-mar-editorial-v2.png` es una imagen editorial original generada para validar la dirección de arte. Es un recurso temporal de demostración, no una fotografía autorizada del artista: debe sustituirse antes de publicar.

## Iteración actual: homepage como galería editorial

La portada `/` ahora abre con una galería horizontal de los cuatro lanzamientos reales del catálogo demo (`Luz de sal`, `Cartografía de la noche`, `Sudor lento` y `Archivo azul`). La dirección toma de la referencia la escala, el fondo negro continuo, los paneles altos redondeados y la composición de archivo, pero no copia sus fotografías, textos ni autoría.

- En reposo los paneles se mantienen en escala de grises; hover, foco o selección explícita activa un único panel, lo expande, devuelve el color y revela descripción, artistas, año y precio COP. La fila inferior de acciones fue retirada para que la imagen conserve el protagonismo.
- En móvil/tablet el carril usa desplazamiento horizontal con `scroll-snap`; en escritorio usa expansión por flex. No hay autoplay ni audio al pasar el cursor.
- El play de la galería reutiliza el mismo `MusicProvider` y `HTMLAudioElement` persistente. La ruta de detalle es un enlace nativo, por lo que no se pierde la reproducción al navegar.
- El contenido de ruta entra mediante un `route-view` con fade breve al cambiar de página; el provider, la barra de audio, carrito y avisos quedan fuera del nodo que se desmonta.
- La entrada usa stagger corto por panel, la expansión usa una curva editorial y todos los movimientos quedan anulados por `prefers-reduced-motion`.
- Debajo de la galería aparecen directamente los artistas destacados y después lanzamientos, pistas y nota editorial. No se reconstruyeron carrito, cuenta, checkout ni el motor de audio.

Los paneles usan cuatro portadas PNG ficticias generadas para esta iteración en `public/releases/*-cover-v1.png`. Los artistas destacados incorporan retratos PNG ficticios en `public/artists/nomada-lumen-editorial-v1.png`, `public/artists/clara-humo-editorial-v1.png` y `public/artists/rito-verde-editorial-v1.png`; Lua Mar conserva su recurso editorial demo anterior. Son material de exploración visual, no portadas ni fotografías oficiales o autorizadas; antes de publicar deben sustituirse por recursos aprobados y recortes verticales definidos por lanzamiento.

El hover de la galería mantiene una altura fija por panel y anima únicamente el reparto horizontal, el color y la revelación del metadato. La imagen no escala de forma agresiva ni altera la posición vertical de las demás tarjetas; `prefers-reduced-motion` sigue anulando las transiciones.

## Estado de implementación

- Fase A: completada. App aislada, tokens registrados, base path preparado y datos de dominio separados de los componentes.
- Fase B: completada. Home editorial, directorios, artistas, lanzamientos, pistas, filtros, estados vacíos y portadas demo locales.
- Fase C: completada. Un único `HTMLAudioElement` persistente, barra inferior, audio demo local, búsqueda, carrito persistente, deduplicación y conflicto álbum/pista explícito.
- Fase D: completada como simulación. Login/registro/recuperación visual, perfil, favoritos, biblioteca/pedidos, checkout y estados aprobado/pendiente/rechazado/cancelado. No se guardan contraseñas ni se simula un cobro real.
- Fase E: completada en primera pasada. Responsive 360/390/768/1440, foco visible, botones semánticos, `prefers-reduced-motion`, reserva de espacio para el player y transiciones discretas.
- Fase F: primera dirección editorial aplicada.
- Fase G: portada de artista a pantalla completa y discografía visual aplicada al componente compartido.
- Fase H: homepage de galería editorial interactiva aplicada; audio, carrito, cuenta, checkout, Portal y Back permanecen fuera del alcance de esa iteración.
- Fase I: visualizador de pista aplicado en `/tracks/:id` con fondo negro, análisis de frecuencia en tiempo real, controles locales y ocultación contextual de la barra global.

## Verificaciones ejecutadas

- `npx tsc --noEmit` — OK.
- `npx next build --webpack` — OK, compilación de producción, TypeScript y generación de rutas.
- `npm install --package-lock-only --offline` — no disponible en este entorno porque el caché no contiene `next@16.2.6`; el proyecto conserva las mismas versiones base declaradas por el frontend existente.
- `npm run lint` — pendiente de configuración: el frontend existente no declara ESLint como dependencia y esta app no incorpora otra dependencia solo para linting.
- Verificación manual con navegador a 1512×801 en esta iteración: fotografía de 1512×801 a borde completo, cabecera superpuesta, nombre centrado, datos y acciones visibles; scroll con cabecera definida; discografía con dos portadas; filtros y compra; artista sin fotografía (`Clara y Humo`) sin overflow horizontal y con nombre largo en dos líneas. La fuente computada se verificó como `"Bodoni 72 Smallcaps Book", "Bodoni 72", Didot, ...` y la existencia local mediante `document.fonts`.
- Verificación manual de homepage en navegador a 1512×801: reposo, primer panel activo, cambio al segundo panel, foco de teclado en play y enlace de lanzamiento, y recorrido al detalle de `Luz de sal`.
- En esa misma regresión, el demo `Fulgor de patio` mostró la barra `Reproductor de demos` y, después de navegar a `/releases/luz-de-sal`, la barra y el estado de reproducción siguieron presentes.
- Capturas reales realizadas: homepage en reposo, homepage con `Luz de sal` expandido, homepage tras cambiar de panel y detalle de lanzamiento con player persistente. Las capturas se hicieron en el navegador disponible; no se exportó un archivo de vídeo.
- Regresión funcional heredada y repetida contra el mismo frontend: rutas de catálogo, búsqueda sin resultados, filtros, player único, carrito persistente tras recarga, drawer, deduplicación, conflicto álbum/pista, checkout aprobado y login demo con carrito — OK.
- La app incluye breakpoints CSS para 900 y 620 px, focal móvil independiente y espacio inferior para el reproductor. El conector de navegador usado en esta sesión no expone viewport override: no declaro como realizadas las capturas automatizadas 390×844 ni 360×800, aunque las reglas están implementadas y pendientes de revisión visual en un viewport móvil real.
- No se pudo producir una grabación de pantalla exportable con las herramientas disponibles; por eso el recorrido inicio → artista → demo → lanzamiento → carrito queda probado manualmente, pero no se marca como grabación entregada.

## Visualizador de pista y audio demo

La página individual de pista (`/tracks/:id`) usa un canvas negro de 56 barras simétricas conectado al `AnalyserNode` del mismo reproductor persistente. El MP3 de demostración se reutiliza para todas las pistas del catálogo local. Dentro de la pista la barra global se oculta y el control aparece junto al visualizador; al salir de la ruta vuelve la barra inferior. El botón `Cerrar reproductor` pausa y retira la barra cuando el usuario lo solicita.

El archivo local `public/audio/nighttime-solitude-cc0.mp3` es “Nighttime Solitude”, de celestialghost8, descargado desde OpenGameArt bajo CC0. La fuente y la licencia están documentadas en `public/audio/README.md`. Es solo un audio de validación visual y debe sustituirse por demos/másters autorizados antes de publicar.

## Datos y recursos pendientes

El catálogo es demo y está marcado como tal en UI. Las portadas actuales son cuatro imágenes PNG ficticias generadas para validar dirección de arte; el retrato de Lua Mar es una imagen editorial original temporal para validar la composición. El reproductor usa un MP3 CC0 local compartido para validar controles, eventos, pausa, cambio rápido, análisis de frecuencia y fin de reproducción; no representa demos musicales oficiales del catálogo.

Recursos que deben sustituirse antes de una publicación: fotografía protagonista autorizada de cada artista, fotografías de historia/galería, los tres retratos editoriales demo añadidos en esta iteración, portadas finales y banners aprobados, demos de audio autorizados y sus peaks/waveforms. La UI marca explícitamente que el archivo visual de Lua Mar está pendiente. No se descargaron imágenes ni audios del referente.

Faltan para una siguiente fase: portadas autorizadas cuadradas (mínimo 1600×1600), retratos editoriales autorizados (3:4, mínimo 1200×1600), banner/hero autorizado (16:9), previews recortados autorizados por pista y peaks/waveforms correspondientes. No se descargaron imágenes ni audios de las referencias comerciales.

## Pendientes de backend

Implementar adaptadores reales para catálogo, sesión, carrito, pedidos y descargas; validar precio, moneda, disponibilidad y conflicto de ofertas en servidor; integrar el proveedor de pagos que se defina; comprobar webhook/estado del pago; emitir pedidos y derechos de descarga privados; biblioteca basada en compras reales; autorización, rate limiting, auditoría y entrega protegida de archivos. Ningún estado local del frontend concede derechos reales.
