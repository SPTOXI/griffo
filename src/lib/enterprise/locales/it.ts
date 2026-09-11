import type { EnterpriseLocale } from '../content-types'

export const it: EnterpriseLocale = {
  breadcrumbHome: 'Home',
  landing: {
    metaTitle: 'Griffo Enterprise — Matching CV-Posizione con IA per Team di Recruiting',
    metaDescription:
      'Trova il candidato giusto — interno o esterno — con lo stesso motore di compatibilità IA di GriffoWork. Pensato per recruiter e team HR che decidono su assunzioni e mobilità interna.',
    keywords: [
      'griffo enterprise',
      'matching cv con ia per recruiter',
      'software di compatibilità candidato-posizione',
      'software per la mobilità interna',
      'ia per il recruiting esterno',
      'hr tech con ia',
    ],
    eyebrow: 'Griffo Enterprise',
    title: 'Trova il candidato giusto — interno o esterno',
    subtitle:
      "Griffo Enterprise usa lo stesso motore di compatibilità CV×posizione con IA di GriffoWork sulla base della tua azienda — controllando prima il team interno, poi i candidati registrati, prima di raggiungere il pool generale di Griffo. Ogni suggerimento mostra esattamente da dove arriva.",
    useCases: [
      {
        title: 'Recruiting esterno',
        body: 'Valuta automaticamente ogni candidato rispetto alla posizione, con classifica e spiegazione — non solo una corrispondenza per parole chiave.',
      },
      {
        title: 'Mobilità interna',
        body: 'Individua i dipendenti già adatti a una nuova posizione prima di guardare all’esterno — usando il profilo che già mantengono su Griffo.',
      },
    ],
    ctaLabel: 'Contatta le vendite',
    faqs: [
      {
        question: "Cos'è il matching CV-posizione con IA?",
        answer:
          "È lo stesso motore di compatibilità di GriffoWork, applicato al tuo processo di selezione: un modello di IA legge il profilo professionale di un candidato e una posizione aperta, poi valuta l'aderenza in base a esperienza professionale, requisiti specifici della posizione e contesto — invece di limitarsi a cercare una corrispondenza di parole chiave.",
      },
      {
        question: "Come si misura la compatibilità tra candidato e posizione?",
        answer:
          "Ogni corrispondenza viene scomposta secondo le stesse dimensioni che GriffoWork già usa con i candidati — percorso professionale, aderenza alla posizione specifica e adeguatezza contestuale — così il recruiter vede non solo il punteggio, ma anche il motivo di quel punteggio.",
      },
      {
        question: "Qual è qui la differenza tra recruiting esterno e mobilità interna?",
        answer:
          "Stesso motore di matching, ma fonte di candidati diversa. Il recruiting esterno valuta chi si candida a una posizione dall'esterno dell'azienda. La mobilità interna valuta i tuoi stessi dipendenti — con il loro consenso — rispetto alle nuove posizioni prima di guardare all'esterno.",
      },
      {
        question: "Griffo Enterprise sostituisce il nostro ATS attuale?",
        answer:
          "No — applica il livello di matching e valutazione sopra le candidature, sia che arrivino dalle tue posizioni pubblicate sia da un flusso già esistente. È pensato per convivere con il modo in cui già tracci i candidati, non per sostituire quel sistema.",
      },
      {
        question: "Come vengono trattati i dati del dipendente per la mobilità interna?",
        answer:
          "Il profilo di un dipendente viene usato per il matching interno solo dopo che ha dato consenso esplicito per quella specifica azienda — un consenso separato da qualsiasi visibilità pubblica come candidato, e limitato a un'organizzazione alla volta.",
      },
    ],
  },
  externalRecruitment: {
    metaTitle: 'Matching di Candidati con IA per il Recruiting Esterno | Griffo Enterprise',
    metaDescription:
      "Valuta e classifica automaticamente ogni candidatura con il motore di matching CV-posizione con IA di Griffo Enterprise — pensato per team che assumono dall'esterno.",
    keywords: [
      'ia per il recruiting esterno',
      'software di classifica dei candidati',
      'gestione candidature con ia',
      'screening del cv con ia',
      'software di matching posizioni per recruiter',
    ],
    eyebrow: 'Recruiting Esterno',
    title: 'Classifica ogni candidato per reale aderenza, non per parole chiave',
    subtitle:
      "Griffo Enterprise valuta ogni candidato rispetto alla tua posizione aperta con lo stesso motore di compatibilità con IA di GriffoWork — il tuo team esamina una lista già classificata, invece di una cartella di CV.",
    points: [
      {
        title: 'Valutazione automatica a ogni candidatura',
        body: "Ogni candidatura viene confrontata con la posizione non appena arriva — punteggio da 0 a 100, spiegato secondo le stesse dimensioni professionale, di aderenza alla posizione e contestuale già usate da GriffoWork per i candidati.",
      },
      {
        title: 'Una cascata, non un unico pool',
        body: "Prima di guardare all'esterno, Griffo Enterprise controlla prima il tuo team e i candidati già registrati — la ricerca esterna è la terza fonte, non la prima, e ogni suggerimento è etichettato con la sua origine.",
      },
      {
        title: 'Nessun nuovo formato di CV da imparare',
        body: "Riutilizza la stessa estrazione del profilo che GriffoWork già esegue per i candidati — un CV caricato una volta viene valutato rispetto a ogni posizione aperta.",
      },
    ],
    ctaLabel: 'Contatta le vendite',
  },
  internalMobility: {
    metaTitle: 'Software di Mobilità Interna con Matching IA | Griffo Enterprise',
    metaDescription:
      'Individua automaticamente candidati interni per nuove posizioni con Griffo Enterprise — mobilità interna basata su IA, sullo stesso motore di GriffoWork.',
    keywords: [
      'software per la mobilità interna',
      'marketplace interno dei talenti',
      'software per il trasferimento interno dei dipendenti',
      'mobilità interna con ia',
      'piattaforma di mobilità dei talenti',
    ],
    eyebrow: 'Mobilità Interna',
    title: 'Trova prima la tua prossima assunzione in casa',
    subtitle:
      "Griffo Enterprise analizza il tuo team alla ricerca di un'aderenza prima che tu pubblichi una posizione esterna — usando il profilo professionale che il dipendente già mantiene su Griffo, con il suo consenso.",
    points: [
      {
        title: 'Il dipendente mantiene un unico profilo',
        body: "Nessun secondo CV da compilare: il profilo GriffoWork già esistente del dipendente è quello usato per il matching con le nuove posizioni interne.",
      },
      {
        title: 'Consenso delimitato per azienda',
        body: "Il profilo di un dipendente è visibile per il matching interno solo dopo il suo consenso esplicito per quella specifica organizzazione — separato da qualsiasi visibilità pubblica come candidato.",
      },
      {
        title: "L'aderenza interna viene sempre mostrata per prima",
        body: "Quando si apre una nuova posizione, il team interno è la prima fonte controllata dall'agente di matching, prima dei candidati registrati o del pool generale di Griffo.",
      },
    ],
    ctaLabel: 'Contatta le vendite',
  },
}
