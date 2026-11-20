# Abrakadabra Music Frontend

Frontend de catálogo y reproducción para Abrakadabra Music. Está construido con Next.js 16, React 19 y TypeScript.

## Desarrollo local

```bash
npm install
npm run dev
```

La aplicación abre en el puerto 3000 por defecto. El catálogo remoto usa `NEXT_PUBLIC_API_URL`; si la API no responde, la portada usa un respaldo local reducido a los perfiles conocidos de artistas, los tres demos suministrados y el pack SOLARIS.

## Contenido del respaldo

- Artistas: 8BATZZ, Esteban Arenas, Alankoll y perfiles reales importados de la página de DJs de Abrakadabra.
- Demos con audio propio: “Lose Control”, “Arkana” e “IDxx”.
- SOLARIS: pack de 10 canciones. Los títulos individuales aún no están publicados.
- Un preview sin archivo propio no reproduce audio de sustitución.

Los datos del pack y su licencia se basan en el documento de SOLARIS compartido por el equipo. Los perfiles y el catálogo publicados por la API se muestran desde el backend.

## Rutas principales

`/`, `/artists`, `/artists/:id`, `/releases`, `/releases/:id`, `/tracks`, `/tracks/:id`, `/search`, `/cart`, `/checkout` y `/account`.

## Diseño móvil y accesibilidad

La galería, los retratos, las tarjetas, los formularios y el reproductor se adaptan por breakpoint. Las imágenes locales usan `next/image` con tamaños responsivos; las imágenes remotas del catálogo conservan carga directa para aceptar los hosts configurados por el backend. El reproductor considera el área segura inferior del dispositivo, los controles táctiles tienen mayor superficie y las animaciones respetan `prefers-reduced-motion`.
