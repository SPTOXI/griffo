import type { AtsLocale } from '../content-types'

/** Guias de ATS em espanhol: os 5 globais mais o InfoJobs (Espanha). */
export const atsEs: AtsLocale = {
  workday: {
    marketName: 'Estados Unidos, Europa y multinacionales globales',
    description:
      'Workday es el sistema corporativo estándar en la mayoría de las empresas del Fortune 500 y en las grandes multinacionales. Es conocido por tener uno de los parsers más estrictos y estandarizados del mercado de RR. HH.',
    marketShare: 'Utilizado por más del 50 % de las corporaciones del Fortune 500.',
    howItWorks: [
      {
        title: 'Mapeo estructurado de campos',
        description:
          'Workday divide el currículum en campos predefinidos: empresa, puesto, periodo y responsabilidades. Cualquier desajuste de formato provoca pérdida de datos en el filtrado.',
      },
      {
        title: 'Filtrado según normativa internacional',
        description:
          'Filtra candidaturas conforme a normativas laborales globales y exige claridad en la progresión profesional y la seniority.',
      },
      {
        title: 'Verificación de métricas y requisitos',
        description:
          'El sistema prioriza perfiles que demuestran impacto medible alineado con las competencias de la oferta.',
      },
    ],
    eliminationFactors: [
      'Formatos y diseños poco convencionales que corrompen el llenado automático de campos.',
      'Fechas y periodos inconsistentes que impiden calcular los años de experiencia.',
      'Títulos de puesto sin correspondencia clara con los estándares internacionales.',
    ],
    howGriffoWorkHelps: [
      'Garantiza que el parser de Workday lea sin errores la jerarquía de tu currículum.',
      'Comprueba la alineación con los estándares internacionales de contratación (EE. UU., Europa y global).',
      'Audita la densidad de métricas y logros frente a los filtros corporativos del sistema.',
      'Genera una carta de presentación dirigida a la oferta concreta.',
    ],
    faqs: [
      {
        question: '¿Por qué Workday es tan exigente?',
        answer:
          'Como las multinacionales reciben miles de candidaturas por vacante, Workday aplica criterios estructurados y descarta currículums con formato confuso o datos que no puede clasificar.',
      },
      {
        question: '¿Cómo prepara GriffoWork mi perfil para Workday?',
        answer:
          'GriffoWork revisa la claridad cronológica, el formato y la presencia de métricas ejecutivas para que Workday extraiga tu trayectoria sin fallos.',
      },
    ],
  },
  greenhouse: {
    marketName: 'Tecnología global, startups y scaleups',
    description:
      'Greenhouse es la plataforma de reclutamiento más utilizada en el ecosistema tecnológico global, startups de hipercrecimiento y unicornios, centrada en contrataciones basadas en competencias y evidencias.',
    marketShare: 'Líder entre empresas de tecnología e innovación en EE. UU., Europa y América Latina.',
    howItWorks: [
      {
        title: 'Scorecards de competencias',
        description:
          'Evalúa al candidato frente a scorecards específicos de habilidades técnicas, herramientas y liderazgo.',
      },
      {
        title: 'Integración con portafolios y perfiles',
        description:
          'Conecta los datos del currículum con enlaces profesionales (LinkedIn, GitHub, portafolios) para la revisión del equipo técnico.',
      },
    ],
    eliminationFactors: [
      'Currículums genéricos que no demuestran dominio práctico de herramientas y frameworks.',
      'Ausencia de resultados concretos en experiencias anteriores.',
      'Falta de conexión clara entre los proyectos y el impacto en el negocio.',
    ],
    howGriffoWorkHelps: [
      'Mapea la correspondencia entre tus competencias técnicas y las exigidas por la oferta.',
      'Audita tus perfiles profesionales para mantenerlos coherentes con el currículum.',
      'Puntúa impacto y claridad según los criterios de scorecard de los reclutadores.',
    ],
    faqs: [
      {
        question: '¿Por qué Greenhouse es tan popular en tecnología?',
        answer:
          'Porque permite a los equipos de ingeniería y producto evaluar competencias de forma estructurada y colaborativa, reduciendo sesgos en el primer filtrado.',
      },
      {
        question: '¿GriffoWork cubre vacantes remotas internacionales en Greenhouse?',
        answer: 'Sí. GriffoWork adapta el informe a procesos globales y requisitos internacionales.',
      },
    ],
  },
  lever: {
    marketName: 'Scaleups y Big Tech',
    description:
      'Lever combina el seguimiento de candidaturas (ATS) con la gestión de relaciones con talento (CRM), permitiendo a los equipos de selección captar y cualificar candidatos de forma continua desde su propia base de datos.',
    marketShare: 'Ampliamente adoptado por empresas tecnológicas medianas y grandes.',
    howItWorks: [
      {
        title: 'Indexación continua de talento',
        description:
          'Almacena e indexa la trayectoria completa del candidato para cruzarla con vacantes actuales y futuras.',
      },
      {
        title: 'Búsqueda semántica por competencias',
        description:
          'Los reclutadores filtran candidatos mediante búsquedas semánticas detalladas por herramientas, puestos y formación.',
      },
    ],
    eliminationFactors: [
      'Ausencia de términos técnicos, de modo que el sistema nunca encuentra el perfil en búsquedas temáticas.',
      'Descripciones vagas que no reflejan la profundidad del conocimiento.',
    ],
    howGriffoWorkHelps: [
      'Asegura la presencia de las palabras clave estratégicas para que tu currículum aparezca en las búsquedas de Lever.',
      'Refuerza tu posicionamiento para que el perfil siga funcionando a largo plazo en la base de talento.',
    ],
    faqs: [
      {
        question: '¿Cómo funciona la base de talento de Lever?',
        answer:
          'Lever mantiene los perfiles archivados y consultables. Un currículum con alta densidad de términos relevantes sigue apareciendo para nuevas oportunidades.',
      },
    ],
  },
  taleo: {
    marketName: 'Banca, administración pública y grandes corporaciones',
    description:
      'Oracle Taleo es uno de los sistemas de reclutamiento corporativo más consolidados del mundo, muy utilizado en el sector financiero, petróleo y gas, telecomunicaciones y organismos públicos.',
    marketShare: 'Fuerte presencia en corporaciones tradicionales e instituciones financieras globales.',
    howItWorks: [
      {
        title: 'Filtros tradicionales de selección',
        description:
          'Aplica reglas estructuradas basadas en títulos formales, antigüedad y niveles de formación.',
      },
    ],
    eliminationFactors: [
      'Títulos de sección poco convencionales que el parser heredado no consigue clasificar.',
      'Elementos gráficos que rompen la jerarquía de la información.',
    ],
    howGriffoWorkHelps: [
      'Audita la estructura formal del currículum para su compatibilidad con el parser de Taleo.',
      'Verifica el formato de fechas, puestos y secciones que esperan las corporaciones tradicionales.',
    ],
    faqs: [
      {
        question: '¿Oracle Taleo se sigue usando mucho?',
        answer:
          'Sí, sobre todo en grandes bancos, grupos industriales y corporaciones que gestionan miles de empleados en todo el mundo.',
      },
    ],
  },
  ashby: {
    marketName: 'Startups globales y scaleups de IA',
    description:
      'Ashby es una plataforma de reclutamiento moderna que crece con rapidez entre empresas innovadoras de tecnología e inteligencia artificial, construida sobre automatización inteligente y analítica.',
    marketShare: 'Crecimiento acelerado entre scaleups de tecnología e IA.',
    howItWorks: [
      {
        title: 'Filtrado rápido y resúmenes con IA',
        description:
          'Genera resúmenes analíticos para que los reclutadores identifiquen con rapidez el impacto y la seniority del candidato.',
      },
    ],
    eliminationFactors: [
      'Currículums largos y sin foco que entierran los principales logros técnicos y el impacto conseguido.',
    ],
    howGriffoWorkHelps: [
      'Audita el resumen ejecutivo de tu currículum para que se lea rápido y con impacto.',
      'Destaca proyectos complejos y liderazgo técnico para los filtros de Ashby.',
    ],
    faqs: [
      {
        question: '¿Qué diferencia a Ashby de otros sistemas?',
        answer:
          'Ashby ofrece paneles analíticos y resúmenes automáticos que premian los currículums concisos y orientados a resultados.',
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
}
