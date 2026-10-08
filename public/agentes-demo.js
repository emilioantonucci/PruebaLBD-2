/* LBD · PRODUCIR — Agentes SIMULADOS para la versión demo (sin API, sin servicios externos).
   Responden con la misma forma que el servicio intermedio real (servicio/worker.js), de modo que
   para conectar la IA real basta con cambiar config.js (agentes: "servicio" + proxyUrl).
   Asistente de producción y revisión siguen separados: no comparten estado ni funciones de juicio. */
(function () {
  "use strict";

  function norm(t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function tiene(t, re) { return re.test(norm(t)); }
  function demora(min, max) { return new Promise(function (r) { setTimeout(r, min + Math.random() * (max - min)); }); }

  /* ======================= ASISTENTE DE PRODUCCIÓN ======================= */
  var RE = {
    producir: /(prepar|redact|escrib|elabor|arm[aeá]|hac[eé]|gener|carta|comunicaci|intim|nota|borrador|propuest|version|texto|document)/,
    monto: /(monto|suma|3\.?500|4\.?000|cuatro millones|comprobante|acredit|pag[oóa]|anticipo|transferencia|dinero|importe)/,
    plazo: /(plazo|prorroga|extensi|septiembre|vencim|vencid|45 dias|fecha|fin de mes|dias mas)/,
    firme: /(mas firme|firme|contundente|enfatic|estrict|tajante|duro)/,
    suave: /(suav|concilia|amable|cordial|menos agresiv|menos dur|amigable|evitar (una )?pelea|tono mas)/,
    breve: /(breve|corto|cort[ao]|resum|sintet|reduc|menos extens)/,
    largo: /(mas detall|ampli|desarroll|extend)/,
    defectos: /(defecto|mesada|campana|desnivel|vicio|falla)/,
    quitar: /(quit|elimin|sac[aá]|sin |omit|borr)/,
    resolucion: /(resoluci|rescis|terminar la relacion|relacion contractual|perjuicio|resolver el contrato)/,
    horas: /(48|cuarenta y ocho|horas)/,
    evaluar: /(esta bien|es correct|cumple|evalu|que te parece|que le parece|opin|aprob|esta ok|sirve asi)/
  };

  var DEFECTO = { monto: "aprox4", plazo: "45dias", tono: "firme", breve: false, defectos: false, resolucion: true, horas48: true, mensaje28: false, transferencia: false };

  function inferirParametros(texto) {
    var t = norm(texto), p = JSON.parse(JSON.stringify(DEFECTO));
    if (!t) return p;
    if (/4\.000\.000|cuatro millones/.test(t)) p.monto = "aprox4"; else if (/3\.500\.000/.test(t)) p.monto = "acreditado"; else p.monto = "omitido";
    p.transferencia = /transferencia posterior/.test(t);
    p.plazo = /extender ese plazo|prorroga|hasta fin de septiembre/.test(t) ? "prorroga" : (/45 dias corridos/.test(t) ? "45dias" : "generico");
    p.tono = /lo intimo/.test(t) ? "firme" : "conciliador";
    p.breve = !/de mi consideracion/.test(t);
    p.defectos = /mesada/.test(t);
    p.resolucion = /relacion contractual/.test(t);
    p.horas48 = /48 horas/.test(t);
    p.mensaje28 = /28 de septiembre/.test(t);
    return p;
  }

  function aplicarPedido(p, pedido, contexto) {
    var t = norm(pedido), cambios = [];
    if (RE.monto.test(t)) {
      if (/(aproximad|cuatro|4\.?000|lo que (dijo|indico) marta)/.test(t) && !/(comprobante|acredit|3\.?500|respald)/.test(t)) { p.monto = "aprox4"; }
      else { p.monto = "acreditado"; if (/transferencia|ademas|tambien|lo que (dijo|informo|indico) marta/.test(t)) p.transferencia = true; }
      cambios.push("monto");
    }
    if (RE.plazo.test(t)) { p.plazo = /(sin|quit|elimin|omit)/.test(t) && !/prorroga|extensi/.test(t) ? "generico" : "prorroga"; cambios.push("plazo"); }
    if (RE.suave.test(t)) { p.tono = "conciliador"; cambios.push("tono"); }
    else if (RE.firme.test(t)) { p.tono = "firme"; cambios.push("tono"); }
    if (RE.breve.test(t)) { p.breve = true; cambios.push("extensión"); }
    if (RE.largo.test(t)) { p.breve = false; cambios.push("extensión"); }
    if (RE.defectos.test(t)) { p.defectos = !RE.quitar.test(t); cambios.push("defectos"); }
    if (RE.resolucion.test(t)) { p.resolucion = !RE.quitar.test(t); cambios.push("resolución"); }
    if (RE.horas.test(t) && !RE.resolucion.test(t)) { p.horas48 = !RE.quitar.test(t); cambios.push("plazo de 48 horas"); }
    if (/28 de septiembre|mensaje de (hernan|ledesma)|demora|materiales/.test(t)) { p.mensaje28 = !RE.quitar.test(t); cambios.push("mensaje del 28 de septiembre"); }
    return cambios;
  }

  function redactar(p) {
    var P = [];
    P.push("[Lugar y fecha]");
    P.push("Señor\nHernán Ledesma\n[domicilio del destinatario]");
    if (!p.breve) P.push("Ref.: Obra de remodelación de cocina del local de Marta Quiroga");
    P.push(p.breve ? "Señor Ledesma:" : "De mi consideración:");
    P.push("Me dirijo a usted en representación de la Sra. Marta Quiroga, en relación con la obra de remodelación de cocina de su local, contratada según el presupuesto aceptado por un precio total de $9.000.000.");
    var pago = "";
    if (p.monto === "aprox4") pago = "Mi representada abonó a la fecha la suma de $4.000.000, entre el anticipo y una transferencia posterior destinada a materiales.";
    if (p.monto === "acreditado") pago = "Según el comprobante del 5 de agosto, usted recibió de mi representada la suma de $3.500.000 en concepto de anticipo." + (p.transferencia ? " Mi representada informa, además, haber realizado una transferencia posterior destinada a materiales." : "");
    var plazo = "";
    if (p.plazo === "45dias") plazo = "El presupuesto estableció un plazo de ejecución de 45 días corridos desde la acreditación del anticipo, plazo que se encuentra vencido sin que la obra haya sido terminada.";
    if (p.plazo === "prorroga") plazo = "El presupuesto estableció un plazo de ejecución de 45 días corridos desde la acreditación del anticipo. A principios de septiembre, a su pedido, mi representada aceptó extender ese plazo hasta fin de septiembre. Al día de la fecha, la obra continúa sin terminar.";
    if (p.plazo === "generico") plazo = "Al día de la fecha, la obra continúa sin terminar.";
    P.push([pago, plazo].filter(Boolean).join(" "));
    if (p.mensaje28) P.push("El 28 de septiembre usted informó una demora vinculada con materiales e indicó que finalizaría la obra la semana siguiente.");
    if (p.defectos && !p.breve) P.push("Asimismo, mi representada informa que la mesada quedó desnivelada y que la campana no funciona correctamente.");
    var plazoInt = p.horas48 ? "en el plazo de 48 horas de recibida la presente" : "en el plazo de [plazo a definir]";
    P.push(p.tono === "firme"
      ? "Por lo expuesto, lo intimo a finalizar la obra " + plazoInt + "."
      : "Por lo expuesto, le solicito finalizar la obra " + plazoInt + ", a fin de evitar mayores inconvenientes para ambas partes.");
    if (p.resolucion) P.push("En caso de incumplimiento, mi representada se reserva el derecho de dar por terminada la relación contractual y de reclamar los perjuicios correspondientes.");
    P.push(p.breve ? "Atentamente," : "Sin otro particular, saludo a usted atentamente.");
    P.push("[firma]\n[datos del estudio]");
    return P.join("\n\n");
  }

  function ultimaPropuesta(conv) {
    for (var i = conv.length - 1; i >= 0; i--) {
      var t = conv[i].texto || "";
      if (conv[i].rol === "asistente" && t.indexOf("Propuesta entregada:") === 0) return t.replace("Propuesta entregada:\n", "");
    }
    return "";
  }

  function respuestaInformativa(t) {
    var r = [];
    if (RE.monto.test(t)) r.push("Sobre el monto: el comprobante del 5 de agosto registra la recepción de 3.500.000 en concepto de anticipo. En su nota de voz, Marta indicó haber pagado alrededor de cuatro millones entre el anticipo y una transferencia posterior para materiales. El presupuesto fija un anticipo de 3.500.000.");
    if (RE.plazo.test(t)) r.push("Sobre el plazo: el presupuesto fija 45 días corridos desde la acreditación del anticipo. En su nota de voz, Marta indicó que a principios de septiembre aceptó extenderlo si la obra terminaba antes de fin de mes. El 28 de septiembre, Hernán Ledesma escribió que terminaría la semana siguiente.");
    if (RE.defectos.test(t)) r.push("Sobre los defectos: Marta indicó que la mesada quedó desnivelada y que la campana no funciona bien, y que todavía no sacó fotos.");
    return r.join("\n\n");
  }

  function reescribirFragmento(frag, pedido) {
    var t = norm(pedido), f = frag, cambiado = false;
    if (/^\s*\$?\s?4\.000\.000\s*$/.test(f)) return "$3.500.000";
    if (/4\.000\.000|cuatro millones|4 millones/.test(norm(f)) || (RE.monto.test(t) && /\$?\s?\d/.test(f))) {
      f = f.replace(/(la suma de )?\$?\s?4\.000\.000(,? entre el anticipo y una transferencia posterior destinada a materiales)?/i, "la suma de $3.500.000 en concepto de anticipo, según el comprobante del 5 de agosto");
      f = f.replace(/abon[oó] a la fecha/i, "abonó");
      cambiado = f !== frag;
    }
    if (!cambiado && (RE.plazo.test(t) || /45 d[ií]as/.test(f))) {
      var nf = f.replace(/,? plazo que se encuentra vencido sin que la obra haya sido terminada\.?/i, ". A principios de septiembre, a su pedido, mi representada aceptó extender ese plazo hasta fin de septiembre. Al día de la fecha, la obra continúa sin terminar.");
      if (nf !== f) { f = nf; cambiado = true; }
    }
    if (!cambiado && RE.suave.test(t)) { var s = f.replace(/lo intimo a/i, "le solicito").replace(/se reserva el derecho/i, "evaluará la posibilidad"); if (s !== f) { f = s; cambiado = true; } }
    if (!cambiado && RE.firme.test(t)) { var s2 = f.replace(/le solicito/i, "lo intimo a").replace(/, a fin de evitar mayores inconvenientes para ambas partes/i, ""); if (s2 !== f) { f = s2; cambiado = true; } }
    if (!cambiado && RE.breve.test(t)) { var partes = f.split(/\.\s+/); if (partes.length > 1) { f = partes[0] + "."; cambiado = true; } }
    if (!cambiado && RE.quitar.test(t)) { f = ""; cambiado = true; }
    return cambiado ? f : null;
  }

  function producir(b) {
    var pedido = b.pedido || {}, conv = b.conversacion || [], ctx = b.contexto || {};
    var t = norm(pedido.texto);
    return demora(1200, 2400).then(function () {
      if (pedido.tipo === "fragmento") {
        var nuevo = reescribirFragmento(pedido.fragmento || "", pedido.texto || "");
        if (nuevo === null) return { ok: true, tipo: "mensaje", mensaje: "Para reescribir este fragmento necesito una indicación más concreta sobre qué dato, tono o alcance desea cambiar." };
        return { ok: true, tipo: "fragmento", mensaje: "Preparé una nueva propuesta para el fragmento.", texto: nuevo };
      }
      if (RE.evaluar.test(t) && !RE.producir.test(t.replace(/version|texto|document|borrador|carta|comunicaci/g, ""))) {
        return { ok: true, tipo: "mensaje", mensaje: "Puedo describir lo que contiene el texto o preparar alternativas, pero no dictamino si está bien. Indique qué aspecto desea trabajar." };
      }
      var base = pedido.tipo === "ajuste" ? pedido.propuestaBase : (b.borrador && b.borrador.trim() ? b.borrador : ultimaPropuesta(conv));
      var esPregunta = /\?/.test(pedido.texto || "") && !/(prepar|redact|escrib|elabor|arm|hac|gener|ajust|cambi|modific|agreg|inclu|quit)/.test(t);
      if (esPregunta) {
        var info = respuestaInformativa(t);
        return { ok: true, tipo: "mensaje", mensaje: info || "Puedo preparar la comunicación, ajustar una propuesta o reescribir un fragmento. Indique qué necesita." };
      }
      var p = base ? inferirParametros(base) : JSON.parse(JSON.stringify(DEFECTO));
      if (!base) {
        var refs = (ctx.referencias || []).concat(ctx.notas || []).join(" ");
        if (/28 de septiembre/.test(norm(refs))) p.mensaje28 = true;
      }
      var cambios = aplicarPedido(p, pedido.texto || "", ctx);
      if (!base && !RE.producir.test(t) && !cambios.length) {
        return { ok: true, tipo: "mensaje", mensaje: "Puedo preparar la comunicación, ajustar una propuesta o reescribir un fragmento. Indique qué necesita." };
      }
      return { ok: true, tipo: "propuesta", mensaje: "Preparé una propuesta para la comunicación.", texto: redactar(p) };
    });
  }

  /* =========================== AGENTE DE REVISIÓN =========================== */
  var OBS = {
    monto: "Revise cómo quedó tratado el monto y si puede sostener esa formulación a partir de la base con la que trabajó.",
    plazo: "Revise cómo quedó definido el vencimiento de la obra y si esa formulación considera todo lo que surge de la base con la que trabajó.",
    alcance: "La comunicación incorpora contenidos que exceden lo que se pidió producir en esta instancia. Revise el alcance definido para esta versión.",
    proposito: "El propósito definido inicialmente no termina de reflejarse con claridad en la comunicación. Revise qué debería lograr prioritariamente el texto."
  };
  function aspectoDe(texto) { for (var k in OBS) if (OBS[k] === texto) return k; return null; }

  function detectar(texto) {
    var t = norm(texto), oraciones = t.split(/[.;:]\s+/), d = {};
    oraciones.forEach(function (o) {
      if (/(4\.000\.000|cuatro millones|4 millones|4000000)/.test(o) && !/(segun (lo )?(manifest|indic|inform)|refiere|manifesto|informa haber|indico haber|aproximad|alrededor)/.test(o)) d.monto = d.monto || (o.match(/4\.000\.000|cuatro millones|4 millones|4000000/) || [""])[0];
    });
    if (/45 dias/.test(t) && /(vencid|vencio|vencimiento|incumplid)/.test(t) && !/(prorroga|extend|extensi|fin de septiembre|fines de septiembre)/.test(t)) d.plazo = (t.match(/[^.]*45 dias[^.]*\./) || ["45 dias"])[0];
    var m = t.match(/(demanda|accion judicial|juicio|estrategia judicial|denuncia)/);
    if (m) d.alcance = m[0];
    if (t.replace(/\[[^\]]*\]/g, "").trim().length < 160 || !/(intim|solicit|requer|exig|emplaz|finaliz|termin)/.test(t)) d.proposito = "__global__";
    return d;
  }

  function revisar(b) {
    return demora(2200, 3600).then(function () {
      var numero = Number(b.numero) || 1;
      var actual = detectar(b.texto || "");
      var anterior = norm(b.versionAnterior || "");
      var hist = b.historial || [];
      var cerrados = {}, abiertas = [];
      hist.forEach(function (o) { var a = aspectoDe(o.texto); if (!a) return; if (o.estado === "resuelta") cerrados[a] = true; else abiertas.push({ id: o.id, aspecto: a, texto: o.texto }); });
      var resueltas = [], pendientes = [];
      abiertas.forEach(function (o) { if (actual[o.aspecto]) pendientes.push({ id: o.id, texto: o.texto }); else { resueltas.push(o.id); cerrados[o.aspecto] = true; } });
      var yaVistos = {}; abiertas.forEach(function (o) { yaVistos[o.aspecto] = true; });
      var nuevas = [];
      ["monto", "plazo", "alcance", "proposito"].forEach(function (a) {
        if (!actual[a] || cerrados[a] || yaVistos[a]) return;
        if (numero > 1) {
          // Solo se admite una observación nueva si deriva de cambios posteriores del participante.
          if (a === "proposito" || anterior.indexOf(actual[a]) !== -1) return;
        }
        nuevas.push({ texto: OBS[a] });
      });
      var observaciones = pendientes.concat(nuevas).slice(0, 2);
      var estado = observaciones.length ? "REQUIERE AJUSTE" : "CUMPLE";
      if (estado === "CUMPLE") resueltas = resueltas.concat(pendientes.map(function (p) { return p.id; }));
      return { ok: true, estado: estado, observaciones: estado === "CUMPLE" ? [] : observaciones, resueltas: resueltas };
    });
  }

  window.LBD_AGENTES_DEMO = {
    llamar: function (cuerpo) {
      if (cuerpo.accion === "producir") return producir(cuerpo);
      if (cuerpo.accion === "revisar") return revisar(cuerpo);
      return Promise.resolve({ ok: true, tipo: "ping" });
    }
  };
})();
