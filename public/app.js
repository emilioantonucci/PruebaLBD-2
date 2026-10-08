/* LBD · Práctica 1 · PRODUCIR — Componente único M1–M7 para bloque de código de Rise 360. */
(function () {
  "use strict";
  var C = window.LBD_CONTENIDO;
  var CFG = window.LBD_CONFIG || {};
  var CLAVE = "lbd-producir-practica1-v1";
  var params = new URLSearchParams(location.search);
  var MODO = params.get("modo") || CFG.modo || "rise";       // "rise" | "embebido"
  var app = document.getElementById("app");
  var visor = null;            // instancia Pannellum
  var timers = [];

  /* =============================== ESTADO =============================== */
  function estadoInicial() {
    return {
      v: 1, pantalla: "escena", capa: null, escenaPaso: "ribas", escenaIntroVista: false,
      ribasVisto: false, martaVisto: false,
      lecturaInicial: "", proposito: "", propositoHistorial: [],
      comprobacion: { intentos: [], resuelta: false, sel: null },
      revisados: { presupuesto: false, comprobante: false, mensaje: false },
      mesaAbierto: null, mesaVista: "doc",
      presupuestoSel: [], mensajeDecision: { cronologia: false, antecedente: false, noUsar: false, registrada: false },
      referencias: [], notas: [],
      tarjetas: {}, criterio: "", criterioGuardado: false,
      m3IntroVista: false, tab: "asistente",
      chat: [], borrador: "",
      v1: null, autocheck: {},
      entregas: [], observaciones: [], obsSeq: 0, revisadas: [],
      enRevision: false, ajustePendiente: false, revisionesPropias: [],
      registro: { instruccionInicial: "", ajustes: [], incorporaciones: [] },
      reflexion: { decision: "", regla: "" },
      finalizada: false
    };
  }
  var S;
  var almacenOk = true;
  function cargar() {
    try { var s = localStorage.getItem(CLAVE); S = s ? JSON.parse(s) : estadoInicial(); }
    catch (e) { almacenOk = false; S = estadoInicial(); }
    var base = estadoInicial();
    Object.keys(base).forEach(function (k) { if (S[k] === undefined) S[k] = base[k]; });
  }
  var tGuardar = null;
  function guardarYa() {
    clearTimeout(tGuardar);
    if (!almacenOk) return;
    try { localStorage.setItem(CLAVE, JSON.stringify(S)); } catch (e) { almacenOk = false; avisoTecnico("El navegador no permite conservar el avance en este entorno."); }
  }
  function guardar() { clearTimeout(tGuardar); tGuardar = setTimeout(guardarYa, 350); }
  function ir(pantalla, extra) {
    if (extra) Object.keys(extra).forEach(function (k) { S[k] = extra[k]; });
    S.pantalla = pantalla; guardarYa(); render();
  }

  /* ============================== UTILIDADES ============================= */
  function el(tag, atr) {
    var n = document.createElement(tag);
    if (atr) Object.keys(atr).forEach(function (k) {
      var v = atr[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k.indexOf("on") === 0) n.addEventListener(k.slice(2), v);
      else if (k === "disabled" || k === "hidden" || k === "checked") n[k] = !!v;
      else n.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) agregar(n, arguments[i]);
    return n;
  }
  function agregar(n, h) {
    if (h === null || h === undefined || h === false) return;
    if (Array.isArray(h)) { h.forEach(function (x) { agregar(n, x); }); return; }
    n.appendChild(typeof h === "string" ? document.createTextNode(h) : h);
  }
  function btn(texto, onclick, clase, extra) {
    var a = { class: "btn " + (clase || ""), type: "button", onclick: onclick, text: texto };
    if (extra) Object.keys(extra).forEach(function (k) { a[k] = extra[k]; });
    return el("button", a);
  }
  function limpiarTimers() { timers.forEach(clearTimeout); timers = []; }
  function luego(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function uid(p) { return (p || "id") + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function fechaHora() { return new Date().toLocaleString("es", { dateStyle: "short", timeStyle: "short" }); }
  function iniciales(n) { return n.replace("Dr. ", "").split(" ").map(function (p) { return p[0]; }).slice(0, 2).join(""); }
  function avisoTecnico(t) {
    var v = document.querySelector(".aviso-tec"); if (v) v.remove();
    var a = el("div", { class: "aviso-tec", role: "status", text: t }); document.body.appendChild(a);
    setTimeout(function () { a.remove(); }, 7000);
  }
  function sonarNotificacion() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
      var ctx = new Ctx(); var t = ctx.currentTime;
      [[880, 0], [1320, 0.16]].forEach(function (f) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = f[0];
        g.gain.setValueAtTime(0.0001, t + f[1]); g.gain.exponentialRampToValueAtTime(0.18, t + f[1] + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + f[1] + 0.28);
        o.connect(g).connect(ctx.destination); o.start(t + f[1]); o.stop(t + f[1] + 0.3);
      });
      setTimeout(function () { ctx.close(); }, 900);
    } catch (e) {}
  }
  function propositoVigente() { return S.proposito || S.lecturaInicial; }
  function textoRef(r) { return r.texto + " (" + r.fuente + ")"; }

  /* ================================ RED ================================= */
  function usaDemo() { return (CFG.agentes || "demo") === "demo"; }
  function llamar(cuerpo) {
    if (usaDemo()) {
      if (!window.LBD_AGENTES_DEMO) return Promise.reject(new Error("No se encontró el módulo de agentes de demostración."));
      return window.LBD_AGENTES_DEMO.llamar(JSON.parse(JSON.stringify(cuerpo))).then(function (j) { if (!j || !j.ok) throw new Error((j && j.error) || "Error del módulo de demostración"); return j; });
    }
    var url = (CFG.proxyUrl || "").trim();
    if (!url) return Promise.reject(new Error("SIN_SERVICIO"));
    var ctrl = new AbortController(); var t = setTimeout(function () { ctrl.abort(); }, 120000);
    return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo), signal: ctrl.signal })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: "Respuesta no válida (" + r.status + ")" }; }); })
      .then(function (j) { clearTimeout(t); if (!j || !j.ok) throw new Error((j && j.error) || "Error del servicio"); return j; },
            function (e) { clearTimeout(t); throw new Error(e.name === "AbortError" ? "El servicio tardó demasiado en responder." : "No se pudo conectar con el servicio."); });
  }
  function mensajeError(e) {
    if (e && e.message === "SIN_SERVICIO") return "El asistente del estudio todavía no está conectado (falta configurar el servicio intermedio).";
    return "No se obtuvo respuesta: " + (e && e.message ? e.message : "error desconocido") + " Su trabajo quedó guardado; puede reintentar.";
  }

  /* ============================== RENDER ============================== */
  function render() {
    limpiarTimers();
    if (S.pantalla !== "escena" && visor) { try { visor.destroy(); } catch (e) {} visor = null; }
    if (S.pantalla !== "escena") app.innerHTML = "";
    switch (S.pantalla) {
      case "escena": pantallaEscena(); break;
      case "mesa": pantallaMesa(); break;
      case "trabajo": pantallaTrabajo(); break;
      case "v1guardada": pantallaV1Guardada(); break;
      case "autocheck": pantallaAutocheck(); break;
      case "observacion": pantallaObservacion(); break;
      case "revisando": pantallaRevisando(); break;
      case "resultado": pantallaResultado(); break;
      case "revisadaGuardada": pantallaRevisadaGuardada(); break;
      case "cierre": pantallaCierre(); break;
      case "finalizada": pantallaFinalizada(); break;
      default: S.pantalla = "escena"; pantallaEscena();
    }
  }

  /* ========================== MOMENTO 1 · ESCENA ========================= */
  function hayWebGL() {
    try { var c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl"))); }
    catch (e) { return false; }
  }
  var hsActivo = null, visorListo = false, hsPendiente = null;
  function crearHotspotDom(div, id) {
    var h = C.hotspots[id];
    div.classList.add("hs");
    div.setAttribute("role", "button"); div.setAttribute("tabindex", "0"); div.setAttribute("aria-label", h.etiqueta);
    div.appendChild(el("div", { class: "punto" }));
    div.appendChild(el("span", { class: "rot", text: h.etiqueta }));
    var activar = function (ev) { ev.stopPropagation(); ev.preventDefault(); clicHotspot(id); };
    div.addEventListener("click", activar);
    div.addEventListener("pointerup", function (ev) { ev.stopPropagation(); });
    div.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") activar(ev); });
  }
  function mostrarHotspot(id) {
    if (hsActivo === id) return;
    quitarHotspot();
    hsActivo = id;
    var h = C.hotspots[id];
    if (visor && !visorListo) { hsPendiente = id; hsActivo = null; return; }
    if (visor) {
      visor.addHotSpot({ id: "hs-" + id, pitch: h.pitch, yaw: h.yaw, cssClass: "hs-pn", createTooltipFunc: function (div) { crearHotspotDom(div, id); } });
    } else {
      var lienzo = document.querySelector(".plano .lienzo"); if (!lienzo) return;
      var d = el("div", { id: "hs-" + id, style: "left:" + ((h.yaw / 360 + 0.5) * 100) + "%;top:" + ((0.5 - h.pitch / 180) * 100) + "%" });
      crearHotspotDom(d, id); lienzo.appendChild(d);
    }
  }
  function quitarHotspot() {
    hsPendiente = null;
    if (!hsActivo) return;
    if (visor) { try { visor.removeHotSpot("hs-" + hsActivo); } catch (e) {} }
    else { var d = document.getElementById("hs-" + hsActivo); if (d) d.remove(); }
    hsActivo = null;
  }
  function mirarA(id) {
    var h = C.hotspots[id];
    if (visor) { try { visor.lookAt(Math.max(h.pitch + 18, -40), h.yaw, 100, 1400); } catch (e) {} }
    else { var p = document.querySelector(".plano"); if (p) p.scrollTo({ left: (h.yaw / 360 + 0.5) * p.scrollWidth - p.clientWidth / 2, behavior: "smooth" }); }
  }

  function pantallaEscena() {
    var escena = document.getElementById("escena");
    if (!escena) {
      app.innerHTML = "";
      escena = el("div", { id: "escena" }, el("div", { id: "pano" }));
      app.appendChild(escena);
      if (hayWebGL() && window.pannellum) {
        visor = window.pannellum.viewer("pano", {
          type: "equirectangular", panorama: "media/oficina.jpg", autoLoad: true,
          showControls: false, showZoomCtrl: false, showFullscreenCtrl: false, keyboardZoom: false, mouseZoom: true,
          yaw: 0, pitch: -4, hfov: 110, minHfov: 70, maxHfov: 110,
          minYaw: -125, maxYaw: 125, minPitch: -80, maxPitch: 42, friction: 0.25, hotSpots: []
        });
        visorListo = false;
        visor.on("load", function () { visorListo = true; if (hsPendiente) { var p = hsPendiente; hsPendiente = null; mostrarHotspot(p); } });
        visor.on("mousedown", ocultarAyuda); visor.on("touchstart", ocultarAyuda);
      } else {
        var plano = el("div", { class: "plano" }, el("div", { class: "lienzo" }, el("img", { src: "media/oficina.jpg", alt: "Oficina del estudio jurídico" })));
        escena.appendChild(plano); plano.addEventListener("scroll", ocultarAyuda, { once: true });
        setTimeout(function () { plano.scrollLeft = (plano.scrollWidth - plano.clientWidth) / 2; }, 50);
      }
      escena.appendChild(el("div", { class: "ahora", role: "status", "aria-live": "polite" }, el("div", { class: "et", text: "Ahora" }), el("div", { class: "tx" })));
      if (!S.escenaIntroVista) {
        var intro = el("div", { class: "inicio-escena" }, el("div", { class: "dia", text: C.escena.dia }), el("div", { class: "lugar", text: C.escena.lugar }));
        var ayuda = el("div", { class: "ayuda-arrastre", text: C.escena.ayudaArrastre });
        escena.appendChild(intro); escena.appendChild(ayuda);
        setTimeout(function () { intro.classList.add("fuera"); }, 1900);
        setTimeout(function () { intro.remove(); }, 3200);
        setTimeout(ocultarAyuda, 8500);
        S.escenaIntroVista = true; guardar();
      }
      hsActivo = null;
    }
    // "Ahora" y hotspot del paso actual
    var ahora = escena.querySelector(".ahora");
    ahora.querySelector(".tx").textContent = C.ahora[S.escenaPaso] || "";
    ahora.style.opacity = S.capa ? "0" : "1";
    if (S.escenaPaso === "esperaMarta") { ahora.style.opacity = "0"; quitarHotspot(); }
    else if (!S.capa) mostrarHotspot(S.escenaPaso === "ribas" ? "ribas" : S.escenaPaso === "marta" ? "marta" : "carpeta");
    var vieja = escena.querySelector(".capa"); if (vieja) vieja.remove();
    if (S.capa === "canal") escena.appendChild(capaCanal());
    if (S.capa === "voz") escena.appendChild(capaVoz());
    if (S.capa === "lectura") escena.appendChild(capaLectura());
    if (S.capa === "comprobacion") escena.appendChild(capaComprobacion());
    if (S.escenaPaso === "esperaMarta") programarMarta();
    var foco = escena.querySelector(".capa [data-foco]"); if (foco) setTimeout(function () { foco.focus(); }, 60);
  }
  function ocultarAyuda() { var a = document.querySelector(".ayuda-arrastre"); if (a) { a.classList.add("fuera"); setTimeout(function () { a.remove(); }, 900); } }

  function clicHotspot(id) {
    if (id !== hsActivo) return;
    if (id === "ribas") { quitarHotspot(); S.capa = "canal"; }
    else if (id === "marta") { quitarHotspot(); S.capa = "voz"; }
    else if (id === "carpeta") { quitarHotspot(); entrarMesa(); return; }
    guardarYa(); pantallaEscena();
  }
  var martaProgramada = false;
  function programarMarta() {
    if (martaProgramada) return; martaProgramada = true;
    setTimeout(function () { martaProgramada = false; }, 1700);
    luego(function () {
      sonarNotificacion();
      S.escenaPaso = "marta"; guardarYa();
      pantallaEscena(); mirarA("marta");
    }, 1600);
  }
  function entrarMesa() {
    var escena = document.getElementById("escena");
    if (visor) { try { var h = C.hotspots.carpeta; visor.lookAt(h.pitch + 6, h.yaw, 60, 900); } catch (e) {} }
    var paso = el("div", { class: "paso-mesa" }); escena.appendChild(paso);
    setTimeout(function () { paso.classList.add("dentro"); }, 400);
    setTimeout(function () { S.capa = null; ir("mesa"); }, 1400);
  }

  /* --- canal interno con el video de Ribas --- */
  function bloqueVideoRibas(alVer) {
    var video = el("video", { src: "media/ribas.mp4", preload: "metadata", playsinline: "", "aria-label": "Mensaje de video del Dr. Andrés Ribas" });
    var play = el("button", { class: "play", type: "button", "data-foco": "" }, el("span", { class: "ic", text: "▶" }), "Reproducir mensaje");
    play.addEventListener("click", function () { video.setAttribute("controls", ""); play.remove(); video.play().catch(function () {}); });
    video.addEventListener("play", alVer);
    var trans = el("div", { class: "transcripcion", hidden: true }, C.ribas.transcripcion.map(function (p) { return el("p", { text: p }); }));
    var bTrans = el("button", { class: "enlace", type: "button", text: "Ver transcripción", "aria-expanded": "false" });
    bTrans.addEventListener("click", function () {
      trans.hidden = !trans.hidden; bTrans.textContent = trans.hidden ? "Ver transcripción" : "Ocultar transcripción";
      bTrans.setAttribute("aria-expanded", String(!trans.hidden)); if (!trans.hidden) alVer();
    });
    return el("div", null,
      el("div", { class: "msg" }, el("div", { class: "avatar", text: iniciales(C.ribas.nombre) }),
        el("div", null,
          el("div", { class: "quien", text: C.ribas.nombre }),
          el("div", { class: "meta", text: C.ribas.meta }),
          el("div", { class: "asunto", text: C.ribas.asunto }),
          el("div", { class: "tipo", text: C.ribas.tipo }),
          el("div", { class: "reproductor" }, video, play),
          el("div", { style: "margin-top:8px" }, bTrans), trans)));
  }
  function capaCanal() {
    var cerrar = btn("Cerrar mensaje", function () {
      S.capa = null; S.escenaPaso = "esperaMarta"; guardarYa(); pantallaEscena();
    }, "", { disabled: !S.ribasVisto });
    var alVer = function () { if (!S.ribasVisto) { S.ribasVisto = true; guardar(); } cerrar.disabled = false; };
    return el("div", { class: "capa", role: "dialog", "aria-modal": "true", "aria-label": "Canal interno del estudio" },
      el("div", { class: "canal" },
        el("div", { class: "lat" },
          el("div", { class: "nombre", text: "Estudio jurídico" }),
          el("div", { class: "grupo", text: "Mensajes" }),
          el("div", { class: "item activo" }, C.ribas.nombre, el("span", { class: "no", "aria-hidden": "true" }))),
        el("div", { class: "cuerpo" },
          el("div", { class: "cab", text: C.ribas.asunto }),
          el("div", { class: "hilo" }, bloqueVideoRibas(alVer)),
          el("div", { class: "pie" }, cerrar))));
  }

  /* --- nota de voz de Marta --- */
  function bloqueNotaVoz(alVer) {
    var audio = el("audio", { src: "media/marta.mp3", preload: "metadata" });
    var barras = []; var onda = el("div", { class: "onda", "aria-hidden": "true" });
    var alturas = [30, 55, 40, 70, 45, 85, 60, 35, 75, 50, 90, 40, 65, 30, 80, 55, 45, 70, 35, 60, 85, 50, 40, 75, 30, 65, 55, 45, 80, 35, 60, 50];
    alturas.forEach(function (a) { var i = el("i", { style: "height:" + a + "%" }); barras.push(i); onda.appendChild(i); });
    var tiempo = el("span", { class: "tiempo", text: "0:38" });
    var pp = el("button", { class: "pp", type: "button", "aria-label": "Reproducir audio", text: "▶", "data-foco": "" });
    pp.addEventListener("click", function () { if (audio.paused) audio.play().catch(function () {}); else audio.pause(); });
    function fmt(s) { if (!isFinite(s)) return "0:38"; s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
    audio.addEventListener("loadedmetadata", function () { tiempo.textContent = fmt(audio.duration); });
    audio.addEventListener("play", function () { pp.textContent = "❚❚"; pp.setAttribute("aria-label", "Pausar audio"); });
    audio.addEventListener("pause", function () { pp.textContent = "▶"; pp.setAttribute("aria-label", "Reproducir audio"); });
    audio.addEventListener("timeupdate", function () {
      var f = audio.duration ? audio.currentTime / audio.duration : 0;
      barras.forEach(function (b, i) { b.classList.toggle("on", i / barras.length < f); });
      tiempo.textContent = fmt(audio.currentTime || 0);
    });
    audio.addEventListener("ended", function () { tiempo.textContent = fmt(audio.duration); alVer(); });
    onda.addEventListener("click", function (ev) { var r = onda.getBoundingClientRect(); if (audio.duration) audio.currentTime = (ev.clientX - r.left) / r.width * audio.duration; });
    var trans = el("div", { class: "transcripcion", hidden: true }, C.marta.transcripcion.map(function (p) { return el("p", { text: p }); }));
    var bTrans = el("button", { class: "enlace", type: "button", text: "Ver transcripción", "aria-expanded": "false" });
    bTrans.addEventListener("click", function () {
      trans.hidden = !trans.hidden; bTrans.textContent = trans.hidden ? "Ver transcripción" : "Ocultar transcripción";
      bTrans.setAttribute("aria-expanded", String(!trans.hidden)); if (!trans.hidden) alVer();
    });
    return el("div", null,
      el("div", { class: "contacto" }, el("div", { class: "avatar", text: iniciales(C.marta.nombre) }),
        el("div", null, el("div", { class: "quien", style: "font-weight:600;color:#262626", text: C.marta.nombre }), el("div", { class: "meta", style: "font-size:12.5px", text: C.marta.meta }))),
      el("div", { class: "burbuja-voz" }, pp, onda, tiempo), audio,
      el("div", { style: "margin-top:10px" }, bTrans), trans);
  }
  function capaVoz() {
    var cont = btn("Continuar", function () { S.capa = "lectura"; guardarYa(); pantallaEscena(); }, "", { disabled: !S.martaVisto });
    var alVer = function () { if (!S.martaVisto) { S.martaVisto = true; guardar(); } cont.disabled = false; };
    return el("div", { class: "capa", role: "dialog", "aria-modal": "true", "aria-label": "Nota de voz de Marta Quiroga" },
      el("div", { class: "telefono" }, bloqueNotaVoz(alVer), el("div", { class: "fila", style: "justify-content:flex-end;margin-top:14px" }, cont)));
  }

  /* --- primera lectura --- */
  function capaLectura() {
    var ta = el("textarea", { rows: 3, maxlength: 400, placeholder: C.lectura.placeholder, "aria-label": C.lectura.pregunta, "data-foco": "" });
    ta.value = S.lecturaInicial || "";
    var b = btn(C.lectura.boton, function () {
      S.lecturaInicial = ta.value.trim(); S.capa = "comprobacion"; guardarYa(); pantallaEscena();
    }, "", { disabled: !ta.value.trim() });
    ta.addEventListener("input", function () { b.disabled = !ta.value.trim(); });
    return el("div", { class: "capa", role: "dialog", "aria-modal": "true", "aria-label": C.lectura.titulo },
      el("div", { class: "panel angosto" },
        el("h2", { class: "titulo", text: C.lectura.titulo }),
        el("p", { text: C.lectura.texto }),
        el("p", { style: "font-weight:600;color:#262626", text: C.lectura.pregunta }),
        ta, el("div", { class: "fila", style: "justify-content:flex-end;margin-top:12px" }, b)));
  }

  /* --- comprobación del producto esperado --- */
  function capaComprobacion() {
    var cont = el("div");
    function dibujar() {
      cont.innerHTML = "";
      var sel = S.comprobacion.sel;
      C.comprobacion.opciones.forEach(function (o, i) {
        cont.appendChild(el("button", {
          class: "opcion" + (sel === o.id ? " sel" : ""), type: "button", disabled: !!sel, "data-foco": i === 0 && !sel ? "" : null,
          onclick: function () { S.comprobacion.sel = o.id; S.comprobacion.intentos.push(o.id); guardarYa(); dibujar(); }
        }, el("b", { text: o.id + "." }), o.texto));
      });
      if (sel) {
        var f = C.comprobacion.feedback[sel];
        cont.appendChild(el("div", { class: "devolucion" + (f.correcta ? " bien" : ""), role: "status" },
          el("b", { text: f.titulo }), el("div", { text: f.texto }),
          el("div", { class: "fila", style: "margin-top:10px" }, btn(f.boton, function () {
            if (f.correcta) {
              S.comprobacion.resuelta = true; S.capa = null; S.escenaPaso = "carpeta"; guardarYa(); pantallaEscena(); mirarA("carpeta");
            } else { S.comprobacion.sel = null; guardarYa(); dibujar(); var p = cont.querySelector(".opcion"); if (p) p.focus(); }
          }, f.correcta ? "" : "sec", { "data-foco": "" }))));
        var fb = cont.querySelector(".devolucion button"); if (fb) setTimeout(function () { fb.focus(); }, 30);
      }
    }
    dibujar();
    return el("div", { class: "capa", role: "dialog", "aria-modal": "true", "aria-label": C.comprobacion.pregunta },
      el("div", { class: "panel angosto" }, el("h2", { class: "subt", text: C.comprobacion.pregunta }), cont));
  }

  /* ===================== MOMENTO 2 · MESA DE TRABAJO ===================== */
  function todosRevisados() { return S.revisados.presupuesto && S.revisados.comprobante && S.revisados.mensaje; }
  function antesListo() { return ["proposito", "destinatario", "restricciones", "evidencia"].every(function (k) { return S.tarjetas[k]; }) && S.criterioGuardado; }

  function panelNotas(titulo) {
    var refs = S.referencias, notas = S.notas;
    return el("div", null,
      el("h3", { text: titulo || "Notas de trabajo" }),
      el("div", { class: "grupo", text: "Referencias guardadas" }),
      refs.length ? refs.map(function (r) { return el("div", { class: "nota" }, r.texto, el("span", { class: "f", text: r.fuente })); }) : el("div", { class: "vacio", text: "—" }),
      el("div", { class: "grupo", text: "Notas propias" }),
      notas.length ? notas.map(function (r) { return el("div", { class: "nota" }, r.texto, el("span", { class: "f", text: r.fuente })); }) : el("div", { class: "vacio", text: "—" }));
  }

  function pantallaMesa() {
    var m = el("div", { class: "mesa" });
    m.appendChild(el("header", null, el("div", { class: "titulo", text: C.mesa.titulo }), el("div", { class: "subt", text: C.mesa.subtitulo }), el("p", { text: C.mesa.texto })));
    var carpeta = el("nav", { class: "carpeta", "aria-label": C.mesa.carpeta }, el("div", { class: "et", text: C.mesa.carpeta }));
    ["presupuesto", "comprobante", "mensaje"].forEach(function (k) {
      var a = C.antecedentes[k];
      carpeta.appendChild(el("button", {
        class: "ant" + (S.mesaAbierto === k && S.mesaVista === "doc" ? " activo" : ""), type: "button",
        onclick: function () { S.mesaAbierto = k; S.mesaVista = "doc"; guardarYa(); render(); }
      }, el("span", { class: "n", text: a.numero }), el("span", null, a.titulo, el("span", { class: "estado" + (S.revisados[k] ? " ok" : ""), text: S.revisados[k] ? "✓ Revisado" : "Sin revisar" }))));
    });
    m.appendChild(carpeta);
    var centro = el("main", { class: "centro" });
    if (S.mesaVista === "antes" && todosRevisados()) centro.appendChild(vistaAntesDeProducir());
    else if (S.mesaAbierto) centro.appendChild(vistaAntecedente(S.mesaAbierto));
    else centro.appendChild(el("p", { class: "vacio", style: "margin-top:30px", text: "Seleccione un antecedente de la carpeta del caso." }));
    m.appendChild(centro);
    m.appendChild(el("aside", { class: "notas" }, panelNotas()));
    // barra del asistente
    var barra = el("div", { class: "barra-asist" });
    if (!todosRevisados()) {
      barra.appendChild(el("div", null, el("div", { class: "t", text: "Asistente IA" }), el("div", { class: "s", text: "🔒 " + C.mesa.bloqueo })));
    } else if (!antesListo()) {
      barra.appendChild(el("div", null, el("div", { class: "t", text: "Asistente IA" }), el("div", { class: "s", text: C.antesDeProducir.texto })));
      if (S.mesaVista !== "antes") barra.appendChild(btn(C.antesDeProducir.titulo, function () { S.mesaVista = "antes"; guardarYa(); render(); }, "verde"));
    } else {
      barra.appendChild(el("div", null, el("div", { class: "t", text: C.antesDeProducir.asistenteTitulo + " · " + C.antesDeProducir.asistenteEstado }), el("div", { class: "s", text: C.antesDeProducir.asistenteTexto })));
      barra.appendChild(el("div", { class: "fila" },
        S.mesaVista !== "antes" ? btn(C.antesDeProducir.titulo, function () { S.mesaVista = "antes"; guardarYa(); render(); }, "sec chico") : null,
        btn(C.antesDeProducir.asistenteBoton, irATrabajo, "verde")));
    }
    m.appendChild(barra);
    app.appendChild(m);
  }
  function marcarRevisado(k) {
    var antes = todosRevisados();
    S.revisados[k] = true;
    if (!antes && todosRevisados()) S.mesaVista = "antes";     // se presenta primero la síntesis
    guardarYa(); render();
  }

  function documentoPresupuesto(seleccionable, sel, alCambiar) {
    var a = C.antecedentes.presupuesto;
    return el("div", { class: "documento" }, el("h3", { text: a.documento }),
      a.fragmentos.map(function (f) {
        var on = sel.indexOf(f.id) !== -1;
        var cont = f.etiqueta ? [el("b", { text: f.etiqueta + " " }), f.valor] : [f.valor];
        if (!seleccionable) return el("div", { class: "frag" + (on ? " sel" : "") }, cont);
        return el("button", { class: "frag" + (on ? " sel" : ""), type: "button", "aria-pressed": String(on), onclick: function () { alCambiar(f.id); } }, cont);
      }));
  }
  function documentoComprobante() {
    var a = C.antecedentes.comprobante;
    return el("div", { class: "recibo" }, el("div", { class: "fecha", text: a.fecha }), el("div", { text: a.texto }), el("div", { class: "firma", text: a.firma }));
  }
  function documentoMensaje() {
    var a = C.antecedentes.mensaje;
    return el("div", { class: "chatcaptura" }, el("div", { class: "burb" }, el("div", { class: "de", text: a.autor }), a.texto, el("span", { class: "hora", text: a.fecha })));
  }

  function vistaAntecedente(k) {
    var a = C.antecedentes[k];
    var v = el("div", null, el("h2", { class: "subt", style: "margin-bottom:12px", text: a.numero + " · " + a.titulo }));
    if (k === "presupuesto") {
      var sel = S.presupuestoSel.slice();
      var guardarB, aviso = el("div", { role: "status", style: "margin-top:8px;color:#4f6b00;font-weight:600" });
      var docCont = el("div");
      function dibujarDoc() {
        docCont.innerHTML = "";
        docCont.appendChild(documentoPresupuesto(true, sel, function (id) {
          var i = sel.indexOf(id); if (i === -1) sel.push(id); else sel.splice(i, 1);
          dibujarDoc(); guardarB.disabled = sel.length === 0; aviso.textContent = "";
        }));
      }
      guardarB = btn(a.boton, function () {
        S.presupuestoSel = sel.slice();
        S.referencias = S.referencias.filter(function (r) { return r.origen !== "presupuesto"; });
        a.fragmentos.forEach(function (f) {
          if (sel.indexOf(f.id) !== -1) S.referencias.push({ id: f.id, origen: "presupuesto", fuente: a.fuente, texto: (f.etiqueta ? f.etiqueta + " " : "") + f.valor });
        });
        marcarRevisado("presupuesto");
      }, "", { disabled: sel.length === 0 });
      dibujarDoc();
      v.appendChild(docCont);
      v.appendChild(el("div", { class: "accion" }, el("h4", { text: a.accionTitulo }), el("p", { text: a.accionTexto }), guardarB, aviso));
    }
    if (k === "comprobante") {
      v.appendChild(documentoComprobante());
      var inp = el("input", { type: "text", maxlength: 220, placeholder: a.placeholder, "aria-label": a.notaTitulo });
      var zona = el("div");
      var gb = btn(a.boton, function () {
        zona.innerHTML = "";
        zona.appendChild(el("div", { class: "devolucion", role: "alertdialog", "aria-label": a.controlTitulo },
          el("b", { text: a.controlTitulo }), el("div", { text: a.controlPregunta }),
          el("div", { class: "fila", style: "margin-top:10px" },
            btn(a.controlSi, function () {
              S.notas.push({ id: uid("n"), origen: "comprobante", fuente: a.fuente, texto: inp.value.trim() });
              marcarRevisado("comprobante");
            }),
            btn(a.controlNo, function () { zona.innerHTML = ""; inp.focus(); }, "sec"))));
        var s = zona.querySelector("button"); if (s) s.focus();
      }, "", { disabled: true });
      inp.addEventListener("input", function () { gb.disabled = !inp.value.trim(); zona.innerHTML = ""; });
      v.appendChild(el("div", { class: "accion" }, el("h4", { text: a.accionTitulo }), el("p", { text: a.accionTexto }),
        el("div", { style: "font-weight:600;color:#262626;font-size:13px;margin-bottom:4px", text: a.notaTitulo }), inp,
        el("div", { style: "margin-top:8px" }, gb), zona));
    }
    if (k === "mensaje") {
      v.appendChild(documentoMensaje());
      var d = JSON.parse(JSON.stringify(S.mensajeDecision));
      var c1 = el("input", { type: "checkbox", checked: d.cronologia }), c2 = el("input", { type: "checkbox", checked: d.antecedente }), c3 = el("input", { type: "checkbox", checked: d.noUsar });
      var res = el("div", { role: "status" });
      var reg = btn("Registrar decisión", function () {
        d = { cronologia: c1.checked, antecedente: c2.checked, noUsar: c3.checked, registrada: true };
        S.mensajeDecision = d;
        S.notas = S.notas.filter(function (n) { return n.origen !== "mensaje"; });
        S.referencias = S.referencias.filter(function (r) { return r.origen !== "mensaje"; });
        if (d.cronologia) S.notas.push({ id: uid("n"), origen: "mensaje", fuente: "Cronología del caso · Mensaje del contratista", texto: a.cronologia });
        if (d.antecedente) S.referencias.push({ id: uid("r"), origen: "mensaje", fuente: "Mensaje del contratista · " + a.fecha, texto: "“" + a.texto + "”" });
        marcarRevisado("mensaje");
      }, "", { disabled: !(d.cronologia || d.antecedente || d.noUsar) });
      function cambio(ev) {
        if (ev.target === c3 && c3.checked) { c1.checked = false; c2.checked = false; }
        if ((ev.target === c1 || ev.target === c2) && ev.target.checked) c3.checked = false;
        reg.disabled = !(c1.checked || c2.checked || c3.checked);
      }
      [c1, c2, c3].forEach(function (c) { c.addEventListener("change", cambio); });
      if (S.mensajeDecision.registrada && S.mensajeDecision.noUsar) res.appendChild(el("div", { class: "devolucion" }, el("b", { text: a.noUsarTitulo }), el("div", { text: a.noUsarTexto })));
      v.appendChild(el("div", { class: "accion" }, el("h4", { text: a.accionTitulo }), el("p", { text: a.accionPregunta }),
        el("label", { class: "check" }, c1, a.opcionCronologia),
        el("label", { class: "check" }, c2, a.opcionAntecedente),
        el("div", { class: "sep-o", text: "o" }),
        el("label", { class: "check" }, c3, a.opcionNoUsar),
        el("div", { style: "margin-top:8px" }, reg), res));
    }
    return v;
  }

  function vistaAntesDeProducir() {
    var A = C.antesDeProducir;
    var v = el("div", null, el("h2", { class: "titulo", text: A.titulo }), el("p", { text: A.texto }));
    var grid = el("div", { class: "tarjetas" });
    A.tarjetas.forEach(function (t) {
      var abierta = !!S.tarjetas[t.id];
      var card = el("div", { class: "tarjeta" + (abierta ? "" : " cerrada") });
      card.appendChild(el("div", { class: "nom", text: t.nombre }));
      card.appendChild(el("div", { class: "preg", text: t.pregunta }));
      if (!abierta) {
        card.setAttribute("role", "button"); card.setAttribute("tabindex", "0"); card.setAttribute("aria-expanded", "false");
        var abrir = function () { S.tarjetas[t.id] = true; guardarYa(); render(); };
        card.addEventListener("click", abrir);
        card.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(); } });
        card.appendChild(el("div", { class: "abrir", text: "Abrir" }));
      } else {
        card.appendChild(el("div", { class: "conc", text: t.concepto }));
        card.appendChild(contenidoTarjeta(t.id));
      }
      grid.appendChild(card);
    });
    v.appendChild(grid);
    if (antesListo()) {
      v.appendChild(el("div", { class: "listo-asist" },
        el("div", null, el("div", { style: "font-weight:600;color:#262626" }, A.asistenteTitulo, el("span", { class: "disp", text: A.asistenteEstado })), el("div", { text: A.asistenteTexto })),
        btn(A.asistenteBoton, irATrabajo, "verde")));
    }
    return v;
  }
  function contenidoTarjeta(id) {
    var A = C.antesDeProducir;
    var caso = el("div", { class: "caso" }, el("div", { class: "et", text: "En este caso" }));
    if (id === "proposito") {
      var cita = el("div", { style: "color:#262626", text: "“" + propositoVigente() + "”" });
      caso.appendChild(cita);
      var zona = el("div");
      var bA = el("button", { class: "enlace", type: "button", text: "Ajustar", style: "margin-top:6px" });
      bA.addEventListener("click", function () {
        bA.hidden = true; zona.innerHTML = "";
        var ta = el("textarea", { rows: 3, maxlength: 400, "aria-label": "Ajustar el propósito" }); ta.value = propositoVigente();
        zona.appendChild(ta);
        zona.appendChild(el("div", { class: "fila", style: "margin-top:6px" },
          btn("Guardar ajuste", function () {
            var nv = ta.value.trim(); if (!nv) return;
            if (nv !== propositoVigente()) { S.propositoHistorial.push({ texto: propositoVigente(), fecha: fechaHora() }); S.proposito = nv; }
            guardarYa(); render();
          }, "chico"),
          btn("Cancelar", function () { zona.innerHTML = ""; bA.hidden = false; }, "sec chico")));
        ta.focus();
      });
      caso.appendChild(bA); caso.appendChild(zona);
    }
    if (id === "destinatario") {
      caso.appendChild(el("div", null, el("b", { text: "Destinatario de la comunicación: " }), A.destinatario));
      caso.appendChild(el("div", null, el("b", { text: "Instancia actual: " }), A.instancia));
    }
    if (id === "restricciones") caso.appendChild(el("ul", null, A.restricciones.map(function (r) { return el("li", { text: r }); })));
    if (id === "evidencia") {
      caso.appendChild(el("div", { style: "font-weight:600;color:#262626;font-size:13px", text: "Fuentes disponibles" }));
      caso.appendChild(el("ul", null, A.fuentes.map(function (f) { return el("li", { text: f }); })));
      caso.appendChild(el("div", { style: "font-weight:600;color:#262626;font-size:13px;margin-top:6px", text: "Notas de trabajo" }));
      var todas = S.referencias.concat(S.notas);
      caso.appendChild(todas.length ? el("ul", null, todas.map(function (r) { return el("li", { text: textoRef(r) }); })) : el("div", { class: "vacio", text: "—" }));
      var crit = el("div", { style: "margin-top:10px" },
        el("div", { style: "font-weight:600;color:#262626", text: A.criterioTitulo }),
        el("div", { style: "font-size:13px", text: A.criterioTexto }),
        el("div", { style: "margin:6px 0;color:#262626", text: A.criterioFrase }));
      var inp = el("input", { type: "text", maxlength: 300, "aria-label": A.criterioFrase }); inp.value = S.criterio;
      var ok = el("span", { role: "status", style: "font-size:12.5px;color:#4f6b00;font-weight:600;margin-left:8px", text: S.criterioGuardado ? "Criterio guardado" : "" });
      var gb = btn(A.criterioBoton, function () { S.criterio = inp.value.trim(); S.criterioGuardado = true; guardarYa(); render(); }, "chico", { disabled: !inp.value.trim() });
      inp.addEventListener("input", function () { gb.disabled = !inp.value.trim(); ok.textContent = ""; });
      crit.appendChild(inp); crit.appendChild(el("div", { style: "margin-top:6px" }, gb, ok));
      caso.appendChild(crit);
    }
    return caso;
  }
  function irATrabajo() { ir("trabajo"); }

  /* ======================= MOMENTOS 3 y 6 · TRABAJO ====================== */
  var refsUI = {};
  function pantallaTrabajo() {
    refsUI = {};
    var t = el("div", { class: "trabajo" });
    var ultima = S.entregas[S.entregas.length - 1];
    if (S.enRevision && ultima && ultima.resultado) {
      t.appendChild(el("div", { class: "obs-banda" }, el("h3", { text: "Observaciones del Dr. Ribas" }),
        el("ol", null, ultima.resultado.observaciones.map(function (o) { return el("li", { text: o.texto }); }))));
    }
    var pest = el("div", { class: "pestanas", role: "tablist" });
    var zonas = el("div", { class: "zonas" });
    var defs = [["antecedentes", "Antecedentes"], ["asistente", "Asistente IA"], ["documento", S.enRevision ? "Versión en revisión" : "Comunicación"]];
    defs.forEach(function (d) {
      var b = el("button", { type: "button", role: "tab", class: S.tab === d[0] ? "on" : "", text: d[1], onclick: function () { S.tab = d[0]; guardar(); render(); } });
      pest.appendChild(b);
    });
    zonas.appendChild(zonaAntecedentes());
    zonas.appendChild(zonaAsistente());
    zonas.appendChild(zonaDocumento());
    Array.prototype.forEach.call(zonas.children, function (z, i) { if (defs[i][0] === S.tab) z.classList.add("visible"); });
    t.appendChild(pest); t.appendChild(zonas);
    app.appendChild(t);
    renderChat();
    if (!S.m3IntroVista) app.appendChild(capaIntroM3());
    else if (S.ajustePendiente) app.appendChild(capaQueRevisar());
  }

  function capaIntroM3() {
    return el("div", { class: "capa", role: "dialog", "aria-modal": "true", "aria-label": C.m3.titulo },
      el("div", { class: "panel" },
        el("h2", { class: "titulo", text: C.m3.titulo }),
        el("p", { style: "font-weight:600;color:#262626", text: C.m3.texto1 }),
        el("p", { text: C.m3.texto2 }), el("p", { text: C.m3.texto3 }),
        el("p", { style: "font-weight:600;color:#262626", text: C.m3.lema }),
        el("div", { class: "fila", style: "justify-content:flex-end;margin-top:12px" },
          btn("Comenzar a producir", function () { S.m3IntroVista = true; guardarYa(); render(); }, "", { "data-foco": "" }))));
  }
  function capaQueRevisar() {
    var ta = el("textarea", { rows: 3, maxlength: 500, placeholder: "Escriba aquí…", "aria-label": "¿Qué necesita revisar?" });
    var b = btn("Continuar trabajando", function () {
      S.revisionesPropias.push(ta.value.trim()); S.ajustePendiente = false; guardarYa(); render();
    }, "", { disabled: true });
    ta.addEventListener("input", function () { b.disabled = !ta.value.trim(); });
    var ultima = S.entregas[S.entregas.length - 1];
    setTimeout(function () { ta.focus(); }, 60);
    return el("div", { class: "capa", role: "dialog", "aria-modal": "true", "aria-label": "¿Qué necesita revisar?" },
      el("div", { class: "panel angosto" },
        el("h3", { class: "subt", text: "Observaciones del Dr. Ribas" }),
        el("ol", { style: "color:#262626;padding-left:20px" }, ultima.resultado.observaciones.map(function (o) { return el("li", { text: o.texto }); })),
        el("h2", { class: "titulo", style: "margin-top:10px", text: "¿Qué necesita revisar?" }),
        el("p", { text: "A partir de la devolución recibida, indique brevemente qué decisión o aspecto de la producción necesita modificar." }),
        ta, el("div", { class: "fila", style: "justify-content:flex-end;margin-top:12px" }, b)));
  }

  /* --- zona antecedentes --- */
  function zonaAntecedentes() {
    var items = [
      ["ribas", "Mensaje del Dr. Ribas"], ["marta", "Nota de voz de Marta"],
      ["presupuesto", "Presupuesto aceptado"], ["comprobante", "Comprobante de pago"], ["mensaje", "Mensaje de Hernán"]
    ];
    return el("section", { class: "zona antecedentes", "aria-label": "Antecedentes" },
      el("div", { class: "cab", text: "Antecedentes" }),
      el("div", { class: "cuerpo" },
        el("div", { style: "font-weight:600;color:#262626;margin-bottom:6px", text: "Caso Quiroga" }),
        items.map(function (i) { return el("button", { class: "item", type: "button", text: i[1], onclick: function () { verAntecedente(i[0]); } }); }),
        el("div", { style: "margin-top:12px" }, panelNotas())));
  }
  function verAntecedente(k) {
    var cuerpo;
    if (k === "ribas") cuerpo = bloqueVideoRibas(function () {});
    else if (k === "marta") cuerpo = bloqueNotaVoz(function () {});
    else if (k === "presupuesto") cuerpo = documentoPresupuesto(false, S.presupuestoSel);
    else if (k === "comprobante") cuerpo = documentoComprobante();
    else cuerpo = documentoMensaje();
    var capa = el("div", { class: "capa", role: "dialog", "aria-modal": "true" });
    var cerrar = btn("Cerrar", function () { capa.querySelectorAll("video,audio").forEach(function (m) { m.pause(); }); capa.remove(); }, "sec");
    capa.appendChild(el("div", { class: "panel" }, cuerpo, el("div", { class: "fila", style: "justify-content:flex-end;margin-top:14px" }, cerrar)));
    capa.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrar.click(); });
    app.appendChild(capa); setTimeout(function () { cerrar.focus(); }, 40);
  }

  /* --- zona asistente --- */
  var ocupado = false;
  function zonaAsistente() {
    var lista = el("div", { class: "chat", "aria-live": "polite" });
    refsUI.chat = lista;
    var ta = el("textarea", { id: "instruccion", rows: 3, placeholder: "Escriba aquí…" });
    refsUI.entrada = ta;
    var enviar = btn("Enviar", function () { enviarInstruccion(); }, "", { disabled: true });
    refsUI.enviar = enviar;
    ta.addEventListener("input", function () { enviar.disabled = ocupado || !ta.value.trim(); });
    ta.addEventListener("keydown", function (e) { if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !enviar.disabled) enviarInstruccion(); });
    var cuerpo = el("div", { class: "cuerpo" }, lista);
    refsUI.chatCuerpo = cuerpo;
    return el("section", { class: "zona", "aria-label": "Asistente IA" },
      el("div", { class: "cab" }, "Asistente del estudio", usaDemo() && CFG.mostrarAvisoDemo !== false ? el("span", { class: "demo-et", text: "Versión demo" }) : null), cuerpo,
      el("div", { class: "entrada" },
        el("label", { for: "instruccion", text: "Instrucción para el asistente" }), ta,
        el("div", { class: "fila", style: "justify-content:space-between" }, el("span", { class: "ayuda", text: "Ayuda breve: " + C.m3.ayuda }), enviar)));
  }

  function renderChat() {
    var l = refsUI.chat; if (!l) return;
    l.innerHTML = "";
    l.appendChild(el("div", { class: "burbuja asis" }, el("span", { class: "rot", text: "Asistente" }), C.m3.saludo));
    S.chat.forEach(function (m) { l.appendChild(itemChat(m)); });
    if (ocupado) l.appendChild(el("div", { class: "escribiendo", text: "El asistente está trabajando" }));
    if (refsUI.enviar) refsUI.enviar.disabled = ocupado || !refsUI.entrada.value.trim();
    setTimeout(function () { if (refsUI.chatCuerpo) refsUI.chatCuerpo.scrollTop = refsUI.chatCuerpo.scrollHeight; }, 20);
  }

  function itemChat(m) {
    if (m.rol === "usuario") {
      var pre = m.pedidoTipo === "ajuste" ? "Ajuste pedido" : m.pedidoTipo === "fragmento" ? "Cambio sobre un fragmento" : "Usted";
      return el("div", { class: "burbuja usu" }, el("span", { class: "rot", text: pre }), m.texto);
    }
    if (m.rol === "sistema") {
      return el("div", { class: "burbuja sis", role: "alert" }, m.texto,
        m.reintento ? el("div", { style: "margin-top:8px" }, btn("Reintentar", function () {
          S.chat = S.chat.filter(function (x) { return x !== m; }); guardar(); solicitar(m.reintento, true);
        }, "sec chico")) : null);
    }
    if (m.tipo === "mensaje") return el("div", { class: "burbuja asis" }, el("span", { class: "rot", text: "Asistente" }), m.mensaje);
    if (m.tipo === "propuesta") return tarjetaPropuesta(m);
    if (m.tipo === "fragmento") return tarjetaFragmento(m);
    return el("div");
  }

  function tarjetaPropuesta(m) {
    var b = el("div", { class: "burbuja asis", style: "max-width:100%;width:100%" }, el("span", { class: "rot", text: "Asistente" }), C.m3.propuestaLista);
    var caja = el("div", { class: "propuesta" });
    var ver = el("button", { class: "enlace", type: "button", style: "margin:8px 10px", text: m.abierta ? "Ocultar propuesta" : "Ver propuesta", "aria-expanded": String(!!m.abierta) });
    ver.addEventListener("click", function () { m.abierta = !m.abierta; guardar(); renderChat(); });
    caja.appendChild(ver);
    if (m.abierta) caja.appendChild(el("div", { class: "txt", text: m.texto }));
    if (m.estado === "incorporada") caja.appendChild(el("div", { class: "marca", text: "✓ Incorporada al borrador" }));
    else {
      var acc = el("div", { class: "acc" },
        btn("Incorporar al borrador", function () { incorporarPropuesta(m); }, "chico"),
        btn("Pedir un ajuste", function () { m.ajustando = true; m.abierta = true; renderChat(); var f = document.getElementById("aj-" + m.id); if (f) f.focus(); }, "sec chico", { disabled: ocupado }),
        btn("Seguir conversando", function () { m.ajustando = false; renderChat(); refsUI.entrada.focus(); }, "sec chico"));
      caja.appendChild(acc);
      if (m.ajustando) {
        var ta = el("textarea", { id: "aj-" + m.id, rows: 2, placeholder: "Escriba aquí…", "aria-label": "Indique qué desea modificar en la propuesta." });
        var env = btn("Enviar ajuste", function () {
          var tx = ta.value.trim(); if (!tx) return;
          m.ajustando = false;
          solicitar({ tipo: "ajuste", texto: tx, propuestaBase: m.texto, propuestaId: m.id });
        }, "chico", { disabled: true });
        ta.addEventListener("input", function () { env.disabled = ocupado || !ta.value.trim(); });
        caja.appendChild(el("div", { style: "padding:8px 10px;border-top:1px solid #d9d9d9" },
          el("div", { style: "font-size:13px;font-weight:600;color:#262626;margin-bottom:4px", text: "Indique qué desea modificar en la propuesta." }), ta,
          el("div", { class: "fila", style: "margin-top:6px" }, env)));
      }
    }
    b.appendChild(caja);
    return b;
  }

  function tarjetaFragmento(m) {
    var b = el("div", { class: "burbuja asis", style: "max-width:100%;width:100%" }, el("span", { class: "rot", text: "Asistente" }), m.mensaje || "Preparé una nueva propuesta para el fragmento.");
    var caja = el("div", { class: "propuesta" }, el("div", { class: "txt", text: m.texto }));
    if (m.estado === "incorporada") caja.appendChild(el("div", { class: "marca", text: "✓ Cambio incorporado" }));
    else if (m.estado === "descartada") caja.appendChild(el("div", { class: "marca", style: "color:#595959", text: "Descartado" }));
    else caja.appendChild(el("div", { class: "acc" },
      btn("Incorporar cambio", function () { incorporarFragmento(m); }, "chico"),
      btn("Descartar", function () { m.estado = "descartada"; guardarYa(); renderChat(); }, "sec chico")));
    b.appendChild(caja);
    return b;
  }

  function enviarInstruccion() {
    var tx = refsUI.entrada.value.trim(); if (!tx || ocupado) return;
    refsUI.entrada.value = "";
    solicitar({ tipo: "mensaje", texto: tx });
  }

  function conversacionParaServicio() {
    return S.chat.filter(function (m) { return m.rol !== "sistema"; }).map(function (m) {
      if (m.rol === "usuario") {
        if (m.pedidoTipo === "ajuste") return { rol: "usuario", texto: "Ajuste sobre la propuesta: " + m.texto };
        if (m.pedidoTipo === "fragmento") return { rol: "usuario", texto: "Sobre el fragmento «" + m.fragmento + "»: " + m.texto };
        return { rol: "usuario", texto: m.texto };
      }
      if (m.tipo === "propuesta") return { rol: "asistente", texto: "Propuesta entregada:\n" + m.texto };
      if (m.tipo === "fragmento") return { rol: "asistente", texto: "Fragmento propuesto:\n" + m.texto };
      return { rol: "asistente", texto: m.mensaje };
    });
  }

  function solicitar(pedido, esReintento) {
    if (ocupado) return;
    var conv = conversacionParaServicio();
    if (!esReintento) {
      S.chat.push({ id: uid("u"), rol: "usuario", texto: pedido.texto, pedidoTipo: pedido.tipo, fragmento: pedido.fragmento || null });
      var registroTexto = pedido.tipo === "ajuste" ? "Ajuste sobre una propuesta: " + pedido.texto
        : pedido.tipo === "fragmento" ? "Cambio sobre el fragmento «" + pedido.fragmento + "»: " + pedido.texto : pedido.texto;
      if (!S.registro.instruccionInicial && pedido.tipo === "mensaje") S.registro.instruccionInicial = pedido.texto;
      else S.registro.ajustes.push(registroTexto);
    } else {
      conv = conv.slice(0, -1);   // la última entrada es el mismo pedido ya mostrado
    }
    ocupado = true; guardarYa(); renderChat();
    llamar({
      accion: "producir",
      contexto: { proposito: propositoVigente(), referencias: S.referencias.map(textoRef), notas: S.notas.map(textoRef), criterio: S.criterio },
      conversacion: conv, borrador: S.borrador,
      pedido: { tipo: pedido.tipo, texto: pedido.texto, propuestaBase: pedido.propuestaBase || null, fragmento: pedido.fragmento || null }
    }).then(function (r) {
      ocupado = false;
      if (pedido.tipo === "fragmento" && r.texto) {
        S.chat.push({ id: uid("a"), rol: "asistente", tipo: "fragmento", mensaje: r.mensaje, texto: r.texto, estado: "nueva", origen: { inicio: pedido.inicio, fin: pedido.fin, texto: pedido.fragmento } });
      } else if ((r.tipo === "propuesta" || r.tipo === "fragmento") && r.texto) {
        S.chat.push({ id: uid("a"), rol: "asistente", tipo: "propuesta", mensaje: r.mensaje, texto: r.texto, estado: "nueva", abierta: false });
      } else {
        S.chat.push({ id: uid("a"), rol: "asistente", tipo: "mensaje", mensaje: r.mensaje || "(sin texto)" });
      }
      guardarYa(); renderChat();
    }, function (e) {
      ocupado = false;
      S.chat.push({ id: uid("s"), rol: "sistema", texto: mensajeError(e), reintento: pedido });
      guardarYa(); renderChat();
    });
  }

  function incorporarPropuesta(m) {
    function aplicar(modo) {
      if (modo === "reemplazar") S.borrador = m.texto;
      else S.borrador = (S.borrador.replace(/\s+$/, "") + "\n\n" + m.texto).replace(/^\s+/, "");
      m.estado = "incorporada";
      S.registro.incorporaciones.push((modo === "reemplazar" ? "Propuesta completa incorporada al borrador" : "Propuesta agregada al final del borrador") + ": «" + m.texto.slice(0, 280) + (m.texto.length > 280 ? "…" : "") + "»");
      guardarYa(); actualizarEditor(); renderChat();
      if (window.matchMedia("(max-width: 860px)").matches) { S.tab = "documento"; render(); }
    }
    if (!S.borrador.trim()) { aplicar("reemplazar"); return; }
    var capa = el("div", { class: "capa", role: "dialog", "aria-modal": "true" });
    capa.appendChild(el("div", { class: "panel angosto" },
      el("p", { style: "font-weight:600;color:#262626", text: "El borrador ya tiene contenido. ¿Cómo desea incorporar la propuesta?" }),
      el("div", { class: "fila" },
        btn("Reemplazar el borrador", function () { capa.remove(); aplicar("reemplazar"); }),
        btn("Agregar al final", function () { capa.remove(); aplicar("agregar"); }, "sec"),
        btn("Cancelar", function () { capa.remove(); }, "sec"))));
    app.appendChild(capa); capa.querySelector("button").focus();
  }

  function incorporarFragmento(m) {
    var o = m.origen || {}; var b = S.borrador;
    var i = (b.substring(o.inicio, o.fin) === o.texto) ? o.inicio : b.indexOf(o.texto);
    if (i === -1 || !o.texto) { avisoTecnico("El fragmento original ya no está en el borrador; el cambio no se incorporó."); return; }
    S.borrador = b.slice(0, i) + m.texto + b.slice(i + o.texto.length);
    m.estado = "incorporada";
    S.registro.incorporaciones.push("Cambio incorporado sobre un fragmento: «" + o.texto.slice(0, 160) + "» → «" + m.texto.slice(0, 200) + "»");
    guardarYa(); actualizarEditor(); renderChat();
  }

  /* --- zona documento --- */
  function zonaDocumento() {
    var titulo = S.enRevision ? "Versión en revisión" : (S.v1 ? "Versión vigente" : "Primera versión");
    var ta = el("textarea", { id: "borrador", "aria-label": C.m3.documento, spellcheck: "true" });
    ta.value = S.borrador;
    var vacio = el("div", { class: "vacio-doc", text: C.m3.vacio, hidden: !!S.borrador.trim() });
    refsUI.editor = ta; refsUI.vacio = vacio;
    var fragBtn = btn("Trabajar este fragmento con el asistente", abrirFragmento, "sec chico", { hidden: true });
    refsUI.fragBtn = fragBtn;
    var accion;
    if (!S.v1) accion = btn("Guardar primera versión", function () {
      S.v1 = { texto: S.borrador, fecha: fechaHora() };
      S.registro.v1Incorporaciones = S.registro.incorporaciones.length;
      ir("v1guardada");
    }, "verde");
    else if (S.enRevision) accion = btn("Guardar versión revisada", function () {
      S.revisadas.push({ texto: S.borrador, fecha: fechaHora() }); ir("revisadaGuardada");
    }, "verde");
    else accion = btn("Elevar al Dr. Ribas", function () { ir("observacion"); }, "verde");
    refsUI.accion = accion;
    accion.disabled = !S.borrador.trim();
    ta.addEventListener("input", function () { S.borrador = ta.value; guardar(); vacio.hidden = !!ta.value.trim(); accion.disabled = !ta.value.trim(); });
    var revisarSel = function () {
      var largo = ta.selectionEnd - ta.selectionStart;
      fragBtn.hidden = !(largo >= 5) || ocupado;
    };
    ["select", "mouseup", "keyup"].forEach(function (ev) { ta.addEventListener(ev, revisarSel); });
    var cuerpo = el("div", { class: "editor" },
      el("div", { class: "marco-doc" }, vacio, ta),
      el("div", { class: "pie-doc" }, fragBtn, el("span", { style: "flex:1" }), accion));
    refsUI.docZona = cuerpo;
    return el("section", { class: "zona", "aria-label": titulo, style: "position:relative" },
      el("div", { class: "cab" }, el("span", null, el("span", { style: "display:block", text: titulo }), el("span", { style: "font-size:12.5px;font-weight:500;color:#595959", text: C.m3.documento })), el("span", { class: "estado-doc", text: C.m3.estadoBorrador })),
      cuerpo);
  }
  function actualizarEditor() {
    if (!refsUI.editor) return;
    refsUI.editor.value = S.borrador; refsUI.vacio.hidden = !!S.borrador.trim();
    if (refsUI.accion) refsUI.accion.disabled = !S.borrador.trim();
  }
  function abrirFragmento() {
    var ta = refsUI.editor; var ini = ta.selectionStart, fin = ta.selectionEnd;
    var texto = ta.value.substring(ini, fin); if (texto.trim().length < 5) return;
    var vieja = document.querySelector(".frag-flot"); if (vieja) vieja.remove();
    var pedido = el("textarea", { rows: 2, placeholder: "Escriba aquí…", "aria-label": "¿Qué desea cambiar?" });
    var flot = el("div", { class: "frag-flot", role: "dialog", "aria-label": "Trabajar este fragmento con el asistente" });
    var env = btn("Enviar", function () {
      var tx = pedido.value.trim(); if (!tx) return;
      flot.remove(); refsUI.fragBtn.hidden = true;
      if (window.matchMedia("(max-width: 860px)").matches) { S.tab = "asistente"; render(); }
      solicitar({ tipo: "fragmento", texto: tx, fragmento: texto, inicio: ini, fin: fin });
    }, "chico", { disabled: true });
    pedido.addEventListener("input", function () { env.disabled = ocupado || !pedido.value.trim(); });
    flot.appendChild(el("div", { style: "font-weight:600;color:#262626", text: "Trabajar este fragmento con el asistente" }));
    flot.appendChild(el("div", { class: "cita", text: texto }));
    flot.appendChild(el("div", { style: "font-size:13px;font-weight:600;color:#262626;margin-bottom:4px", text: "¿Qué desea cambiar?" }));
    flot.appendChild(pedido);
    flot.appendChild(el("div", { class: "fila", style: "margin-top:6px" }, env, btn("Cancelar", function () { flot.remove(); }, "sec chico")));
    refsUI.docZona.parentNode.appendChild(flot); pedido.focus();
  }

  /* ===================== MOMENTO 3 · V1 / MOMENTO 4 ===================== */
  function pantallaV1Guardada() {
    app.appendChild(el("div", { class: "centrado" },
      el("div", { class: "panel" },
        el("h2", { class: "titulo", text: "Primera versión guardada" }),
        el("p", { text: "Esta es la versión que quedaría disponible para elevar al Dr. Ribas." }),
        el("div", { class: "version", style: "max-height:380px;overflow:auto", text: S.v1.texto }),
        el("div", { class: "fila", style: "justify-content:flex-end;margin-top:14px" },
          btn("Realizar control antes de elevar", function () { ir("autocheck"); }, "", { "data-foco": "" })))));
    var f = app.querySelector("[data-foco]"); if (f) f.focus();
  }

  function pantallaAutocheck() {
    var izq = el("div", { class: "izq" },
      el("h2", { class: "titulo", text: "Antes de enviar" }),
      el("p", { text: "Revise brevemente la primera versión." }),
      el("p", { text: "El objetivo no es volver a analizar el caso, sino comprobar si el resultado que produjo refleja decisiones que reconoce y puede sostener." }),
      el("div", { class: "subt", style: "font-size:14px;margin:12px 0 6px", text: "Primera versión (V1)" }),
      el("div", { class: "version", text: S.v1.texto }));
    var der = el("div", { class: "der" }, el("h3", { class: "subt", text: "Autocheck" }));
    var completo = function () { return C.autocheck.every(function (q) { return S.autocheck[q.id]; }); };
    var decision = el("div");
    C.autocheck.forEach(function (q) {
      var g = el("div", { class: "pregunta-ac", role: "radiogroup", "aria-label": q.pregunta }, el("div", { class: "p", text: q.pregunta }));
      q.opciones.forEach(function (o) {
        var c = el("button", { class: "chip" + (S.autocheck[q.id] === o ? " sel" : ""), type: "button", role: "radio", "aria-checked": String(S.autocheck[q.id] === o), text: o });
        c.addEventListener("click", function () { S.autocheck[q.id] = o; guardarYa(); render(); });
        g.appendChild(c);
      });
      der.appendChild(g);
    });
    decision.appendChild(el("h3", { class: "subt", style: "margin-top:18px", text: "¿Cómo desea continuar?" }));
    decision.appendChild(el("div", { class: "fila", style: "margin-top:8px" },
      btn("Volver a trabajar la versión", function () { ir("trabajo"); }, "sec", { disabled: !completo() }),
      btn("Elevar al Dr. Ribas", function () { ir("observacion"); }, "", { disabled: !completo() })));
    der.appendChild(decision);
    app.appendChild(el("div", { class: "autocheck" }, izq, der));
  }

  function pantallaObservacion() {
    var ta = el("textarea", { rows: 3, maxlength: 500, placeholder: "Escriba una observación breve…", "aria-label": "Observación para la revisión" });
    var con = btn("Elevar con observación", function () { elevar(ta.value.trim()); }, "", { disabled: true });
    ta.addEventListener("input", function () { con.disabled = !ta.value.trim(); });
    app.appendChild(el("div", { class: "centrado" },
      el("div", { class: "panel angosto" },
        el("h2", { class: "titulo", text: "Observación para la revisión" }),
        el("p", { text: "Si lo considera necesario, puede señalar un aspecto que prefiera que el Dr. Ribas revise especialmente." }),
        ta,
        el("div", { class: "fila", style: "justify-content:flex-end;margin-top:12px" },
          btn("Elevar sin observación", function () { elevar(""); }, "sec"), con))));
    ta.focus();
  }

  /* ===================== MOMENTOS 5 y 6 · REVISIÓN ===================== */
  function elevar(observacion) {
    S.entregas.push({ n: S.entregas.length + 1, texto: S.borrador, fecha: fechaHora(), observacionParticipante: observacion, resultado: null });
    ir("revisando");
  }
  function encabezadoRibas(sub) {
    return el("div", { class: "cab" }, el("div", { class: "avatar", text: iniciales(C.ribas.nombre) }),
      el("div", null, el("div", { style: "font-weight:600;color:#262626", text: C.ribas.nombre }), el("div", { style: "font-size:12.5px", text: sub })));
  }
  function pantallaRevisando() {
    var e = S.entregas[S.entregas.length - 1];
    var estado = el("div", { class: "cuerpo" },
      el("h2", { class: "subt", text: "Versión enviada para revisión" }),
      el("div", { class: "fila", style: "margin-top:12px;gap:12px" }, el("div", { class: "giro", "aria-hidden": "true" }), el("span", { role: "status", text: "El Dr. Ribas está revisando la versión enviada." })));
    app.appendChild(el("div", { class: "centrado" }, el("div", { class: "tarjeta-revision" }, encabezadoRibas(C.ribas.asunto), estado)));
    var anterior = S.entregas.length > 1 ? S.entregas[S.entregas.length - 2].texto : "";
    var editoDirecto = !S.chat.some(function (m) { return m.tipo === "propuesta" && m.estado === "incorporada" && e.texto.trim() === m.texto.trim(); });
    var incorporaciones = S.registro.incorporaciones.slice();
    if (editoDirecto && incorporaciones.length) incorporaciones.push("El profesional además editó directamente el texto del borrador.");
    if (!incorporaciones.length) incorporaciones.push("El texto fue redactado o pegado directamente por el profesional en el borrador.");
    llamar({
      accion: "revisar", numero: e.n, texto: e.texto, versionAnterior: anterior,
      encuadre: { propositoInicial: S.lecturaInicial, propositoVigente: propositoVigente(), criterio: S.criterio, referencias: S.referencias.map(textoRef), notas: S.notas.map(textoRef) },
      registro: {
        instruccionInicial: S.registro.instruccionInicial, ajustes: S.registro.ajustes, incorporaciones: incorporaciones,
        autocheck: C.autocheck.map(function (q) { return { pregunta: q.pregunta, respuesta: S.autocheck[q.id] || "(sin respuesta)" }; }),
        revisionesPropias: S.revisionesPropias
      },
      observacionParticipante: e.observacionParticipante,
      historial: S.observaciones.map(function (o) { return { id: o.id, texto: o.texto, estado: o.estado }; })
    }).then(function (r) {
      (r.resueltas || []).forEach(function (id) { S.observaciones.forEach(function (o) { if (o.id === id) { o.estado = "resuelta"; o.resueltaEn = e.n; } }); });
      var obs = (r.observaciones || []).map(function (o) {
        if (o.id) { var p = S.observaciones.filter(function (x) { return x.id === o.id; })[0]; if (p) { p.texto = o.texto; return { id: p.id, texto: o.texto }; } }
        S.obsSeq += 1; var nueva = { id: "o" + S.obsSeq, texto: o.texto, estado: "abierta", ronda: e.n };
        S.observaciones.push(nueva); return { id: nueva.id, texto: nueva.texto };
      });
      e.resultado = { estado: r.estado === "CUMPLE" ? "CUMPLE" : "REQUIERE AJUSTE", observaciones: r.estado === "CUMPLE" ? [] : obs, fecha: fechaHora() };
      if (e.resultado.estado === "CUMPLE") S.observaciones.forEach(function (o) { if (o.estado === "abierta") { o.estado = "resuelta"; o.resueltaEn = e.n; } });
      ir("resultado");
    }, function (err) {
      estado.innerHTML = "";
      estado.appendChild(el("h2", { class: "subt", text: "La revisión no pudo completarse" }));
      estado.appendChild(el("p", { role: "alert", text: mensajeError(err) }));
      estado.appendChild(el("div", { class: "fila" },
        btn("Reintentar", function () { render(); }),
        btn("Volver a trabajar la versión", function () { S.entregas.pop(); ir("trabajo"); }, "sec")));
    });
  }

  function pantallaResultado() {
    var e = S.entregas[S.entregas.length - 1]; var r = e.resultado;
    var huboAjuste = S.entregas.some(function (x) { return x.resultado && x.resultado.estado === "REQUIERE AJUSTE" && x !== e; });
    var cuerpo = el("div", { class: "cuerpo" }, el("h2", { class: "subt", text: "Revisión completada" }));
    if (r.estado === "CUMPLE") {
      cuerpo.appendChild(el("p", { text: huboAjuste ? "La versión responde adecuadamente al pedido y puede avanzar." : "La versión elevada responde adecuadamente al pedido y puede avanzar." }));
      if (huboAjuste) cuerpo.appendChild(el("div", { class: "estado-logro", text: "Estado: PRODUCIR logrado" }));
      cuerpo.appendChild(el("div", { class: "fila", style: "justify-content:flex-end;margin-top:14px" }, btn("Ir al cierre", function () { ir("cierre"); }, "verde", { "data-foco": "" })));
    } else {
      cuerpo.appendChild(el("p", { text: huboAjuste ? "La versión avanzó, pero todavía hay aspectos que necesitan revisión antes de considerarla lista." : "Antes de avanzar, conviene revisar algunos aspectos de la versión." }));
      cuerpo.appendChild(el("ol", null, r.observaciones.map(function (o) { return el("li", { text: o.texto }); })));
      cuerpo.appendChild(el("div", { class: "fila", style: "justify-content:flex-end;margin-top:14px" },
        btn("Volver a trabajar la versión", function () { ir("trabajo", { enRevision: true, ajustePendiente: true }); }, "", { "data-foco": "" })));
    }
    app.appendChild(el("div", { class: "centrado" }, el("div", { class: "tarjeta-revision" }, encabezadoRibas("Revisión · " + C.ribas.asunto), cuerpo)));
    var f = app.querySelector("[data-foco]"); if (f) f.focus();
  }

  function pantallaRevisadaGuardada() {
    app.appendChild(el("div", { class: "centrado" },
      el("div", { class: "panel angosto" },
        el("h2", { class: "titulo", text: "Versión revisada guardada" }),
        el("div", { class: "fila", style: "justify-content:flex-end;margin-top:14px" },
          btn("Elevar nuevamente para revisión", function () { elevar(""); }, "", { "data-foco": "" })))));
    var f = app.querySelector("[data-foco]"); if (f) f.focus();
  }

  /* =========================== MOMENTO 7 · CIERRE ========================== */
  function bloqueVersion(etiqueta, sub, texto) {
    var ver = el("div", { class: "version", hidden: true, style: "margin-top:8px", text: texto });
    var b = el("button", { class: "enlace", type: "button", text: "Ver versión", "aria-expanded": "false" });
    b.addEventListener("click", function () { ver.hidden = !ver.hidden; b.textContent = ver.hidden ? "Ver versión" : "Ocultar versión"; b.setAttribute("aria-expanded", String(!ver.hidden)); });
    return el("div", { class: "bloque" }, el("h3", { class: "subt", style: "font-size:15px", text: etiqueta }), sub ? el("div", { style: "font-weight:600;color:#4f6b00", text: sub }) : null, el("div", { style: "margin-top:6px" }, b), ver);
  }
  function pantallaCierre() {
    var c = el("div", { class: "cierre" }, el("h2", { class: "titulo", text: "Lo que cambió al producir" }));
    c.appendChild(el("p", { text: "Al comenzar esta práctica, registró:" }));
    c.appendChild(el("div", { class: "bloque" }, el("h3", { class: "subt", style: "font-size:15px", text: "Su primera lectura" }), el("blockquote", { text: "“" + S.lecturaInicial + "”" })));
    c.appendChild(el("p", { text: "Luego produjo:" }));
    var huboFeedback = S.entregas.some(function (e) { return e.resultado && e.resultado.estado === "REQUIERE AJUSTE"; });
    var ultima = S.entregas[S.entregas.length - 1];
    if (huboFeedback) {
      c.appendChild(bloqueVersion("Primera versión", "V1", S.v1.texto));
      c.appendChild(bloqueVersion("Versión revisada", "Versión final de trabajo", ultima.texto));
    } else if (ultima && ultima.texto.trim() !== S.v1.texto.trim()) {
      c.appendChild(bloqueVersion("Primera versión guardada", "V1", S.v1.texto));
      c.appendChild(bloqueVersion("Versión elevada", null, ultima.texto));
    } else {
      c.appendChild(bloqueVersion("Primera versión", "V1", S.v1.texto));
    }
    var t1 = el("textarea", { rows: 3, maxlength: 600, placeholder: "Respuesta breve", "aria-label": "¿Qué decisión tuvo mayor impacto en el resultado que finalmente elevó?" }); t1.value = S.reflexion.decision;
    var t2 = el("input", { type: "text", maxlength: 200, "aria-label": "Antes de producir con IA, voy a…" }); t2.value = S.reflexion.regla;
    var fin = btn("Finalizar práctica", function () {
      S.reflexion = { decision: t1.value.trim(), regla: t2.value.trim() }; S.finalizada = true;
      ir("finalizada");
    }, "verde");
    var act = function () { S.reflexion.decision = t1.value; S.reflexion.regla = t2.value; guardar(); fin.disabled = !(t1.value.trim() && t2.value.trim()); };
    t1.addEventListener("input", act); t2.addEventListener("input", act);
    fin.disabled = !(t1.value.trim() && t2.value.trim());
    c.appendChild(el("div", { class: "bloque" },
      el("h3", { class: "subt", text: "Reflexión final" }),
      el("p", { style: "font-weight:600;color:#262626", text: "¿Qué decisión tuvo mayor impacto en el resultado que finalmente elevó?" }), t1,
      el("p", { style: "font-weight:600;color:#262626;margin-top:14px", text: "Complete la frase" }),
      el("div", { style: "color:#262626;margin-bottom:4px", text: "Antes de producir con IA, voy a…" }), t2,
      el("div", { class: "fila", style: "justify-content:flex-end;margin-top:14px" }, fin)));
    app.appendChild(c);
  }

  function pantallaFinalizada() {
    try { window.parent.postMessage({ type: "complete" }, "*"); } catch (e) {}
    var c = el("div", { class: "cierre" });
    if (MODO === "embebido") {
      c.appendChild(el("h2", { class: "titulo", text: "Cierre conceptual" }));
      c.appendChild(el("div", { class: "bloque" }, el("p", { class: "conceptual", text: C.cierre.conceptual })));
      c.appendChild(el("h2", { class: "titulo", style: "margin-top:18px", text: "Para llevar al trabajo" }));
      c.appendChild(el("div", { class: "bloque" },
        el("h3", { class: "subt", text: C.cierre.kitTitulo }), el("p", { text: C.cierre.kitTexto }),
        el("a", { class: "btn verde", style: "display:inline-block;text-decoration:none", href: "media/kit-producir-con-ia.pdf", download: "Kit_Producir_con_IA.pdf", target: "_blank", rel: "noopener", text: C.cierre.kitBoton })));
    } else {
      c.appendChild(el("div", { class: "centrado", style: "position:relative;inset:auto;min-height:100%" },
        el("div", { class: "panel angosto", style: "text-align:center" },
          el("h2", { class: "titulo", text: "Práctica finalizada" }),
          el("p", { text: "Continúe debajo para completar el cierre de la práctica." }))));
    }
    app.appendChild(c);
  }

  /* ============================== ARRANQUE ============================== */
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.altKey && e.shiftKey && (e.key === "R" || e.key === "r")) {
      if (confirm("¿Reiniciar la práctica? Se borrará todo el avance guardado en este navegador.")) {
        try { localStorage.removeItem(CLAVE); } catch (x) {}
        S = estadoInicial(); if (visor) { try { visor.destroy(); } catch (x) {} visor = null; } app.innerHTML = ""; render();
      }
    }
  });
  cargar();
  if (S.pantalla === "revisando" && S.entregas.length && S.entregas[S.entregas.length - 1].resultado) S.pantalla = "resultado";
  if (S.pantalla === "escena" && S.escenaPaso === "esperaMarta") S.escenaPaso = "marta";
  render();
})();
