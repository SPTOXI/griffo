import type { PrivacyContent } from '../content-types'

export const it: PrivacyContent = {
  metaTitle: 'Informativa sulla privacy — GriffoWork',
  metaDescription:
    'Come GriffoWork raccoglie, utilizza, condivide e conserva i tuoi dati — inclusi quali fornitori di IA analizzano il tuo curriculum, per quanto tempo li conserviamo e come accedervi, esportarli o eliminarli.',
  breadcrumbHome: 'Home',
  title: 'Informativa sulla privacy',
  lastUpdatedLabel: 'Ultimo aggiornamento',
  lastUpdatedValue: 'Settembre 2026',
  intro: [
    'GriffoWork ("noi") offre strumenti di intelligenza di carriera: analisi del curriculum, punteggio di compatibilità ATS, riscrittura del curriculum e abbinamento con offerte di lavoro (Radar). Questa pagina spiega, in linguaggio semplice, quali dati raccogliamo per farlo, chi altro li vede, per quanto tempo li conserviamo e quale controllo hai su di essi.',
    'GriffoWork è un marchio operativo; non abbiamo ancora costituito una persona giuridica dedicata per esso. Fino a quando ciò non cambierà, considera questa pagina come il nostro impegno operativo e non come una dichiarazione societaria formale — la aggiorneremo non appena ciò cambierà.',
  ],

  dataWeCollectHeading: 'Cosa raccogliamo',
  dataCategories: [
    {
      title: 'Informazioni dell\'account',
      body: 'Indirizzo e-mail e password (salvata con hash, mai in chiaro) alla creazione di un account.',
    },
    {
      title: 'Curriculum e informazioni professionali',
      body: 'Il contenuto del curriculum che carichi o incolli, la posizione/descrizione dell\'offerta target che indichi, e i dettagli del profilo professionale che compili (competenze, esperienza, formazione).',
    },
    {
      title: 'Link a profili social (opzionale)',
      body: 'LinkedIn, GitHub, portfolio o link simili che scegli di aggiungere, e solo quando accetti che vengano analizzati.',
    },
    {
      title: 'Dati di pagamento',
      body: 'Non vediamo né conserviamo mai il numero completo della tua carta. I pagamenti sono elaborati da Stripe, il nostro fornitore di servizi di pagamento; conserviamo solo il record della transazione necessario per ricevute e assistenza.',
    },
    {
      title: 'Dati di utilizzo',
      body: 'Eventi di base del prodotto (come visualizzazioni di pagina e fasi di checkout) e un paese approssimativo dedotto dalla tua connessione di rete, usati per capire l\'utilizzo del prodotto e mostrare la valuta corretta.',
    },
    {
      title: 'Preferenza di lingua',
      body: 'La lingua dell\'interfaccia che scegli, salvata affinché il sito la ricordi alla tua prossima visita.',
    },
    {
      title: "Curriculum inviato senza account (pagina iniziale)",
      body: "Se invii il curriculum tramite il modulo della pagina iniziale senza creare un account, riceviamo il file (o il testo incollato) e la tua email. Usiamo il curriculum per individuare il tuo ruolo, il tuo settore e le tue competenze e confrontarli con le offerte aperte, e l’email per inviarti il link al risultato. Al momento dell’invio scegli: cancellare tutto entro 24 ore, oppure conservare il curriculum perché le aziende possano trovarti. Per conservarlo devi selezionare questa opzione; l’impostazione predefinita è la cancellazione.",
    },
  ],

  howWeUseHeading: 'A cosa li usiamo',
  howWeUseItems: [
    'Analizzare il tuo curriculum e generare la verifica, il punteggio e i suggerimenti di riscrittura che richiedi.',
    'Confrontare il tuo profilo con le posizioni aperte per la funzione Radar, quando la attivi.',
    'Elaborare i pagamenti e fornire assistenza sull\'account.',
    'Inviarti le e-mail che hai richiesto (risultati dell\'analisi, avvisi Radar) e, ove applicabile, permetterti di annullare l\'iscrizione a quelle non essenziali.',
    'Comprendere l\'utilizzo aggregato del prodotto per migliorare il servizio.',
    'Adempiere agli obblighi legali e contabili legati ai pagamenti.',
  ],

  sharingHeading: 'Con chi li condividiamo',
  sharingIntro:
    'Non vendiamo i tuoi dati. Li condividiamo solo con i fornitori di servizi ("responsabili del trattamento") necessari al funzionamento di GriffoWork, ciascuno operante secondo le nostre istruzioni:',
  subProcessors: [
    {
      name: 'Fornitori di IA (Anthropic, OpenAI, Google, DeepSeek, Moonshot AI)',
      purpose:
        'Il contenuto del tuo curriculum viene inviato a uno di questi fornitori per generare l\'analisi, il punteggio o la riscrittura che richiedi. Il fornitore usato per una determinata richiesta può variare; vedi "Trasferimenti internazionali" più sotto per la restrizione applicata agli utenti nello Spazio Economico Europeo.',
    },
    {
      name: 'Stripe',
      purpose: 'Elaborazione dei pagamenti. Stripe riceve direttamente i tuoi dati di pagamento; non conserviamo il numero della tua carta.',
    },
    {
      name: 'Resend',
      purpose: 'Invio di e-mail transazionali (risultati dell\'analisi, avvisi Radar, comunicazioni sull\'account).',
    },
    {
      name: 'Vercel e Supabase',
      purpose: 'Hosting dell\'applicazione e infrastruttura del database.',
    },
  ],

  transfersHeading: 'Trasferimenti internazionali',
  transfersBody: [
    'Alcuni dei nostri responsabili del trattamento operano fuori dal tuo paese, anche fuori dallo Spazio Economico Europeo (SEE). Per gli utenti che identifichiamo come situati nel SEE, nel Regno Unito o in Svizzera, escludiamo dall\'analisi del tuo curriculum i fornitori di IA privi di una decisione di adeguatezza riconosciuta per quella regione (attualmente DeepSeek e Moonshot AI/Kimi) — il tuo contenuto viene indirizzato solo a fornitori raggiungibili tramite garanzie compatibili con il GDPR.',
    'Per gli utenti fuori dal SEE, tutti i fornitori di IA elencati possono essere utilizzati a seconda del carico e della disponibilità del sistema.',
  ],

  retentionHeading: 'Per quanto tempo conserviamo i tuoi dati',
  retentionIntro:
    'Conserviamo i dati solo per il tempo necessario alla finalità della raccolta, o per il periodo richiesto dalla legge:',
  retentionRows: [
    { category: 'Curriculum su account attivo', period: 'Finché il tuo account è attivo' },
    { category: 'Curriculum su account inattivo', period: 'Fino a 730 giorni dopo la tua ultima attività, poi eliminati' },
    { category: 'Log di elaborazione IA (metriche operative, già prive del contenuto del curriculum)', period: 'Fino a 365 giorni' },
    { category: 'Registro di audit (registro di conformità e sicurezza)', period: 'Fino a 730 giorni' },
    { category: 'Registri di pagamento/webhook', period: 'Fino a 90 giorni' },
    { category: 'Cronologia delle offerte del Radar (posizioni che il Radar ti ha mostrato)', period: 'Fino a 730 giorni' },
    { category: "Curriculum inviato senza account, con l’opzione «cancellare entro 24 ore»", period: "Fino a 24 ore. Il testo del curriculum non viene conservato; solo il risultato e l’email, cancellati nello stesso termine" },
    { category: "Curriculum inviato senza account, con l’opzione «conservare per le aziende»", period: "Fino a 730 giorni, o finché non ne chiedi la cancellazione" },
  ],

  rightsHeading: 'I tuoi diritti e le tue scelte',
  rightsIntro:
    'Ovunque tu sia, offriamo questi controlli direttamente nel tuo account (Impostazioni), senza bisogno di scriverci prima:',
  rights: [
    {
      title: 'Esportare i tuoi dati',
      body: 'Scarica una copia dei tuoi curriculum, della cronologia delle analisi, delle transazioni e dell\'attività dell\'account.',
    },
    {
      title: 'Eliminare il tuo account',
      body: 'Elimina definitivamente il tuo account e i dati personali associati. Questa azione è irreversibile.',
    },
    {
      title: 'Correggere le tue informazioni',
      body: 'Modifica il tuo curriculum, il profilo e i dati dell\'account in qualsiasi momento.',
    },
    {
      title: 'Annullare l\'iscrizione a e-mail non essenziali',
      body: 'Annulla l\'iscrizione agli avvisi Radar e ad altre notifiche non essenziali dal tuo account o dal link presente nell\'e-mail stessa.',
    },
  ],

  cookiesHeading: 'Cookie e archiviazione locale',
  cookiesBody: [
    'Usiamo un cookie di sessione per mantenerti connesso e un cookie di preferenza/voce di archiviazione locale per ricordare la lingua dell\'interfaccia scelta. Non usiamo tracker pubblicitari di terze parti.',
  ],

  securityHeading: 'Sicurezza',
  securityBody: [
    'Usiamo misure standard del settore, come connessioni cifrate (HTTPS), password con hash e controlli di accesso sul nostro database, per proteggere i tuoi dati. Nessun sistema è completamente immune dai rischi, e non possiamo garantire una sicurezza assoluta — ma trattiamo il contenuto del curriculum come dato personale sensibile e progettiamo i nostri processi per minimizzare chi e cosa può accedervi.',
  ],

  childrenHeading: 'Privacy dei minori',
  childrenBody:
    'GriffoWork è rivolto a professionisti e persone in cerca di lavoro, e non è rivolto a persone di età inferiore ai 16 anni. Non raccogliamo consapevolmente dati di minori.',

  changesHeading: 'Modifiche a questa informativa',
  changesBody:
    'Potremmo aggiornare questa pagina man mano che il prodotto o i nostri fornitori cambiano. Le modifiche rilevanti aggiorneranno la data in cima a questa pagina.',

  contactHeading: 'Contattaci',
  contactBody: 'Per qualsiasi domanda su questa informativa o sui tuoi dati, scrivi a {email}.',
}
