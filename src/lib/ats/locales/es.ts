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
}
