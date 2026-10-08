# LBD · Práctica 1 · PRODUCIR

Componente único (Momentos 1 a 7) para un bloque de código de Rise 360 y servicio de agentes con IA (Vercel + Gemini).

## Estructura

| Ruta | Contenido |
|---|---|
| `public/` | Componente de la práctica (escenario 360°, canal interno, nota de voz, mesa de trabajo, espacio de producción, revisión y cierre) y medios originales. |
| `public/preparar-rise.html` | Página que genera el ZIP para Rise con la dirección del servicio ya incorporada. |
| `public/agentes-demo.js` | Agentes simulados para la versión demo (sin API). |
| `api/agente.js` | Función serverless con los dos agentes separados: asistente de producción y agente de revisión. Sus instrucciones viven solo aquí. |
| `vercel.json` | Configuración de Vercel. |

## Seguridad

La clave de Gemini **no se guarda en este repositorio**. Se carga en Vercel como variable de entorno `GEMINI_API_KEY`.
Variable opcional: `GEMINI_MODELO` para fijar un modelo concreto (por defecto se prueban `gemini-flash-latest`, `gemini-3.5-flash` y `gemini-2.5-flash`, en ese orden).

## Publicación

1. Subir este repositorio a GitHub (con GitHub Desktop: el video supera el límite de 25 MB de la carga por navegador).
2. En Vercel: **Add New → Project → Import** el repositorio. Framework preset: **Other**.
3. En **Environment Variables**, agregar `GEMINI_API_KEY` con la clave de Google AI Studio. **Deploy**.
4. Abrir `https://<proyecto>.vercel.app/preparar-rise.html`, comprobar el estado del servicio y descargar el ZIP.
5. En Rise: bloque **Code → Upload project** con el ZIP y **Set completion requirements** activado; debajo, un bloque **Continue** que exija completar el bloque anterior, el cierre conceptual y el Kit como adjunto.

## Alternativas

- **Sin IA:** la página de preparación también descarga un ZIP demo con agentes simulados.
- **Si Rise bloquea la conexión externa:** la misma página muestra el código para un bloque Embed que carga la versión alojada (`/?modo=embebido`), con el cierre y el Kit dentro del componente.

## Pruebas

Dentro de la práctica, **Ctrl + Alt + Shift + R** reinicia el avance guardado en el navegador.
