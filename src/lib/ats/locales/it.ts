import type { AtsLocale } from '../content-types'

/** Guias de ATS em italiano: os 5 globais mais o InfoJobs (que opera na Itália). */
export const atsIt: AtsLocale = {
  workday: {
    marketName: 'Stati Uniti, Europa e multinazionali',
    description:
      "Workday è lo standard aziendale nella maggior parte delle società Fortune 500 e nelle grandi multinazionali. È noto per avere uno dei parser più rigorosi e standardizzati del mercato HR.",
    marketShare: 'Utilizzato da oltre il 50% delle aziende Fortune 500.',
    howItWorks: [
      {
        title: 'Mappatura strutturata dei campi',
        description:
          'Workday scompone il CV in campi predefiniti: azienda, ruolo, periodo e responsabilità. Qualsiasi disallineamento di formato causa perdita di dati durante la selezione.',
      },
      {
        title: 'Selezione secondo normative internazionali',
        description:
          'Filtra le candidature in base alle normative del lavoro internazionali, richiedendo chiarezza nel percorso di carriera e nella seniority.',
      },
      {
        title: 'Verifica di metriche e requisiti',
        description:
          "Il sistema privilegia i profili che dimostrano un impatto misurabile e coerente con le competenze richieste nell'annuncio.",
      },
    ],
    eliminationFactors: [
      'Formati e layout non convenzionali che compromettono la compilazione automatica dei campi.',
      "Date e periodi incoerenti che impediscono il calcolo degli anni di esperienza.",
      'Titoli di ruolo privi di corrispondenza chiara con gli standard internazionali.',
    ],
    howGriffoWorkHelps: [
      'Garantisce che il parser di Workday legga senza errori la gerarchia del tuo CV.',
      'Verifica la coerenza con gli standard internazionali di selezione (USA, Europa e globale).',
      'Analizza la densità di metriche e risultati rispetto ai filtri aziendali del sistema.',
      "Genera una lettera di presentazione mirata sulla posizione.",
    ],
    faqs: [
      {
        question: 'Perché Workday è così selettivo?',
        answer:
          'Poiché le multinazionali ricevono migliaia di candidature per posizione, Workday applica criteri strutturati e scarta i CV con formattazione confusa o informazioni non classificabili.',
      },
      {
        question: 'Come prepara GriffoWork il mio profilo per Workday?',
        answer:
          'GriffoWork verifica chiarezza cronologica, formattazione e presenza di metriche, così che Workday estragga il tuo percorso senza errori.',
      },
    ],
  },
  greenhouse: {
    marketName: 'Tech globale, startup e scaleup',
    description:
      "Greenhouse è la piattaforma di selezione più utilizzata nell'ecosistema tecnologico globale, tra startup in forte crescita e unicorni, con un approccio basato su competenze ed evidenze concrete.",
    marketShare: 'Leader tra le aziende tecnologiche e innovative in USA, Europa e America Latina.',
    howItWorks: [
      {
        title: 'Scorecard delle competenze',
        description:
          'Valuta il candidato rispetto a scorecard specifiche su competenze tecniche, strumenti e leadership.',
      },
      {
        title: 'Integrazione con portfolio e profili',
        description:
          "Collega i dati del CV ai link professionali (LinkedIn, GitHub, portfolio) per la valutazione del team tecnico.",
      },
    ],
    eliminationFactors: [
      'CV generici che non dimostrano una padronanza concreta di strumenti e framework.',
      'Assenza di risultati concreti nelle esperienze precedenti.',
      "Nessun collegamento chiaro tra i progetti e l'impatto sul business.",
    ],
    howGriffoWorkHelps: [
      'Misura la corrispondenza tra le tue competenze tecniche e quelle richieste dalla posizione.',
      'Verifica la coerenza tra i tuoi profili professionali e il CV.',
      "Assegna un punteggio a impatto e chiarezza secondo i criteri delle scorecard dei recruiter.",
    ],
    faqs: [
      {
        question: 'Perché Greenhouse è così diffuso nel settore tech?',
        answer:
          'Perché consente ai team di engineering e prodotto di valutare le competenze in modo strutturato e collaborativo, riducendo i bias nella prima scrematura.',
      },
      {
        question: 'GriffoWork copre anche le posizioni remote internazionali su Greenhouse?',
        answer: "Sì. GriffoWork adatta l'analisi ai processi globali e ai requisiti internazionali.",
      },
    ],
  },
  lever: {
    marketName: 'Scaleup e Big Tech',
    description:
      "Lever unisce la gestione delle candidature (ATS) alla gestione della relazione con i talenti (CRM), permettendo ai team di selezione di individuare e qualificare candidati in modo continuo dal proprio database.",
    marketShare: 'Ampiamente adottato da aziende tecnologiche di medie e grandi dimensioni.',
    howItWorks: [
      {
        title: 'Indicizzazione continua dei talenti',
        description:
          "Archivia e indicizza l'intero percorso del candidato per incrociarlo con le posizioni attuali e future.",
      },
      {
        title: 'Ricerca semantica per competenze',
        description:
          'I recruiter filtrano i candidati con ricerche semantiche dettagliate per strumenti, ruoli e formazione.',
      },
    ],
    eliminationFactors: [
      'Mancanza di termini tecnici: il sistema non fa mai emergere il profilo nelle ricerche tematiche.',
      'Descrizioni vaghe che non rendono la reale profondità delle competenze.',
    ],
    howGriffoWorkHelps: [
      'Assicura la presenza delle parole chiave strategiche perché il tuo CV emerga nelle ricerche su Lever.',
      'Affina il posizionamento affinché il profilo resti efficace nel tempo nel database talenti.',
    ],
    faqs: [
      {
        question: 'Come funziona il database talenti di Lever?',
        answer:
          'Lever mantiene i profili archiviati e ricercabili. Un CV con alta densità di termini rilevanti continua a emergere per nuove opportunità.',
      },
    ],
  },
  taleo: {
    marketName: 'Banche, pubblica amministrazione e grandi aziende',
    description:
      "Oracle Taleo è uno dei sistemi di selezione aziendale più consolidati al mondo, molto usato nel settore finanziario, oil & gas, telecomunicazioni ed enti pubblici.",
    marketShare: 'Forte presenza in aziende tradizionali e istituzioni finanziarie globali.',
    howItWorks: [
      {
        title: 'Filtri di selezione tradizionali',
        description:
          "Applica regole strutturate basate su titoli formali, anzianità e livelli di istruzione.",
      },
    ],
    eliminationFactors: [
      'Titoli di sezione non convenzionali che il parser legacy non riesce a classificare.',
      "Elementi grafici che rompono la gerarchia delle informazioni.",
    ],
    howGriffoWorkHelps: [
      'Verifica la struttura formale del CV per la compatibilità con il parser di Taleo.',
      'Controlla il formato di date, ruoli e sezioni atteso dalle grandi aziende tradizionali.',
    ],
    faqs: [
      {
        question: 'Oracle Taleo è ancora molto utilizzato?',
        answer:
          'Sì, soprattutto in grandi banche, gruppi industriali e aziende che gestiscono migliaia di dipendenti nel mondo.',
      },
    ],
  },
  ashby: {
    marketName: 'Startup globali e scaleup di IA',
    description:
      "Ashby è una piattaforma di selezione moderna in rapida crescita tra aziende tecnologiche e di intelligenza artificiale, costruita su automazione intelligente e analytics.",
    marketShare: 'In rapida crescita tra le scaleup tecnologiche e di IA.',
    howItWorks: [
      {
        title: 'Screening rapido e sintesi con IA',
        description:
          "Genera sintesi analitiche perché i recruiter valutino rapidamente impatto e seniority del candidato.",
      },
    ],
    eliminationFactors: [
      'CV lunghi e poco focalizzati, in cui i principali risultati tecnici passano inosservati.',
    ],
    howGriffoWorkHelps: [
      'Verifica che la sintesi del tuo CV sia rapida da leggere e ad alto impatto.',
      'Mette in evidenza progetti complessi e leadership tecnica per i filtri di Ashby.',
    ],
    faqs: [
      {
        question: 'Cosa distingue Ashby dagli altri sistemi?',
        answer:
          'Ashby offre dashboard analitiche e sintesi automatiche che premiano i CV concisi e orientati ai risultati.',
      },
    ],
  },
  infojobs: {
    marketName: 'Spagna, Brasile e Italia',
    description:
      'InfoJobs è uno dei portali per il lavoro e la selezione dei curriculum più tradizionali di Spagna, Italia e Brasile, utilizzato da migliaia di recruiter in tutti i settori.',
    marketShare: 'Riferimento storico per candidature e annunci aziendali in Spagna.',
    howItWorks: [
      {
        title: 'Filtri diretti del recruiter',
        description:
          'Permette di filtrare i candidati per località, fascia retributiva, formazione ed esperienza recente.',
      },
    ],
    eliminationFactors: [
      'Poca chiarezza nei recapiti, nella località e nelle aspettative retributive.',
    ],
    howGriffoWorkHelps: [
      'Verifica che tutte le sezioni obbligatorie per i processi su InfoJobs siano complete.',
      'Controlla che competenze e percorso siano coerenti con il mercato spagnolo e italiano.',
    ],
    faqs: [
      {
        question: 'Come funziona la ricerca dei candidati su InfoJobs?',
        answer:
          'I recruiter filtrano per parole chiave e località prima di aprire i singoli curriculum.',
      },
    ],
  },
}
