import type { Language } from '../i18n/types'

/**
 * Textos da sequência de e-mails para quem enviou o currículo pela página
 * inicial e pediu vagas e dicas por e-mail (`VisitorLead.marketingOptIn`).
 *
 * Fora de `copy.ts` de propósito: aquele arquivo vai para o navegador (a tela
 * da landing), e estes textos só servem ao servidor.
 *
 * Marcadores: {n}, {title}.
 */
export interface NurtureCopy {
  /** Dia 1: o problema principal do currículo. */
  tipSubject: string
  tipIntro: string
  tipMore: string
  tipMoreOne: string
  tipCta: string
  /** Dia 3: vagas novas, ou as que continuam abertas. */
  jobsSubjectNew: string
  jobsSubjectNewOne: string
  jobsBodyNew: string
  jobsSubjectOpen: string
  jobsBodyOpen: string
  jobsCta: string
  /** Dia 7: último lembrete. */
  lastSubject: string
  lastBody: string
  lastCta: string
  /** Rodapé de todos, com o link de descadastro. */
  footer: string
  unsubscribe: string
  /** Pergunta da página de confirmação (o GET não descadastra, ver a rota). */
  unsubscribeConfirm: string
  /** Página que confirma o descadastro. */
  unsubscribedTitle: string
  unsubscribedText: string
}

const pt: NurtureCopy = {
  tipSubject: 'Como corrigir o principal problema do seu currículo',
  tipIntro: 'O ponto que mais tira visibilidade do seu currículo nos sistemas de triagem:',
  tipMore: 'Encontramos mais {n} pontos que reduzem suas chances. O diagnóstico completo mostra cada um e como corrigir.',
  tipMoreOne: 'Encontramos mais 1 ponto que reduz suas chances. O diagnóstico completo mostra qual é e como corrigir.',
  tipCta: 'Ver o diagnóstico completo',
  jobsSubjectNew: '{n} vagas novas combinam com o seu perfil',
  jobsSubjectNewOne: '1 vaga nova combina com o seu perfil',
  jobsBodyNew: 'Desde que você enviou o currículo, entraram vagas novas que combinam com o seu perfil. Veja quais são antes que fechem.',
  jobsSubjectOpen: 'Suas vagas continuam abertas',
  jobsBodyOpen: '{n} vagas que combinam com o seu perfil continuam abertas. Candidate-se com o currículo ajustado para elas.',
  jobsCta: 'Ver minhas vagas',
  lastSubject: 'Seu resultado sai do ar em 3 dias',
  lastBody: 'Seu resultado e as vagas que combinam com você ficam disponíveis por mais 3 dias. Crie sua conta grátis para guardar tudo e ver as notas do seu currículo em 8 dimensões.',
  lastCta: 'Criar minha conta grátis',
  footer: 'Você recebe este e-mail porque pediu vagas e dicas ao enviar seu currículo na GriffoWork. São no máximo 3 e-mails.',
  unsubscribe: 'Cancelar estes e-mails',
  unsubscribeConfirm: 'Quer parar de receber estes e-mails da GriffoWork?',
  unsubscribedTitle: 'Pronto, você não vai mais receber estes e-mails.',
  unsubscribedText: 'Também apagamos os dados que guardamos para enviá-los.',
}

const en: NurtureCopy = {
  tipSubject: 'How to fix the biggest problem in your resume',
  tipIntro: 'The issue costing your resume the most visibility in screening systems:',
  tipMore: 'We found {n} more issues that lower your chances. The full diagnosis shows each one and how to fix it.',
  tipMoreOne: 'We found 1 more issue that lowers your chances. The full diagnosis shows which one and how to fix it.',
  tipCta: 'See the full diagnosis',
  jobsSubjectNew: '{n} new jobs match your profile',
  jobsSubjectNewOne: '1 new job matches your profile',
  jobsBodyNew: 'Since you sent your resume, new jobs that match your profile have come in. See them before they close.',
  jobsSubjectOpen: 'Your jobs are still open',
  jobsBodyOpen: '{n} jobs that match your profile are still open. Apply with a resume tuned for them.',
  jobsCta: 'See my jobs',
  lastSubject: 'Your results go offline in 3 days',
  lastBody: 'Your results and the jobs that match you stay available for 3 more days. Create your free account to keep everything and see your resume scored across 8 dimensions.',
  lastCta: 'Create my free account',
  footer: 'You’re getting this email because you asked for jobs and tips when you sent your resume to GriffoWork. It’s 3 emails at most.',
  unsubscribe: 'Unsubscribe from these emails',
  unsubscribeConfirm: 'Do you want to stop getting these GriffoWork emails?',
  unsubscribedTitle: 'Done — you won’t get these emails anymore.',
  unsubscribedText: 'We also deleted the data we kept to send them.',
}

const es: NurtureCopy = {
  tipSubject: 'Cómo corregir el principal problema de tu currículum',
  tipIntro: 'Lo que más visibilidad le quita a tu currículum en los sistemas de selección:',
  tipMore: 'Encontramos {n} puntos más que reducen tus posibilidades. El diagnóstico completo muestra cada uno y cómo corregirlo.',
  tipMoreOne: 'Encontramos 1 punto más que reduce tus posibilidades. El diagnóstico completo muestra cuál es y cómo corregirlo.',
  tipCta: 'Ver el diagnóstico completo',
  jobsSubjectNew: '{n} ofertas nuevas encajan con tu perfil',
  jobsSubjectNewOne: '1 oferta nueva encaja con tu perfil',
  jobsBodyNew: 'Desde que enviaste tu currículum han llegado ofertas nuevas que encajan con tu perfil. Míralas antes de que cierren.',
  jobsSubjectOpen: 'Tus ofertas siguen abiertas',
  jobsBodyOpen: '{n} ofertas que encajan con tu perfil siguen abiertas. Postúlate con el currículum ajustado para ellas.',
  jobsCta: 'Ver mis ofertas',
  lastSubject: 'Tu resultado deja de estar disponible en 3 días',
  lastBody: 'Tu resultado y las ofertas que encajan contigo siguen disponibles 3 días más. Crea tu cuenta gratis para guardarlo todo y ver la nota de tu currículum en 8 dimensiones.',
  lastCta: 'Crear mi cuenta gratis',
  footer: 'Recibes este correo porque pediste ofertas y consejos al enviar tu currículum a GriffoWork. Son 3 correos como máximo.',
  unsubscribe: 'Darme de baja de estos correos',
  unsubscribeConfirm: '¿Quieres dejar de recibir estos correos de GriffoWork?',
  unsubscribedTitle: 'Listo, ya no recibirás estos correos.',
  unsubscribedText: 'También borramos los datos que guardábamos para enviarlos.',
}

const de: NurtureCopy = {
  tipSubject: 'So beheben Sie das größte Problem in Ihrem Lebenslauf',
  tipIntro: 'Das kostet Ihren Lebenslauf in Bewerbermanagementsystemen am meisten Sichtbarkeit:',
  tipMore: 'Wir haben {n} weitere Punkte gefunden, die Ihre Chancen senken. Die vollständige Diagnose zeigt jeden einzelnen und wie Sie ihn beheben.',
  tipMoreOne: 'Wir haben 1 weiteren Punkt gefunden, der Ihre Chancen senkt. Die vollständige Diagnose zeigt, welcher es ist und wie Sie ihn beheben.',
  tipCta: 'Vollständige Diagnose ansehen',
  jobsSubjectNew: '{n} neue Stellen passen zu Ihrem Profil',
  jobsSubjectNewOne: '1 neue Stelle passt zu Ihrem Profil',
  jobsBodyNew: 'Seit Sie Ihren Lebenslauf gesendet haben, sind neue passende Stellen hinzugekommen. Sehen Sie sie sich an, bevor sie vergeben sind.',
  jobsSubjectOpen: 'Ihre Stellen sind noch offen',
  jobsBodyOpen: '{n} Stellen, die zu Ihrem Profil passen, sind noch offen. Bewerben Sie sich mit einem darauf abgestimmten Lebenslauf.',
  jobsCta: 'Meine Stellen ansehen',
  lastSubject: 'Ihr Ergebnis ist nur noch 3 Tage verfügbar',
  lastBody: 'Ihr Ergebnis und die passenden Stellen sind noch 3 Tage verfügbar. Erstellen Sie ein kostenloses Konto, um alles zu behalten und die Bewertung Ihres Lebenslaufs in 8 Dimensionen zu sehen.',
  lastCta: 'Kostenloses Konto erstellen',
  footer: 'Sie erhalten diese E-Mail, weil Sie beim Senden Ihres Lebenslaufs an GriffoWork Stellen und Tipps angefordert haben. Es sind höchstens 3 E-Mails.',
  unsubscribe: 'Von diesen E-Mails abmelden',
  unsubscribeConfirm: 'Möchten Sie diese E-Mails von GriffoWork nicht mehr erhalten?',
  unsubscribedTitle: 'Erledigt – Sie erhalten diese E-Mails nicht mehr.',
  unsubscribedText: 'Die dafür gespeicherten Daten haben wir ebenfalls gelöscht.',
}

const fr: NurtureCopy = {
  tipSubject: 'Comment corriger le principal problème de votre CV',
  tipIntro: 'Ce qui fait perdre le plus de visibilité à votre CV dans les logiciels de recrutement :',
  tipMore: 'Nous avons trouvé {n} autres points qui réduisent vos chances. Le diagnostic complet montre chacun d’eux et comment le corriger.',
  tipMoreOne: 'Nous avons trouvé 1 autre point qui réduit vos chances. Le diagnostic complet montre lequel et comment le corriger.',
  tipCta: 'Voir le diagnostic complet',
  jobsSubjectNew: '{n} nouvelles offres correspondent à votre profil',
  jobsSubjectNewOne: '1 nouvelle offre correspond à votre profil',
  jobsBodyNew: 'Depuis l’envoi de votre CV, de nouvelles offres correspondant à votre profil sont arrivées. Découvrez-les avant qu’elles ne ferment.',
  jobsSubjectOpen: 'Vos offres sont toujours ouvertes',
  jobsBodyOpen: '{n} offres correspondant à votre profil sont toujours ouvertes. Postulez avec un CV adapté.',
  jobsCta: 'Voir mes offres',
  lastSubject: 'Votre résultat ne sera plus disponible dans 3 jours',
  lastBody: 'Votre résultat et les offres qui vous correspondent restent disponibles encore 3 jours. Créez votre compte gratuit pour tout conserver et voir la note de votre CV sur 8 dimensions.',
  lastCta: 'Créer mon compte gratuit',
  footer: 'Vous recevez cet e-mail car vous avez demandé des offres et des conseils en envoyant votre CV à GriffoWork. 3 e-mails au maximum.',
  unsubscribe: 'Me désinscrire de ces e-mails',
  unsubscribeConfirm: 'Voulez-vous ne plus recevoir ces e-mails de GriffoWork ?',
  unsubscribedTitle: 'C’est fait : vous ne recevrez plus ces e-mails.',
  unsubscribedText: 'Nous avons aussi supprimé les données conservées pour les envoyer.',
}

const it: NurtureCopy = {
  tipSubject: 'Come correggere il problema principale del tuo CV',
  tipIntro: 'Il punto che toglie più visibilità al tuo CV nei sistemi di selezione:',
  tipMore: 'Abbiamo trovato altri {n} punti che riducono le tue possibilità. La diagnosi completa li mostra uno per uno, con la soluzione.',
  tipMoreOne: 'Abbiamo trovato 1 altro punto che riduce le tue possibilità. La diagnosi completa mostra qual è e come correggerlo.',
  tipCta: 'Vedi la diagnosi completa',
  jobsSubjectNew: '{n} nuove offerte adatte al tuo profilo',
  jobsSubjectNewOne: '1 nuova offerta adatta al tuo profilo',
  jobsBodyNew: 'Da quando hai inviato il CV sono arrivate nuove offerte adatte al tuo profilo. Guardale prima che chiudano.',
  jobsSubjectOpen: 'Le tue offerte sono ancora aperte',
  jobsBodyOpen: '{n} offerte adatte al tuo profilo sono ancora aperte. Candidati con un CV su misura.',
  jobsCta: 'Vedi le mie offerte',
  lastSubject: 'Il tuo risultato resta disponibile ancora 3 giorni',
  lastBody: 'Il tuo risultato e le offerte adatte a te restano disponibili per altri 3 giorni. Crea il tuo account gratuito per conservare tutto e vedere il punteggio del tuo CV in 8 dimensioni.',
  lastCta: 'Crea il mio account gratuito',
  footer: 'Ricevi questa email perché hai chiesto offerte e consigli inviando il tuo CV a GriffoWork. Al massimo 3 email.',
  unsubscribe: 'Annulla l’iscrizione a queste email',
  unsubscribeConfirm: 'Vuoi smettere di ricevere queste email di GriffoWork?',
  unsubscribedTitle: 'Fatto, non riceverai più queste email.',
  unsubscribedText: 'Abbiamo anche cancellato i dati conservati per inviarle.',
}

const nl: NurtureCopy = {
  tipSubject: 'Zo los je het grootste probleem in je cv op',
  tipIntro: 'Dit kost je cv de meeste zichtbaarheid in selectiesystemen:',
  tipMore: 'We vonden nog {n} punten die je kansen verkleinen. De volledige diagnose toont elk punt en hoe je het oplost.',
  tipMoreOne: 'We vonden nog 1 punt dat je kansen verkleint. De volledige diagnose toont welk punt het is en hoe je het oplost.',
  tipCta: 'Volledige diagnose bekijken',
  jobsSubjectNew: '{n} nieuwe vacatures passen bij je profiel',
  jobsSubjectNewOne: '1 nieuwe vacature past bij je profiel',
  jobsBodyNew: 'Sinds je je cv stuurde, zijn er nieuwe vacatures bijgekomen die bij je profiel passen. Bekijk ze voordat ze sluiten.',
  jobsSubjectOpen: 'Je vacatures staan nog open',
  jobsBodyOpen: '{n} vacatures die bij je profiel passen staan nog open. Solliciteer met een cv dat erop is afgestemd.',
  jobsCta: 'Mijn vacatures bekijken',
  lastSubject: 'Je resultaat is nog 3 dagen beschikbaar',
  lastBody: 'Je resultaat en de vacatures die bij je passen zijn nog 3 dagen beschikbaar. Maak een gratis account om alles te bewaren en de score van je cv op 8 dimensies te zien.',
  lastCta: 'Gratis account maken',
  footer: 'Je krijgt deze e-mail omdat je om vacatures en tips vroeg toen je je cv naar GriffoWork stuurde. Het zijn maximaal 3 e-mails.',
  unsubscribe: 'Afmelden voor deze e-mails',
  unsubscribeConfirm: 'Wil je deze e-mails van GriffoWork niet meer ontvangen?',
  unsubscribedTitle: 'Klaar, je krijgt deze e-mails niet meer.',
  unsubscribedText: 'We hebben ook de gegevens verwijderd die we daarvoor bewaarden.',
}

const sv: NurtureCopy = {
  tipSubject: 'Så åtgärdar du det största problemet i ditt cv',
  tipIntro: 'Det här kostar ditt cv mest synlighet i rekryteringssystemen:',
  tipMore: 'Vi hittade {n} punkter till som minskar dina chanser. Den fullständiga diagnosen visar varje punkt och hur du åtgärdar den.',
  tipMoreOne: 'Vi hittade 1 punkt till som minskar dina chanser. Den fullständiga diagnosen visar vilken det är och hur du åtgärdar den.',
  tipCta: 'Se hela diagnosen',
  jobsSubjectNew: '{n} nya jobb passar din profil',
  jobsSubjectNewOne: '1 nytt jobb passar din profil',
  jobsBodyNew: 'Sedan du skickade in ditt cv har det kommit in nya jobb som passar din profil. Se dem innan de stängs.',
  jobsSubjectOpen: 'Dina jobb är fortfarande öppna',
  jobsBodyOpen: '{n} jobb som passar din profil är fortfarande öppna. Sök med ett cv anpassat för dem.',
  jobsCta: 'Se mina jobb',
  lastSubject: 'Ditt resultat försvinner om 3 dagar',
  lastBody: 'Ditt resultat och jobben som passar dig finns kvar i 3 dagar till. Skapa ett gratis konto för att spara allt och se ditt cv:s betyg i 8 dimensioner.',
  lastCta: 'Skapa mitt gratiskonto',
  footer: 'Du får det här mejlet eftersom du bad om jobb och tips när du skickade ditt cv till GriffoWork. Det blir högst 3 mejl.',
  unsubscribe: 'Sluta få de här mejlen',
  unsubscribeConfirm: 'Vill du sluta få de här mejlen från GriffoWork?',
  unsubscribedTitle: 'Klart, du får inte fler sådana mejl.',
  unsubscribedText: 'Vi har också raderat uppgifterna vi sparade för att skicka dem.',
}

const ja: NurtureCopy = {
  tipSubject: '履歴書の一番大きな問題を直す方法',
  tipIntro: '採用管理システムで、あなたの履歴書の評価を最も下げている点：',
  tipMore: 'ほかにも{n}件、チャンスを下げる点が見つかりました。詳しい診断で、すべての点と直し方を確認できます。',
  tipMoreOne: 'ほかにも1件、チャンスを下げる点が見つかりました。詳しい診断で、その内容と直し方を確認できます。',
  tipCta: '詳しい診断を見る',
  jobsSubjectNew: 'あなたに合う新着求人が{n}件あります',
  jobsSubjectNewOne: 'あなたに合う新着求人が1件あります',
  jobsBodyNew: '履歴書の送信後、あなたのプロフィールに合う求人が新たに掲載されました。締め切られる前にご確認ください。',
  jobsSubjectOpen: 'あなたに合う求人はまだ募集中です',
  jobsBodyOpen: 'あなたに合う求人{n}件がまだ募集中です。求人に合わせて整えた履歴書で応募しましょう。',
  jobsCta: '求人を見る',
  lastSubject: 'あと3日で結果が見られなくなります',
  lastBody: '結果とあなたに合う求人は、あと3日間ご覧いただけます。無料アカウントを作成すると、すべて保存でき、履歴書の8項目の評価も確認できます。',
  lastCta: '無料アカウントを作成',
  footer: 'このメールは、GriffoWorkに履歴書を送信した際に求人とアドバイスの受け取りを希望された方にお送りしています。最大3通です。',
  unsubscribe: 'このメールの配信を停止する',
  unsubscribeConfirm: 'GriffoWorkからのこのメールの配信を停止しますか？',
  unsubscribedTitle: '配信を停止しました。今後このメールは届きません。',
  unsubscribedText: '送信のために保存していたデータも削除しました。',
}

const zh: NurtureCopy = {
  tipSubject: '如何修正你简历中最大的问题',
  tipIntro: '在招聘筛选系统中，最影响你简历曝光的一点：',
  tipMore: '我们还发现 {n} 个降低你机会的问题。完整诊断会逐一列出并告诉你如何修改。',
  tipMoreOne: '我们还发现 1 个降低你机会的问题。完整诊断会告诉你是哪一个以及如何修改。',
  tipCta: '查看完整诊断',
  jobsSubjectNew: '{n} 个新职位与你的资料匹配',
  jobsSubjectNewOne: '1 个新职位与你的资料匹配',
  jobsBodyNew: '自你提交简历以来，又有新的匹配职位发布。趁还没截止，快去看看。',
  jobsSubjectOpen: '与你匹配的职位仍在招聘',
  jobsBodyOpen: '{n} 个与你资料匹配的职位仍在招聘。用针对性修改过的简历去投递吧。',
  jobsCta: '查看我的职位',
  lastSubject: '你的结果将在 3 天后下线',
  lastBody: '你的结果和匹配职位还可查看 3 天。免费注册账户即可保存全部内容，并查看简历在 8 个维度上的评分。',
  lastCta: '免费创建账户',
  footer: '你收到这封邮件，是因为你在向 GriffoWork 提交简历时选择了接收职位和建议。最多 3 封。',
  unsubscribe: '退订这些邮件',
  unsubscribeConfirm: '要停止接收 GriffoWork 的这些邮件吗？',
  unsubscribedTitle: '已退订，你不会再收到这些邮件。',
  unsubscribedText: '我们也删除了为发送邮件而保存的数据。',
}

const ar: NurtureCopy = {
  tipSubject: 'كيف تصلح أكبر مشكلة في سيرتك الذاتية',
  tipIntro: 'أكثر ما يقلّل ظهور سيرتك الذاتية في أنظمة فرز المتقدمين:',
  tipMore: 'وجدنا نقاطًا أخرى تقلّل فرصك (عددها: {n}). يعرض التشخيص الكامل كل نقطة وطريقة إصلاحها.',
  tipMoreOne: 'وجدنا نقطة أخرى تقلّل فرصك. يعرض التشخيص الكامل ما هي وطريقة إصلاحها.',
  tipCta: 'عرض التشخيص الكامل',
  jobsSubjectNew: 'وظائف جديدة تناسب ملفك: {n}',
  jobsSubjectNewOne: 'وظيفة جديدة تناسب ملفك',
  jobsBodyNew: 'منذ أن أرسلت سيرتك الذاتية، نُشرت وظائف جديدة تناسب ملفك. اطّلع عليها قبل أن تُغلق.',
  jobsSubjectOpen: 'وظائفك ما زالت متاحة',
  jobsBodyOpen: 'الوظائف التي تناسب ملفك وما زالت متاحة: {n}. قدّم بسيرة ذاتية مُعدّة لها.',
  jobsCta: 'عرض وظائفي',
  lastSubject: 'ستتوقف نتيجتك عن الظهور بعد 3 أيام',
  lastBody: 'تبقى نتيجتك والوظائف المناسبة لك متاحة لمدة 3 أيام أخرى. أنشئ حسابك المجاني لتحتفظ بكل شيء وترى تقييم سيرتك الذاتية في 8 أبعاد.',
  lastCta: 'إنشاء حسابي المجاني',
  footer: 'تصلك هذه الرسالة لأنك طلبت وظائف ونصائح عند إرسال سيرتك الذاتية إلى GriffoWork. ثلاث رسائل كحد أقصى.',
  unsubscribe: 'إلغاء الاشتراك في هذه الرسائل',
  unsubscribeConfirm: 'هل تريد التوقف عن تلقي هذه الرسائل من GriffoWork؟',
  unsubscribedTitle: 'تم، لن تصلك هذه الرسائل بعد الآن.',
  unsubscribedText: 'وحذفنا أيضًا البيانات التي احتفظنا بها لإرسالها.',
}

const ko: NurtureCopy = {
  tipSubject: '이력서의 가장 큰 문제를 고치는 방법',
  tipIntro: '채용 선별 시스템에서 이력서의 노출을 가장 많이 떨어뜨리는 점:',
  tipMore: '기회를 줄이는 점이 {n}개 더 있습니다. 전체 진단에서 각 항목과 고치는 방법을 확인하세요.',
  tipMoreOne: '기회를 줄이는 점이 1개 더 있습니다. 전체 진단에서 무엇인지와 고치는 방법을 확인하세요.',
  tipCta: '전체 진단 보기',
  jobsSubjectNew: '내 프로필에 맞는 새 채용 공고 {n}건',
  jobsSubjectNewOne: '내 프로필에 맞는 새 채용 공고 1건',
  jobsBodyNew: '이력서를 보낸 뒤 프로필에 맞는 새 공고가 올라왔습니다. 마감되기 전에 확인하세요.',
  jobsSubjectOpen: '내게 맞는 공고가 아직 열려 있습니다',
  jobsBodyOpen: '프로필에 맞는 공고 {n}건이 아직 채용 중입니다. 공고에 맞춘 이력서로 지원하세요.',
  jobsCta: '내 공고 보기',
  lastSubject: '3일 뒤 결과가 사라집니다',
  lastBody: '결과와 내게 맞는 공고는 3일 더 볼 수 있습니다. 무료 계정을 만들면 모두 저장하고 이력서의 8가지 항목 점수도 확인할 수 있습니다.',
  lastCta: '무료 계정 만들기',
  footer: 'GriffoWork에 이력서를 보낼 때 채용 공고와 팁을 요청하셨기 때문에 이 이메일을 받으셨습니다. 최대 3통입니다.',
  unsubscribe: '이 이메일 수신 거부',
  unsubscribeConfirm: 'GriffoWork의 이 이메일 수신을 중단하시겠습니까?',
  unsubscribedTitle: '완료되었습니다. 더 이상 이 이메일을 받지 않습니다.',
  unsubscribedText: '이메일 발송을 위해 보관하던 데이터도 삭제했습니다.',
}

export const NURTURE_COPY: Record<Language, NurtureCopy> = { pt, en, es, de, fr, it, nl, sv, ja, zh, ar, ko }

export function nurtureCopy(lang: string | null | undefined): NurtureCopy {
  return NURTURE_COPY[lang as Language] ?? NURTURE_COPY.en
}
