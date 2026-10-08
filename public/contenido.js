/* LBD · Práctica 1 · PRODUCIR — Contenidos del documento maestro (fuente de verdad).
   Los textos se reproducen literalmente. No agregar datos al caso. */
window.LBD_CONTENIDO = {
  escena: { dia: "Lunes · 8:15", lugar: "Estudio jurídico", ayudaArrastre: "Arrastre para explorar el entorno" },

  ahora: {
    ribas: "Revise el nuevo mensaje del responsable del caso.",
    marta: "Marta Quiroga dejó una nota de voz.",
    carpeta: "Revise los antecedentes disponibles antes de preparar la comunicación."
  },

  hotspots: {
    ribas:   { etiqueta: "Nuevo mensaje · Dr. Ribas", yaw: -0.2, pitch: -20 },
    marta:   { etiqueta: "Nota de voz · Marta Quiroga", yaw: -69, pitch: -49 },
    carpeta: { etiqueta: "Caso Quiroga · Antecedentes", yaw: 92, pitch: -49 }
  },

  ribas: {
    nombre: "Dr. Andrés Ribas",
    meta: "Responsable del caso · Lunes 5 de octubre · 8:12",
    asunto: "Quiroga · obra de cocina",
    tipo: "Mensaje de video",
    transcripcion: [
      "Buenos días. Necesito que prepare hoy una comunicación formal para Hernán Ledesma, el contratista de Marta Quiroga. La obra sigue sin terminar.",
      "El planteo tiene que ser firme. Considere exigir la finalización en 48 horas y dejar prevista la posibilidad de terminar la relación contractual y reclamar los perjuicios correspondientes si no cumple.",
      "Puede trabajar con el asistente del estudio. Los antecedentes están en la carpeta correspondiente.",
      "Envíeme la versión antes del mediodía para revisarla. Gracias."
    ]
  },

  marta: {
    nombre: "Marta Quiroga",
    meta: "Clienta · Nota de voz",
    transcripcion: [
      "Doctor, quería explicarle bien porque necesito resolver esto rápido. La cocina tenía que estar terminada hace semanas. Yo ya pagué alrededor de cuatro millones entre el anticipo y otra transferencia que hice después para materiales.",
      "A principios de septiembre Hernán me pidió unos días más y le dije que, si terminaba antes de fin de mes, no había problema. Pero seguimos igual.",
      "Además, la mesada quedó desnivelada y la campana no está funcionando bien. No saqué fotos todavía. Yo no quiero entrar en una pelea si se puede evitar. Necesito tener la cocina lista porque reabro el 20 y ya tengo reservas."
    ]
  },

  lectura: {
    titulo: "Primera lectura del caso",
    texto: "Antes de revisar los antecedentes, registre cómo entiende la tarea hasta este momento.",
    pregunta: "En una frase, ¿qué debería lograr la comunicación que va a preparar?",
    placeholder: "La comunicación debería...",
    boton: "Guardar mi lectura inicial"
  },

  comprobacion: {
    pregunta: "En esta instancia, ¿qué debe entregar?",
    opciones: [
      { id: "A", texto: "Una comunicación terminada y lista para enviar al contratista." },
      { id: "B", texto: "Una primera versión para revisión del responsable del caso." },
      { id: "C", texto: "Una estrategia completa para una eventual acción judicial." }
    ],
    feedback: {
      B: { titulo: "Así es.", texto: "En esta instancia corresponde preparar una primera versión para revisión antes de cualquier envío.", boton: "Continuar", correcta: true },
      A: { titulo: "Revise el pedido recibido.", texto: "El Dr. Ribas solicitó una primera versión para revisar antes de autorizar cualquier envío.", boton: "Intentar nuevamente" },
      C: { titulo: "Revise el alcance de la tarea.", texto: "La solicitud actual es preparar una comunicación formal. No se pidió desarrollar una estrategia judicial completa.", boton: "Intentar nuevamente" }
    }
  },

  mesa: {
    titulo: "Caso Quiroga",
    subtitulo: "Antecedentes del caso",
    texto: "Revise los materiales disponibles. Cada antecedente propone una acción breve para dejar preparada la base de trabajo. Las referencias y notas que registre quedarán disponibles cuando trabaje con el asistente IA.",
    carpeta: "Carpeta del caso",
    bloqueo: "Disponible después de revisar los antecedentes"
  },

  antecedentes: {
    presupuesto: {
      numero: "01", titulo: "Presupuesto aceptado", fuente: "Presupuesto aceptado",
      documento: "Presupuesto de obra",
      fragmentos: [
        { id: "p1", etiqueta: "Contratista:", valor: "Hernán Ledesma" },
        { id: "p2", etiqueta: "Obra:", valor: "remodelación de cocina del local de Marta Quiroga" },
        { id: "p3", etiqueta: "Precio total:", valor: "9.000.000" },
        { id: "p4", etiqueta: "Anticipo:", valor: "3.500.000" },
        { id: "p5", etiqueta: "Saldo:", valor: "contra entrega de la obra terminada" },
        { id: "p6", etiqueta: "Plazo de ejecución:", valor: "45 días corridos desde la acreditación del anticipo" },
        { id: "p7", etiqueta: "", valor: "El presupuesto no contiene cláusula penal ni cláusula resolutoria expresa." }
      ],
      accionTitulo: "Revisar condiciones del acuerdo",
      accionTexto: "Seleccione los datos o condiciones que considera conveniente mantener visibles durante la preparación de la comunicación.",
      boton: "Guardar referencias"
    },
    comprobante: {
      numero: "02", titulo: "Comprobante de pago",
      fecha: "5 de agosto",
      texto: "Recibí de Marta Quiroga la suma de 3.500.000 en concepto de anticipo por obra de cocina.",
      firma: "Firma: Hernán Ledesma",
      accionTitulo: "Extraer información para sus notas",
      accionTexto: "Revise el comprobante y registre, en una línea, la información que considera relevante para respaldar la comunicación. Utilice únicamente datos que surjan de este documento.",
      notaTitulo: "Nota de trabajo",
      placeholder: "Escriba aquí…",
      boton: "Guardar nota",
      controlTitulo: "Antes de continuar",
      controlPregunta: "¿Todo lo que registró puede localizarse en este comprobante?",
      controlSi: "Sí, guardar", controlNo: "Revisar mi nota",
      fuente: "Fuente: Comprobante de pago · 5 de agosto"
    },
    mensaje: {
      numero: "03", titulo: "Mensaje del contratista",
      autor: "Hernán Ledesma", fecha: "28 de septiembre · 19:04",
      texto: "Marta, disculpe la demora. No llegaron algunos materiales del proveedor. La semana que viene termino seguro.",
      accionTitulo: "Utilizar el antecedente",
      accionPregunta: "¿Qué función tendrá este mensaje en la preparación de la comunicación?",
      opcionCronologia: "Agregar a la cronología del caso",
      opcionAntecedente: "Utilizar como antecedente para la comunicación",
      opcionNoUsar: "No utilizar por ahora",
      cronologia: "28 de septiembre · Hernán Ledesma informa una demora vinculada con materiales y señala que finalizará la obra la semana siguiente.",
      noUsarTitulo: "Decisión registrada.",
      noUsarTexto: "Podrá volver a consultar este antecedente durante la preparación de la comunicación."
    }
  },

  antesDeProducir: {
    titulo: "Antes de producir",
    texto: "Antes de trabajar con el asistente, revise cuatro decisiones que encuadran el resultado.",
    tarjetas: [
      { id: "proposito", nombre: "PROPÓSITO", pregunta: "¿Qué debe lograr el resultado?",
        concepto: "El propósito define qué debe conseguir la producción, no solamente de qué debe hablar." },
      { id: "destinatario", nombre: "DESTINATARIO", pregunta: "¿Para quién debe funcionar?",
        concepto: "El destinatario orienta qué necesita comprender, recibir o poder hacer con el resultado." },
      { id: "restricciones", nombre: "RESTRICCIONES", pregunta: "¿Qué incluye, qué queda fuera y qué condiciones debe respetar?",
        concepto: "Las restricciones delimitan el resultado y evitan que la herramienta complete el alcance por su cuenta." },
      { id: "evidencia", nombre: "EVIDENCIA", pregunta: "¿Con qué respaldo cuenta?",
        concepto: "La evidencia define qué permite sostener una afirmación y cómo puede volver a comprobarse." }
    ],
    destinatario: "Hernán Ledesma, contratista.",
    instancia: "comunicación para revisión del Dr. Ribas antes de cualquier envío.",
    restricciones: [
      "La comunicación debe ser revisada por el Dr. Ribas antes de cualquier envío.",
      "El Dr. Ribas solicitó un planteo firme.",
      "La comunicación debe elaborarse a partir de los antecedentes disponibles.",
      "No debe realizarse ningún envío antes de la revisión del responsable del caso."
    ],
    fuentes: ["Información aportada por Marta.", "Presupuesto aceptado.", "Comprobante de pago.", "Mensaje de Hernán."],
    criterioTitulo: "Defina su criterio",
    criterioTexto: "Complete la regla que utilizará para esta comunicación:",
    criterioFrase: "Si una afirmación no puede sostenerse con la base disponible, en esta comunicación… ",
    criterioBoton: "Guardar criterio",
    asistenteTitulo: "Asistente IA del estudio",
    asistenteEstado: "Disponible",
    asistenteTexto: "La base de trabajo está preparada para comenzar la producción.",
    asistenteBoton: "Trabajar con el asistente"
  },

  m3: {
    titulo: "Prepare la comunicación formal",
    texto1: "Utilice el asistente del estudio para elaborar la comunicación formal dirigida a Hernán Ledesma.",
    texto2: "La comunicación será revisada posteriormente por el Dr. Ribas y podrá requerir ajustes antes de considerarse finalizada.",
    texto3: "Durante el trabajo podrá consultar nuevamente los antecedentes, conversar con el asistente, pedir ajustes y editar directamente el borrador.",
    lema: "El asistente propone. Usted decide qué queda en la comunicación.",
    saludo: "Tengo disponibles los antecedentes del caso y la base de trabajo que preparó. Indique qué necesita que elabore para esta comunicación.",
    ayuda: "Puede comenzar con una instrucción breve y continuar ajustando el resultado durante la conversación.",
    documento: "Comunicación a Hernán Ledesma",
    estadoBorrador: "BORRADOR EN TRABAJO · PARA REVISIÓN",
    vacio: "Todavía no se incorporó contenido.",
    propuestaLista: "Preparé una propuesta para la comunicación."
  },

  autocheck: [
    { id: "q1", pregunta: "¿La versión logra lo que definió que debía lograr?", opciones: ["Sí", "En parte", "Necesito ajustarlo"] },
    { id: "q2", pregunta: "¿Reconoce las decisiones relevantes que quedaron incorporadas en el texto?", opciones: ["Sí", "Hay alguna que necesito revisar", "Hay decisiones que el asistente resolvió y no había definido"] },
    { id: "q3", pregunta: "¿El documento se mantiene dentro de lo que se pidió producir?", opciones: ["Sí", "Tengo dudas", "Necesito ajustar algo"] },
    { id: "q4", pregunta: "Si el Dr. Ribas preguntara de dónde surgió una decisión importante del texto, ¿podría explicarla?", opciones: ["Sí", "No en todos los casos", "No estoy seguro"] }
  ],

  cierre: {
    conceptual: "Una producción con IA no se sostiene solo porque el texto resulte claro o convincente. También debe poder reconstruirse qué se decidió, con qué base y bajo qué condiciones se produjo.",
    kitTitulo: "Kit · Producir con IA",
    kitTexto: "Lleve este criterio a futuras tareas profesionales. El kit reúne preguntas de control, las cuatro decisiones previas a la producción y una plantilla breve para utilizar mientras trabaja con IA.",
    kitBoton: "Descargar Kit · Producir con IA"
  }
};
