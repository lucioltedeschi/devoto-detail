# Devoto Detail

Primera etapa: experiencia pública de alta fidelidad, con datos de demostración. React 19, Next.js App Router / Vinext, TypeScript, Three.js y GSAP 3.15.0. El despliegue privado de revisión usa Sites; el proyecto también incluye configuración de Vercel para Next.js.

## Ejecutar

- `pnpm install --frozen-lockfile`
- `pnpm dev` — entorno de revisión Vinext.
- `pnpm dev:next` — desarrollo Next.js convencional.
- `pnpm build:vercel` — build Next.js para Vercel.
- `pnpm exec tsc --noEmit` — validación de tipos.

En Vercel, importar el repositorio, usar el preset Next.js y el comando `npm run build:vercel`. No se necesitan claves para esta primera etapa.

## Implementado

- Golf GTI Mk7.5 gris en 3D real: recorrido de cámara, acercamiento al capot y barrido de corrección sobre la misma geometría.
- Materiales físicos, luces de estudio y reflejos WebGL; render de geometría por CPU cuando WebGL no está disponible.
- Modelos comprimidos con Meshopt: principal de ~16 MB, con variante para compatibilidad.
- Animación reversible con GSAP ScrollTrigger; alternativa con movimiento reducido.
- Filtro de servicios y fichas con precios fijo, desde, rango y consultar; tarifas por vehículo.
- Comparador accesible antes/después.
- Galería filtrable y fichas de trabajos.
- Tienda de muestra, variantes de talle, cantidades, carrito persistente y resumen copiable.
- Paneles laterales con foco contenido, cierre Escape y restauración de foco.
- Menú móvil y layouts responsive.

## Límites de esta etapa

No hay pedidos reales, cobros, reservas confirmadas, autenticación ni panel administrativo conectado. Los códigos de descuento se reconocen como no disponibles. No se inventó el número de WhatsApp: las consultas abren un panel con el Instagram del negocio. No cargar claves secretas en el navegador.

El panel de administración, el catálogo persistente, promociones y RLS de Supabase corresponden a la segunda etapa tras revisar la UI y configurar el proyecto real. `@supabase/supabase-js` está instalado para esa integración, pero no está conectado. El cierre de carrito sigue pendiente de decisión.

## Contenido y recursos

`lib/catalog.ts` centraliza servicios, productos, precios y trabajos de demostración. Los precios no son tarifas confirmadas. Las categorías y descripciones de trabajos son ilustrativas.

- `public/images/logo.webp`: logo de perfil descargado de https://www.instagram.com/devoto.detail/ (150 px; reemplazar por original).
- `public/images/work-*.webp`: fotos publicadas por el negocio, descargadas de Instagram; comprimidas, reemplazables por originales.
- `public/images/hero-clean.webp` y `hero-before.webp`: recursos creados con Imagegen para esta portada. Misma composición de auto grafito limpio y con suciedad.
- `public/images/macro-clean.webp` y `macro-before.webp`: macro generado de inspección de pintura, estados con y sin microarañazos.
- `public/images/products.webp` y `apparel.webp`: mockups generados, no fotos de productos existentes.

Las imágenes generadas son ilustraciones publicitarias, no trabajos reales del taller. Las parejas se derivaron por edición conservando composición. Los PNG originales están en el espacio de trabajo de la sesión y las copias WebP optimizadas se versionan con el proyecto.

### Briefs utilizados en Imagegen

1. Hero: fotografía automotriz premium, auto deportivo grafito en tres cuartos mirando a izquierda, taller negro con iluminación lineal blanca, acabado espejo, encuadre panorámico sin personas ni texto.
2. Antes: edición del hero conservando encuadre, geometría, luces y fondo; agregar película de suciedad, llantas polvorientas y acabado opaco, sin daños de choque ni cambio de color.
3. Macro: pintura grafito metálica bajo reflexión de lámpara de inspección circular, marcas de lavado y microarañazos visibles, composición panorámica.
4. Macro corregido: edición del macro conservando luz y encuadre, eliminar rayas y opacidad manteniendo pigmento metálico.
5. Productos: fotografía de estudio de botellas negras y microfibra, packaging Devoto de muestra, luz lateral suave.
6. Ropa: fotografía flat lay de remera negra con marca pequeña Devoto Detail, textura de algodón y estudio oscuro.

## Antes de publicar al público

Cargar logo de alta resolución, catálogo y precios reales, datos exactos del local y WhatsApp; reemplazar mockups de tienda. Completar Supabase Auth, permisos/RLS, almacenamiento, validaciones de servidor y flujo real de pedidos. La versión de revisión permanece privada.

## Modelo 3D y optimización

Modelo provisto por el usuario: Volkswagen Golf GTI Mk7.5, autor DR1KING100K, licencia CC BY 4.0. Fuente: https://sketchfab.com/3d-models/volkswagen-golf-gti-mk75-9f6a2b0181704d2fbfff45ca089fbd47. Se adaptaron materiales, mallas y compresión; se conserva la atribución en la página. El modelo incluye modificaciones estéticas del autor.

Los archivos finales están en `public/models/`. El GLB original de 92 MB no se necesita para ejecutar la web. Para regenerarlos con el original:

```bash
node scripts/assets/prepare-golf.mjs /ruta/al/original.glb
node scripts/assets/prepare-golf-fallback.mjs
```

La variante principal conserva los 1.031.145 triángulos originales, incluidos interior y mecánica. Posiciones y normales se mantienen en Float32: no se decima, cuantiza ni recalculan normales. Meshopt solo comprime los buffers. WebGL usa supersampling de al menos 2× en escritorio, MSAA 4× y SSAO de 32 muestras. La vista CPU simplificada requiere selección explícita cuando WebGL no está disponible; nunca reemplaza silenciosamente el render completo.

`components/GolfScene.tsx` configura el recorrido, materiales y render WebGL. `lib/software-golf.ts` implementa el modo compatible, que proyecta la malla real y renderiza únicamente cuando cambia el scroll. Los recursos fotográficos anteriores se conservan para el comparador ilustrativo secundario.

Validación: tipos, build y revisión de escena en navegador con render compatible. El navegador remoto de revisión tiene WebGL deshabilitado; los materiales físicos y reflejos GPU requieren comprobación final en un navegador con aceleración gráfica.
