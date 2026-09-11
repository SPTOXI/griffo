import type { PrivacyContent } from '../content-types'

export const es: PrivacyContent = {
  metaTitle: 'Política de Privacidad — GriffoWork',
  metaDescription:
    'Cómo GriffoWork recopila, usa, comparte y conserva tus datos — incluyendo qué proveedores de IA analizan tu currículum, cuánto tiempo los conservamos y cómo acceder, exportar o eliminar tus datos.',
  breadcrumbHome: 'Inicio',
  title: 'Política de Privacidad',
  lastUpdatedLabel: 'Última actualización',
  lastUpdatedValue: 'Septiembre de 2026',
  intro: [
    'GriffoWork ("nosotros") ofrece herramientas de inteligencia de carrera: análisis de currículum, puntuación de compatibilidad con ATS, reescritura de currículum y emparejamiento de vacantes (Radar). Esta página explica, en lenguaje claro, qué datos recopilamos para eso, quién más los ve, cuánto tiempo los conservamos y qué control tienes sobre ellos.',
    'GriffoWork es una marca operativa; todavía no hemos constituido una entidad legal propia para ella. Hasta que eso cambie, trata esta página como nuestro compromiso operativo, no como una declaración corporativa formal — la actualizaremos en cuanto eso cambie.',
  ],

  dataWeCollectHeading: 'Qué recopilamos',
  dataCategories: [
    {
      title: 'Datos de la cuenta',
      body: 'Correo electrónico y contraseña (guardada con hash, nunca en texto plano) al crear una cuenta.',
    },
    {
      title: 'Currículum e información profesional',
      body: 'El contenido del currículum que subes o pegas, el puesto/descripción de vacante objetivo que indicas, y los detalles de perfil profesional que completes (habilidades, experiencia, formación).',
    },
    {
      title: 'Enlaces de perfiles sociales (opcional)',
      body: 'LinkedIn, GitHub, portafolio u enlaces similares que decidas añadir, y solo cuando eliges que sean analizados.',
    },
    {
      title: 'Datos de pago',
      body: 'Nunca vemos ni guardamos el número completo de tu tarjeta. Los pagos son procesados por Stripe, nuestro procesador de pagos; guardamos solo el registro de la transacción necesario para recibos y soporte.',
    },
    {
      title: 'Datos de uso',
      body: 'Eventos básicos del producto (como vistas de página y pasos de compra) y un país aproximado derivado de tu conexión de red, usados para entender el uso del producto y mostrar la moneda correcta.',
    },
    {
      title: 'Preferencia de idioma',
      body: 'El idioma de la interfaz que eliges, guardado para que el sitio lo recuerde en tu próxima visita.',
    },
  ],

  howWeUseHeading: 'Para qué lo usamos',
  howWeUseItems: [
    'Analizar tu currículum y generar la auditoría, la puntuación y las sugerencias de reescritura que solicitas.',
    'Comparar tu perfil con vacantes abiertas para la función Radar, cuando la activas.',
    'Procesar pagos y brindar soporte de cuenta.',
    'Enviarte los correos que has solicitado (resultados del análisis, alertas de Radar) y, cuando corresponda, permitirte cancelar los no esenciales.',
    'Entender el uso agregado del producto para mejorar el servicio.',
    'Cumplir obligaciones legales y contables ligadas a los pagos.',
  ],

  sharingHeading: 'Con quién lo compartimos',
  sharingIntro:
    'No vendemos tus datos. Los compartimos solo con los proveedores de servicio ("encargados") necesarios para operar GriffoWork, cada uno actuando bajo nuestras instrucciones:',
  subProcessors: [
    {
      name: 'Proveedores de IA (Anthropic, OpenAI, Google, DeepSeek, Moonshot AI)',
      purpose:
        'El contenido de tu currículum se envía a uno de estos proveedores para generar el análisis, la puntuación o la reescritura que solicitas. El proveedor usado en una solicitud puede variar; consulta "Transferencias internacionales" abajo para ver cómo restringimos esto para usuarios en el Espacio Económico Europeo.',
    },
    {
      name: 'Stripe',
      purpose: 'Procesamiento de pagos. Stripe recibe tus datos de pago directamente; no guardamos el número de tu tarjeta.',
    },
    {
      name: 'Resend',
      purpose: 'Envío de correo transaccional (resultados del análisis, alertas de Radar, avisos de cuenta).',
    },
    {
      name: 'Vercel y Supabase',
      purpose: 'Alojamiento de la aplicación e infraestructura de base de datos.',
    },
  ],

  transfersHeading: 'Transferencias internacionales',
  transfersBody: [
    'Algunos de nuestros encargados operan fuera de tu país, incluso fuera del Espacio Económico Europeo (EEE). Para usuarios que identificamos en el EEE, Reino Unido o Suiza, excluimos del análisis de tu currículum a los proveedores de IA sin decisión de adecuación reconocida para esa región (actualmente DeepSeek y Moonshot AI/Kimi) — tu contenido solo se dirige a proveedores accesibles bajo salvaguardas compatibles con el GDPR.',
    'Para usuarios fuera del EEE, se pueden usar todos los proveedores de IA listados, según la carga y disponibilidad del sistema.',
  ],

  retentionHeading: 'Cuánto tiempo conservamos tus datos',
  retentionIntro:
    'Conservamos los datos solo mientras sirvan al propósito de la recopilación, o según lo exija la ley:',
  retentionRows: [
    { category: 'Currículums en cuenta activa', period: 'Mientras tu cuenta esté activa' },
    { category: 'Currículums en cuenta inactiva', period: 'Hasta 730 días después de tu última actividad, luego eliminados' },
    { category: 'Registros de procesamiento por IA (métricas operativas, ya sin el contenido del currículum)', period: 'Hasta 365 días' },
    { category: 'Registro de auditoría (registro de cumplimiento y seguridad)', period: 'Hasta 730 días' },
    { category: 'Registros de pago/webhook', period: 'Hasta 90 días' },
  ],

  rightsHeading: 'Tus derechos y opciones',
  rightsIntro:
    'Estés donde estés, ofrecemos estos controles directamente en tu cuenta (Configuración), sin necesidad de escribirnos primero:',
  rights: [
    {
      title: 'Exportar tus datos',
      body: 'Descarga una copia de tus currículums, historial de análisis, transacciones y actividad de la cuenta.',
    },
    {
      title: 'Eliminar tu cuenta',
      body: 'Elimina permanentemente tu cuenta y los datos personales asociados. Esta acción es irreversible.',
    },
    {
      title: 'Corregir tu información',
      body: 'Edita tu currículum, perfil y datos de cuenta en cualquier momento.',
    },
    {
      title: 'Cancelar correos no esenciales',
      body: 'Cancela alertas de Radar y otras notificaciones no esenciales desde tu cuenta o desde el enlace del propio correo.',
    },
  ],

  cookiesHeading: 'Cookies y almacenamiento local',
  cookiesBody: [
    'Usamos una cookie de sesión para mantenerte conectado, y una cookie de preferencia/entrada de almacenamiento local para recordar el idioma de interfaz elegido. No usamos rastreadores publicitarios de terceros.',
  ],

  securityHeading: 'Seguridad',
  securityBody: [
    'Usamos medidas estándar de la industria, como conexiones cifradas (HTTPS), contraseñas con hash y control de acceso en nuestra base de datos, para proteger tus datos. Ningún sistema es completamente inmune a riesgos, y no podemos garantizar seguridad absoluta — pero tratamos el contenido del currículum como dato personal sensible y diseñamos nuestros procesos para minimizar quién y qué puede acceder a él.',
  ],

  childrenHeading: 'Privacidad de menores',
  childrenBody:
    'GriffoWork está dirigido a profesionales y personas en búsqueda de empleo, y no está dirigido a menores de 16 años. No recopilamos intencionalmente datos de menores.',

  changesHeading: 'Cambios en esta política',
  changesBody:
    'Podemos actualizar esta página conforme cambien el producto o nuestros proveedores. Los cambios relevantes actualizarán la fecha en la parte superior de esta página.',

  contactHeading: 'Contáctanos',
  contactBody: 'Para cualquier duda sobre esta política o tus datos, escribe a {email}.',
}
