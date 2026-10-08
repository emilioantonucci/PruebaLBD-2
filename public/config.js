/* Configuración técnica de la práctica.
   agentes: "servicio" → IA real (Gemini) a través de /api/agente en Vercel.
            "demo"     → asistente y revisión simulados en el navegador (sin API).
   proxyUrl: dirección del servicio. Relativa cuando el componente se sirve desde Vercel;
             la página /preparar-rise.html genera el ZIP de Rise con la dirección absoluta. */
window.LBD_CONFIG = {
  agentes: "servicio",
  proxyUrl: "/api/agente",
  mostrarAvisoDemo: true,
  modo: "rise"
};
