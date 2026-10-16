import type { AtsLocale } from '../content-types'

/** Guias de ATS em espanhol: os 5 globais mais o InfoJobs (Espanha). */
export const atsEs: AtsLocale = {
  workday: {
    marketName: "Grandes Empresas y Organizaciones Globales",
    description:
      "Workday es una plataforma empresarial de RR. HH. y finanzas. Su software de captación de talento ayuda a las grandes empresas a gestionar ofertas, candidaturas y candidatos.",
    marketShare: "Workday informa de su uso en más del 60% de las empresas de Fortune 500.",
    howItWorks: [
      {
        title: "Perfil del candidato",
        description:
          "Las candidaturas se convierten en un perfil con datos como empresa, puesto, fechas y responsabilidades. Entradas claras y coherentes facilitan leer y comparar ese perfil.",
      },
      {
        title: "Requisitos de la oferta",
        description:
          "Los reclutadores comparan a los candidatos con los requisitos de la oferta, así que ayuda mostrar evidencia de las habilidades pedidas y resultados medibles.",
      },
    ],
    eliminationFactors: [
      "Diseños que dificultan leer puestos y fechas como texto.",
      "Fechas ausentes o incoherentes, que dejan poco clara tu trayectoria.",
      "Puestos y habilidades que nunca repiten el lenguaje de la oferta.",
    ],
    howGriffoWorkHelps: [
      "Comprueba que el currículum se lea como texto limpio, con puestos y fechas en orden.",
      "Compara tu experiencia con los requisitos de la oferta.",
      "Evalúa claridad y resultados medibles.",
      "Genera una carta de presentación dirigida al puesto.",
    ],
    faqs: [
      {
        question: "¿Workday rechaza currículums automáticamente?",
        answer:
          "Depende de cómo cada empresa haya configurado su proceso; Workday apoya a los reclutadores en la gestión y revisión de candidatos. Puestos, fechas y resultados claros hacen tu perfil más fácil de leer para personas y sistemas.",
      },
      {
        question: "¿Cómo prepara GriffoWork mi perfil para Workday?",
        answer:
          "GriffoWork revisa la claridad cronológica, el formato y los resultados medibles, para que tu historial se lea sin ruido.",
      },
    ],
  },
  greenhouse: {
    marketName: "Empresas que Contratan con Procesos Estructurados",
    description:
      "Greenhouse es una plataforma de contratación que reúne captación de talento, entrevistas y seguimiento de candidatos. Se basa en entrevistas estructuradas, con preguntas y criterios definidos por cada equipo.",
    marketShare: "Greenhouse informa de que miles de empresas usan su plataforma.",
    howItWorks: [
      {
        title: "Evaluación estructurada",
        description:
          "Los equipos definen preguntas y fichas de evaluación para cada puesto, y los entrevistadores valoran a los candidatos con los mismos criterios.",
      },
      {
        title: "Contexto del currículum y del perfil",
        description:
          "Tu currículum y los enlaces que compartas, como un portafolio o LinkedIn, dan contexto al equipo antes de las entrevistas.",
      },
    ],
    eliminationFactors: [
      "Currículums genéricos que no muestran uso práctico de las herramientas que pide el puesto.",
      "Falta de resultados concretos en puestos anteriores.",
      "Falta de relación clara entre proyectos e impacto en el negocio.",
    ],
    howGriffoWorkHelps: [
      "Mapea cuánto coinciden tus habilidades y métodos con el puesto.",
      "Comprueba que tus perfiles profesionales sean coherentes con el currículum.",
      "Evalúa impacto y claridad frente a criterios típicos de valoración.",
    ],
    faqs: [
      {
        question: "¿Cómo evalúa Greenhouse a los candidatos?",
        answer:
          "Greenhouse describe entrevistas estructuradas en las que los equipos usan sus propias preguntas y una rúbrica, con fichas para registrar la valoración. Un currículum con evidencia clara de cada requisito ayuda a que tu historia se sostenga.",
      },
      {
        question: "¿Sirve GriffoWork para puestos remotos en Greenhouse?",
        answer:
          "GriffoWork compara tu currículum con la descripción del puesto al que te presentas, esté donde esté.",
      },
    ],
  },
  lever: {
    marketName: "Empresas de Muchos Sectores",
    description:
      "Lever es una plataforma de reclutamiento con sistema de seguimiento de candidatos y funciones con IA. Su sitio destaca la automatización de tareas administrativas y de agenda, y recomendaciones de IA acompañadas de contexto.",
    marketShare: "Lever informa de que atiende a miles de clientes en más de 20 sectores.",
    howItWorks: [
      {
        title: "Automatización",
        description:
          "Las tareas administrativas, la agenda y los seguimientos se automatizan, para que el equipo de selección dedique su tiempo a decidir.",
      },
      {
        title: "Recomendaciones de IA",
        description:
          "Lever dice que su IA muestra primero a los candidatos que mejor encajan, con contexto en cada recomendación; un currículum que muestra con claridad los requisitos del puesto es más fácil de ubicar.",
      },
    ],
    eliminationFactors: [
      "Ausencia de términos de la oferta, lo que dificulta ver tu encaje.",
      "Descripciones vagas que no transmiten la profundidad de tu experiencia.",
    ],
    howGriffoWorkHelps: [
      "Comprueba que las palabras clave que pide el puesto estén en tu currículum.",
      "Afina tu posicionamiento para que tu encaje sea fácil de ver.",
    ],
    faqs: [
      {
        question: "¿Lever usa IA para ordenar candidatos?",
        answer:
          "Lever describe recomendaciones con IA que muestran primero a los candidatos que mejor encajan, cada una con contexto. La decisión de contratación sigue en manos del equipo de selección.",
      },
    ],
  },
  taleo: {
    marketName: "Grandes Empresas",
    description:
      "Oracle Taleo es una suite de captación de talento para búsqueda, selección e incorporación. Oracle ofrece Taleo Enterprise Edition y Taleo Business Edition, y también presenta Oracle Recruiting como camino para los clientes actuales de Taleo.",
    marketShare: "Producto consolidado de Oracle que las empresas usan para buscar y contratar talento.",
    howItWorks: [
      {
        title: "Filtro y entrevistas",
        description:
          "Oracle lista herramientas de filtro de candidatos, gestión de entrevistas y creación de ofertas. Cada empresa configura lo que pregunta y lo que comprueba.",
      },
      {
        title: "Portales de empleo y búsqueda de talento",
        description:
          "Portales de empleo con la marca de la empresa, campañas y recomendaciones llevan candidatos al sistema, donde los reclutadores los revisan.",
      },
    ],
    eliminationFactors: [
      "Títulos de sección poco convencionales o elementos gráficos que pueden dificultar la lectura automática.",
      "Fechas o puestos ausentes que dejan poco claro tu historial.",
    ],
    howGriffoWorkHelps: [
      "Evalúa la estructura del currículum para una lectura automática limpia.",
      "Comprueba las convenciones de fechas, puestos y secciones que las empresas suelen esperar.",
    ],
    faqs: [
      {
        question: "¿Se sigue usando Oracle Taleo?",
        answer:
          "Oracle sigue presentando Taleo como producto y también ofrece la migración a Oracle Recruiting. Que una empresa lo use es decisión de esa empresa.",
      },
    ],
  },
  ashby: {
    marketName: "De Startups a Grandes Empresas",
    description:
      "Ashby es una plataforma de reclutamiento todo en uno que reúne sistema de seguimiento de candidatos, captación y CRM, agenda y analítica, con IA integrada.",
    marketShare: "Ashby ofrece planes para startups, empresas en crecimiento y grandes empresas.",
    howItWorks: [
      {
        title: "Analítica e IA",
        description:
          "Ashby combina analítica de reclutamiento con funciones de IA para ayudar a los equipos a evaluar candidatos y llevar el proceso.",
      },
    ],
    eliminationFactors: [
      "Currículums largos y sin foco, que esconden los principales logros y el impacto entregado.",
    ],
    howGriffoWorkHelps: [
      "Revisa el resumen de tu currículum para que se lea rápido y con claridad.",
      "Destaca proyectos complejos y liderazgo técnico.",
    ],
    faqs: [
      {
        question: "¿Qué distingue a Ashby de otros sistemas?",
        answer:
          "Ashby se presenta como una plataforma todo en uno: seguimiento de candidatos, captación y CRM, agenda y analítica, con IA integrada.",
      },
    ],
  },
  infojobs: {
    marketName: 'España, Brasil e Italia',
    description:
      'InfoJobs es uno de los portales de empleo y filtrado de currículums más tradicionales de España, Italia y Brasil, utilizado por miles de reclutadores de todos los sectores.',
    marketShare: 'Referencia histórica en candidaturas y ofertas corporativas en España.',
    howItWorks: [
      {
        title: 'Filtros directos del reclutador',
        description:
          'Permite filtrar candidatos por ubicación, banda salarial, formación y experiencia reciente.',
      },
    ],
    eliminationFactors: [
      'Falta de claridad en los datos de contacto, la ubicación y las pretensiones salariales.',
    ],
    howGriffoWorkHelps: [
      'Comprueba que estén completas todas las secciones obligatorias para los procesos de InfoJobs.',
      'Verifica que competencias y trayectoria encajen con el mercado español y brasileño.',
    ],
    faqs: [
      {
        question: '¿Cómo funciona la búsqueda de candidatos en InfoJobs?',
        answer:
          'Los reclutadores filtran por palabras clave y ubicación antes de abrir los currículums uno a uno.',
      },
    ],
  },
  smartrecruiters: {
    marketName: "Empresas Medianas y Grandes con Presencia Internacional",
    description:
      "SmartRecruiters es una plataforma de adquisición de talento que empresas medianas y grandes usan para publicar ofertas, recibir candidaturas y gestionar candidatos en un único flujo. El currículum se lee y se convierte en un perfil que el reclutador busca, filtra y compara.",
    marketShare: "Muy utilizado por empresas internacionales medianas y grandes.",
    howItWorks: [
      {
        title: "Lectura del currículum como perfil",
        description:
          "El sistema lee el archivo y crea un perfil estructurado: datos de contacto, experiencia, formación y habilidades. Lo que no se lee como texto puede no llegar nunca al reclutador.",
      },
      {
        title: "Preguntas en la candidatura",
        description:
          "La empresa puede añadir preguntas de filtro al formulario, como permiso de trabajo, ubicación o experiencia exigida, y el reclutador usa las respuestas para filtrar la lista.",
      },
      {
        title: "Evaluación en equipo",
        description:
          "Reclutadores y responsables comparan perfiles lado a lado, por lo que un resumen claro y resultados cuantificados facilitan la comparación.",
      },
    ],
    eliminationFactors: [
      "Diseños de varias columnas, tablas o cuadros de texto que desordenan la lectura de tu trayectoria.",
      "Datos de contacto o habilidades clave en encabezados, pies de página o imágenes, que los lectores suelen ignorar.",
      "Términos distintos a los de la oferta, lo que debilita las búsquedas y los filtros.",
    ],
    howGriffoWorkHelps: [
      "Comprueba si un lector típico de ATS interpreta tu currículum como texto limpio y en el orden correcto.",
      "Compara tus habilidades y tu redacción con la oferta para encontrar palabras clave ausentes.",
      "Evalúa si tus logros y métricas destacan cuando el reclutador compara perfiles.",
      "Genera una carta de presentación dirigida al puesto.",
    ],
    faqs: [
      {
        question: "¿SmartRecruiters descarta mi currículum automáticamente?",
        answer:
          "Depende de cómo haya configurado la oferta cada empresa. Muchas usan preguntas y filtros, y el reclutador decide el resto. Un currículum que el sistema no lee bien pasa más fácilmente desapercibido, por eso importa un diseño limpio.",
      },
      {
        question: "¿Qué formato de archivo funciona mejor?",
        answer:
          "Sigue el formato que pida la empresa. Si es libre, un PDF con texto seleccionable o un .docx sencillo de una columna es la opción más segura.",
      },
    ],
  },
  successfactors: {
    marketName: "Grandes Corporaciones y Multinacionales",
    description:
      "SAP SuccessFactors Recruiting es el módulo de selección de la suite de gestión de personas de SAP. Las grandes organizaciones lo usan para llevar procesos de selección estructurados y orientados al cumplimiento, con el currículum alimentando el perfil del candidato junto al formulario.",
    marketShare: "Elección habitual en grandes corporaciones que ya trabajan con SAP.",
    howItWorks: [
      {
        title: "Formulario estructurado",
        description:
          "El candidato suele rellenar un formulario detallado en el portal de empleo de la empresa, y el currículum se adjunta o se lee para completar partes del perfil. Los campos incoherentes con el currículum llaman la atención.",
      },
      {
        title: "Preguntas de preselección",
        description:
          "La empresa puede configurar preguntas por oferta, como certificaciones, idiomas o disponibilidad, que el reclutador usa para reducir el grupo de candidatos.",
      },
      {
        title: "Proceso y cumplimiento",
        description:
          "Las candidaturas pasan por etapas definidas y con registro de cada una; fechas y puestos completos y coherentes ayudan a que tu trayectoria se sostenga en la revisión.",
      },
    ],
    eliminationFactors: [
      "Fechas de empleo ausentes, solapadas o distintas entre el formulario y el currículum.",
      "Puestos y responsabilidades que no se relacionan con claridad con los requisitos de la oferta.",
      "Formato decorativo que oculta texto al lector o rompe el orden de tu trayectoria.",
    ],
    howGriffoWorkHelps: [
      "Comprueba que fechas, puestos y secciones sean coherentes entre el currículum y el formulario.",
      "Compara tu experiencia con los requisitos de la oferta.",
      "Evalúa la claridad y el impacto medible para la selección en grandes empresas.",
      "Genera una carta de presentación dirigida al puesto.",
    ],
    faqs: [
      {
        question: "¿Mi currículum debe coincidir con el formulario?",
        answer:
          "Sí. El reclutador ve ambos, y las diferencias en fechas, puestos o empresas generan dudas. Mantén los dos coherentes.",
      },
      {
        question: "¿SuccessFactors solo lo usan empresas enormes?",
        answer:
          "Es más habitual en grandes organizaciones, por eso los procesos suelen ser formales y estar bien documentados. Las empresas pequeñas lo usan con menos frecuencia.",
      },
    ],
  },
  workable: {
    marketName: "Empresas en Crecimiento y Medianas en Todo el Mundo",
    description:
      "Workable es una plataforma de reclutamiento que usan empresas en crecimiento y medianas para publicar ofertas en varios portales, recibir candidaturas en un solo lugar y ordenar candidatos. Lee cada currículum como un perfil y ofrece herramientas con IA que ayudan al reclutador a preseleccionar.",
    marketShare: "Popular entre pequeñas y medianas empresas que contratan a nivel internacional.",
    howItWorks: [
      {
        title: "Lectura del currículum",
        description:
          "Workable extrae experiencia, formación y habilidades del archivo que subes. El texto que no puede leer, como el contenido dentro de imágenes, se pierde del perfil.",
      },
      {
        title: "Preguntas de filtro",
        description:
          "Las empresas suelen añadir preguntas a la candidatura, y las respuestas ayudan al reclutador a ordenar candidatos con rapidez.",
      },
      {
        title: "Preselección con apoyo de IA",
        description:
          "La plataforma ofrece funciones que ayudan al reclutador a ordenar y preseleccionar candidatos para el puesto, así que las habilidades y términos de tu currículum importan.",
      },
    ],
    eliminationFactors: [
      "Información dentro de imágenes, gráficos o barras de nivel que el sistema no puede leer.",
      "Un perfil que nunca nombra las herramientas y habilidades que pide la oferta.",
      "Documentos demasiado largos que entierran la experiencia más relevante.",
    ],
    howGriffoWorkHelps: [
      "Comprueba que tu currículum se pueda leer como texto simple, sin contenido oculto.",
      "Encuentra habilidades y términos de la oferta que tu currículum no menciona.",
      "Evalúa si tu experiencia más relevante es fácil de encontrar.",
      "Genera una carta de presentación dirigida al puesto.",
    ],
    faqs: [
      {
        question: "¿Workable usa IA para ordenar currículums?",
        answer:
          "Ofrece funciones con IA que las empresas pueden usar al preseleccionar. Cuánto confían en ellas depende de cada empresa, así que escribe para un lector automático y para una persona.",
      },
      {
        question: "¿Necesito usar las palabras clave de la oferta?",
        answer:
          "Sí, cuando sean ciertas. Usar los mismos términos del anuncio hace más fácil encontrar y comparar tu experiencia.",
      },
    ],
  },
  oraclerecruiting: {
    marketName: "Grandes Empresas y Empleadores Globales",
    description:
      "Oracle Recruiting es el módulo de selección de la suite de RR. HH. en la nube de Oracle, que usan las grandes empresas para mantener su portal de empleo, recibir candidaturas y gestionar candidatos. Es el equivalente en la nube de Taleo dentro de la familia Oracle HCM y crea el perfil del candidato a partir del currículum y de las respuestas de la candidatura.",
    marketShare: "Elección habitual en grandes empresas que ya usan Oracle para RR. HH.",
    howItWorks: [
      {
        title: "Portal de empleo y perfil del candidato",
        description:
          "El candidato se inscribe a través del portal de empleo de la empresa. El currículum y las respuestas del formulario se combinan en un único perfil que el reclutador busca y filtra.",
      },
      {
        title: "Cuestionarios y preselección",
        description:
          "La empresa puede adjuntar preguntas a una oferta, como certificaciones, idiomas o disponibilidad, y usar las respuestas para reducir el grupo de candidatos.",
      },
      {
        title: "Revisión estructurada",
        description:
          "Reclutadores y responsables evalúan a los candidatos en etapas definidas, así que fechas y puestos coherentes y resultados claros ayudan a que tu perfil se sostenga.",
      },
    ],
    eliminationFactors: [
      "Diseños que rompen el orden en que el sistema lee tu trayectoria.",
      "Fechas o puestos distintos entre el currículum y el formulario de la candidatura.",
      "Experiencia que no se relaciona con claridad con los requisitos de la oferta.",
    ],
    howGriffoWorkHelps: [
      "Comprueba que tu currículum se lea como texto limpio y en el orden correcto.",
      "Mantiene fechas, puestos y secciones coherentes entre el currículum y el formulario.",
      "Compara tu experiencia con los requisitos de la oferta.",
      "Genera una carta de presentación dirigida al puesto.",
    ],
    faqs: [
      {
        question: "¿Oracle Recruiting es lo mismo que Taleo?",
        answer:
          "No. Taleo es el producto de selección más antiguo de Oracle, mientras que Oracle Recruiting es el módulo más reciente de la suite de RR. HH. en la nube. Las empresas pueden usar cualquiera, así que los mismos buenos hábitos valen para ambos.",
      },
      {
        question: "¿El currículum debe coincidir con las respuestas de la candidatura?",
        answer:
          "Sí. El reclutador ve ambos, y las diferencias en fechas, puestos o empresas generan dudas. Mantén todo coherente.",
      },
    ],
  },
  bamboohr: {
    marketName: "Pequeñas y Medianas Empresas",
    description:
      "BambooHR es una plataforma de RR. HH. para pequeñas y medianas empresas cuya herramienta de selección permite publicar ofertas, recibir candidaturas y seguir a los candidatos en un flujo sencillo. Con frecuencia, RR. HH. y el responsable de contratación revisan a los candidatos juntos en el mismo sistema.",
    marketShare: "Popular entre pequeñas y medianas empresas que gestionan RR. HH. en un solo lugar.",
    howItWorks: [
      {
        title: "Candidatura y currículum",
        description:
          "El candidato envía su currículum y responde las preguntas que añadió la empresa. Los datos llegan a una ficha que el equipo puede leer lado a lado.",
      },
      {
        title: "Flujo de selección sencillo",
        description:
          "Los candidatos pasan por las etapas que define la empresa, y los miembros del equipo añaden valoraciones y comentarios por el camino.",
      },
      {
        title: "Revisión compartida",
        description:
          "Como RR. HH. y los responsables leen el mismo perfil, funciona mejor un currículum claro incluso para quien no es especialista.",
      },
    ],
    eliminationFactors: [
      "Currículums que entierran la experiencia relevante bajo secciones largas y densas.",
      "Formato que corrompe el texto cuando el sistema lee el archivo.",
      "Redacción genérica que nunca refleja el puesto que se busca cubrir.",
    ],
    howGriffoWorkHelps: [
      "Comprueba que tu currículum se lea con claridad, sin perder nada por el formato.",
      "Evalúa si tu experiencia más relevante aparece pronto y con claridad.",
      "Compara tu redacción con la oferta para detectar términos ausentes.",
      "Genera una carta de presentación dirigida al puesto.",
    ],
    faqs: [
      {
        question: "¿BambooHR filtra currículums automáticamente?",
        answer:
          "Está pensado en torno a un flujo de equipo: la empresa configura preguntas y etapas, y las personas revisan a los candidatos. Lo que más importa es un currículum claro y buenas respuestas a las preguntas.",
      },
      {
        question: "¿Quién lee mi currículum en una empresa pequeña?",
        answer:
          "A menudo, una persona de RR. HH. generalista y el responsable de contratación. Escribe para que alguien ajeno a la especialidad vea tus resultados enseguida.",
      },
    ],
  },
  breezyhr: {
    marketName: "Pequeñas Empresas y Equipos en Crecimiento",
    description:
      "Breezy HR es un sistema de seguimiento de candidatos para pequeñas empresas y equipos en crecimiento. Publica ofertas en varios portales, reúne las candidaturas en un solo lugar y muestra a los candidatos en un flujo visual, con herramientas que ayudan al reclutador a puntuar y comparar.",
    marketShare: "Popular entre pequeñas empresas y equipos de selección reducidos.",
    howItWorks: [
      {
        title: "Lectura del currículum",
        description:
          "Breezy lee el currículum que subes y rellena un perfil del candidato. Lo que no puede leer como texto, como el texto dentro de imágenes, se pierde de ese perfil.",
      },
      {
        title: "Cuestionarios",
        description:
          "La empresa puede añadir preguntas a la candidatura, y las respuestas ayudan a ordenar candidatos con rapidez.",
      },
      {
        title: "Puntuación y flujo",
        description:
          "Los reclutadores valoran a los candidatos y los mueven entre etapas, así que un perfil fácil de evaluar en pocos segundos tiene ventaja.",
      },
    ],
    eliminationFactors: [
      "Información en imágenes, gráficos o barras de nivel que el sistema no puede leer.",
      "Un perfil que nunca nombra las habilidades y herramientas que pide la oferta.",
      "Documentos demasiado largos que ocultan la experiencia más relevante.",
    ],
    howGriffoWorkHelps: [
      "Comprueba que tu currículum se pueda leer como texto simple, sin nada oculto.",
      "Encuentra habilidades y términos de la oferta que tu currículum no menciona.",
      "Evalúa si tu experiencia más relevante es fácil de encontrar.",
      "Genera una carta de presentación dirigida al puesto.",
    ],
    faqs: [
      {
        question: "¿Breezy HR ordena a los candidatos automáticamente?",
        answer:
          "Ofrece herramientas de puntuación que el reclutador puede usar junto con su propio criterio. El peso que les da depende de cada empresa, así que escribe para un lector automático y para una persona.",
      },
      {
        question: "¿Necesito las palabras exactas de la oferta?",
        answer:
          "Úsalas cuando sean ciertas. Los mismos términos del anuncio hacen más fácil encontrar y comparar tu experiencia.",
      },
    ],
  },
  zohorecruit: {
    marketName: "Agencias de Selección y Empresas que Contratan en Todo el Mundo",
    description:
      "Zoho Recruit es un software de seguimiento de candidatos y selección que usan tanto equipos internos como agencias de selección. Publica ofertas en varios portales, lee los currículums como fichas de candidato y permite al reclutador buscar, etiquetar y preseleccionar.",
    marketShare: "Lo usan equipos internos y agencias de selección de distintos tamaños en todo el mundo.",
    howItWorks: [
      {
        title: "Lectura del currículum como ficha",
        description:
          "El sistema lee tu currículum y crea una ficha con experiencia, formación y habilidades. Lo que no pueda leer como texto puede faltar en esa ficha.",
      },
      {
        title: "Base de datos de búsqueda",
        description:
          "Los reclutadores buscan en la base de candidatos por habilidades, puestos y palabras clave, así que los términos de tu currículum deciden si apareces en los resultados.",
      },
      {
        title: "Preselección",
        description:
          "Los reclutadores etiquetan candidatos y envían una preselección al cliente o al responsable, que ve primero un perfil resumido.",
      },
    ],
    eliminationFactors: [
      "Información en imágenes o gráficos que el sistema no puede convertir en texto.",
      "Habilidades y herramientas ausentes en tu currículum que el puesto pide expresamente.",
      "Puestos o términos distintos de como el sector suele nombrar el rol.",
    ],
    howGriffoWorkHelps: [
      "Comprueba que un lector típico interprete tu currículum como texto limpio.",
      "Encuentra términos de la oferta que tu currículum no menciona.",
      "Evalúa si tu experiencia más relevante es fácil de encontrar y preseleccionar.",
      "Genera una carta de presentación dirigida al puesto.",
    ],
    faqs: [
      {
        question: "¿Zoho Recruit lo usan agencias o empresas?",
        answer:
          "Ambas. Las agencias lo usan para gestionar muchos puestos y candidatos de sus clientes, y las empresas para su propia selección.",
      },
      {
        question: "¿Cómo me encuentran los reclutadores en la base de datos?",
        answer:
          "Sobre todo buscando habilidades, puestos y palabras clave. Usa los nombres estándar de tus herramientas y de tu rol para que una búsqueda encuentre tu currículum.",
      },
    ],
  },
}
