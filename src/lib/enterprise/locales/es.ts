import type { EnterpriseLocale } from '../content-types'

export const es: EnterpriseLocale = {
  breadcrumbHome: 'Inicio',
  landing: {
    metaTitle: 'Griffo Enterprise — Emparejamiento de CV con IA para Equipos de Reclutamiento',
    metaDescription:
      'Encuentra al candidato adecuado — interno o externo — con el mismo motor de compatibilidad por IA detrás de GriffoWork. Pensado para reclutadores y RRHH que deciden contratación y movilidad interna.',
    keywords: [
      'griffo enterprise',
      'emparejamiento de cv con ia para reclutadores',
      'software de compatibilidad candidato-puesto',
      'software de movilidad interna',
      'ia para reclutamiento externo',
      'hr tech con ia',
    ],
    eyebrow: 'Griffo Enterprise',
    title: 'Encuentra al candidato adecuado — interno o externo',
    subtitle:
      'Griffo Enterprise ejecuta el mismo motor de compatibilidad CV×puesto con IA de GriffoWork sobre la base de tu empresa — revisando primero el equipo interno, luego los candidatos registrados, antes de llegar al grupo general de Griffo. Cada sugerencia muestra exactamente de dónde vino.',
    useCases: [
      {
        title: 'Reclutamiento externo',
        body: 'Puntúa automáticamente a cada candidato frente al puesto, con ranking y explicación — no solo coincidencia de palabras clave.',
      },
      {
        title: 'Movilidad interna',
        body: 'Detecta empleados que ya encajan en una nueva vacante antes de mirar hacia afuera — usando el perfil que ya mantienen en Griffo.',
      },
    ],
    ctaLabel: 'Hablar con ventas',
    faqs: [
      {
        question: '¿Qué es el emparejamiento de CV con IA?',
        answer:
          'Es el mismo motor de compatibilidad detrás de GriffoWork, aplicado a tu proceso de contratación: un modelo de IA lee el perfil profesional de un candidato y la vacante, y puntúa qué tan bien encajan en experiencia profesional, requisitos específicos del puesto y contexto — en lugar de solo buscar coincidencia de palabras clave.',
      },
      {
        question: '¿Cómo se mide la compatibilidad entre candidato y puesto?',
        answer:
          'Cada emparejamiento se desglosa en las mismas dimensiones que GriffoWork ya usa con candidatos — trayectoria profesional, ajuste al puesto específico y adecuación contextual — para que el reclutador vea no solo el puntaje, sino por qué se dio ese puntaje.',
      },
      {
        question: '¿Cuál es la diferencia entre reclutamiento externo y movilidad interna aquí?',
        answer:
          'El mismo motor de emparejamiento, con distinta fuente de candidatos. El reclutamiento externo puntúa a quienes postulan a una vacante desde fuera de la empresa. La movilidad interna puntúa a tus propios empleados — con su consentimiento — frente a nuevas vacantes antes de mirar hacia afuera.',
      },
      {
        question: '¿Griffo Enterprise reemplaza nuestro ATS actual?',
        answer:
          'No — ejecuta la capa de emparejamiento y puntuación sobre las postulaciones, ya sea que lleguen por tus propias vacantes o por un flujo ya existente. Está pensado para convivir con la forma en que ya haces seguimiento de candidatos, no para reemplazar ese sistema.',
      },
      {
        question: '¿Cómo se gestionan los datos del empleado en la movilidad interna?',
        answer:
          'El perfil de un empleado solo se usa para el emparejamiento interno después de que él lo autoriza explícitamente para esa empresa en particular — un consentimiento separado de cualquier visibilidad pública como candidato, y delimitado a una organización a la vez.',
      },
    ],
  },
  externalRecruitment: {
    metaTitle: 'Emparejamiento de Candidatos con IA para Reclutamiento Externo | Griffo Enterprise',
    metaDescription:
      'Puntúa y clasifica automáticamente a cada candidato con el motor de compatibilidad por IA de Griffo Enterprise — para equipos que reclutan externamente.',
    keywords: [
      'ia para reclutamiento externo',
      'software de ranking de candidatos',
      'ats con inteligencia artificial',
      'cribado de cv con ia',
      'software de emparejamiento de vacantes para reclutadores',
    ],
    eyebrow: 'Reclutamiento Externo',
    title: 'Clasifica a cada candidato por ajuste real, no por palabras clave',
    subtitle:
      'Griffo Enterprise puntúa a cada candidato frente a tu vacante con el mismo motor de compatibilidad por IA de GriffoWork — para que tu equipo revise una lista ya clasificada, en vez de una carpeta de CVs.',
    points: [
      {
        title: 'Puntuación automática en cada postulación',
        body: 'Cada postulación se compara con la vacante en el momento en que llega — puntuación de 0 a 100, explicada en las mismas dimensiones profesional, de ajuste al puesto y contextual que GriffoWork ya usa con candidatos.',
      },
      {
        title: 'Una cascada, no un único grupo',
        body: 'Antes de mirar hacia afuera, Griffo Enterprise revisa primero tu propio equipo y los candidatos ya registrados — la búsqueda externa es la tercera fuente, no la primera, y cada sugerencia viene etiquetada con su origen.',
      },
      {
        title: 'Ningún formato de CV nuevo que aprender',
        body: 'Reutiliza la misma extracción de perfil que GriffoWork ya ejecuta para candidatos — un CV subido una vez puntúa contra cualquier vacante abierta.',
      },
    ],
    ctaLabel: 'Hablar con ventas',
  },
  internalMobility: {
    metaTitle: 'Software de Movilidad Interna con Emparejamiento por IA | Griffo Enterprise',
    metaDescription:
      'Detecta candidatos internos para nuevas vacantes automáticamente con Griffo Enterprise — movilidad interna con IA, sobre el mismo motor de GriffoWork.',
    keywords: [
      'software de movilidad interna',
      'mercado interno de talento',
      'software de transferencia interna de empleados',
      'movilidad interna con ia',
      'plataforma de movilidad de talento',
    ],
    eyebrow: 'Movilidad Interna',
    title: 'Encuentra tu próxima contratación primero dentro de casa',
    subtitle:
      'Griffo Enterprise revisa tu propio equipo en busca de ajuste antes de que publiques una vacante externa — usando el perfil profesional que el empleado ya mantiene en Griffo, con su consentimiento.',
    points: [
      {
        title: 'El empleado mantiene un solo perfil',
        body: 'Sin un segundo CV que completar: el perfil que el empleado ya tiene en GriffoWork es el que entra en el emparejamiento contra las nuevas vacantes internas.',
      },
      {
        title: 'Consentimiento delimitado por empresa',
        body: 'El perfil del empleado solo es visible para el emparejamiento interno después de que él lo autoriza para esa organización específica — separado de cualquier visibilidad pública como candidato.',
      },
      {
        title: 'El ajuste interno se muestra siempre primero',
        body: 'Cuando se abre una nueva vacante, el equipo interno es la primera fuente que el agente de emparejamiento revisa, antes que los candidatos registrados o el grupo general de Griffo.',
      },
    ],
    ctaLabel: 'Hablar con ventas',
  },
}
