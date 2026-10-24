import type { Language } from '@/lib/i18n/types'

/**
 * Textos do pedido de depoimento (tela do relatório pago) e da seção de
 * depoimentos da página inicial, nos 12 idiomas.
 */
export interface TestimonialCopy {
  askTitle: string
  askText: string
  textPlaceholder: string
  nameLabel: string
  namePlaceholder: string
  cityLabel: string
  roleLabel: string
  consent: string
  submit: string
  thanks: string
  error: string
  sectionTitle: string
}

const pt: TestimonialCopy = {
  askTitle: 'A análise te ajudou?',
  askText: 'Conte em poucas linhas o que mudou no seu currículo ou na sua busca. Seu depoimento ajuda outras pessoas a decidir.',
  textPlaceholder: 'Ex.: corrigi o que o diagnóstico apontou e comecei a ser chamado para entrevistas.',
  nameLabel: 'Como seu nome deve aparecer',
  namePlaceholder: 'Ex.: Ana S.',
  cityLabel: 'Cidade (opcional)',
  roleLabel: 'Cargo (opcional)',
  consent: 'Autorizo a GriffoWork a publicar este depoimento no site, com o nome e a cidade acima.',
  submit: 'Enviar depoimento',
  thanks: 'Obrigado! Seu depoimento vai para revisão antes de aparecer no site.',
  error: 'Não conseguimos enviar agora. Tente de novo em instantes.',
  sectionTitle: 'Quem usou, conta',
}

const en: TestimonialCopy = {
  askTitle: 'Did the analysis help you?',
  askText: 'Tell us in a few lines what changed in your resume or your job search. Your words help other people decide.',
  textPlaceholder: 'E.g. I fixed what the diagnosis pointed out and started getting interview calls.',
  nameLabel: 'How your name should appear',
  namePlaceholder: 'E.g. Anna S.',
  cityLabel: 'City (optional)',
  roleLabel: 'Job title (optional)',
  consent: 'I allow GriffoWork to publish this testimonial on its website, with the name and city above.',
  submit: 'Send testimonial',
  thanks: 'Thank you! Your testimonial will be reviewed before it appears on the site.',
  error: 'We couldn’t send it right now. Please try again in a moment.',
  sectionTitle: 'What our users say',
}

const es: TestimonialCopy = {
  askTitle: '¿Te ayudó el análisis?',
  askText: 'Cuéntanos en pocas líneas qué cambió en tu currículum o en tu búsqueda. Tu testimonio ayuda a otras personas a decidir.',
  textPlaceholder: 'Ej.: corregí lo que señaló el diagnóstico y empezaron a llamarme para entrevistas.',
  nameLabel: 'Cómo debe aparecer tu nombre',
  namePlaceholder: 'Ej.: Ana S.',
  cityLabel: 'Ciudad (opcional)',
  roleLabel: 'Cargo (opcional)',
  consent: 'Autorizo a GriffoWork a publicar este testimonio en su sitio, con el nombre y la ciudad indicados.',
  submit: 'Enviar testimonio',
  thanks: '¡Gracias! Tu testimonio se revisará antes de aparecer en el sitio.',
  error: 'No pudimos enviarlo ahora. Inténtalo de nuevo en unos instantes.',
  sectionTitle: 'Lo que dicen quienes lo usaron',
}

const de: TestimonialCopy = {
  askTitle: 'Hat Ihnen die Analyse geholfen?',
  askText: 'Erzählen Sie in wenigen Zeilen, was sich an Ihrem Lebenslauf oder Ihrer Jobsuche geändert hat. Ihre Erfahrung hilft anderen bei der Entscheidung.',
  textPlaceholder: 'z. B.: Ich habe korrigiert, was die Diagnose gezeigt hat, und wurde danach zu Vorstellungsgesprächen eingeladen.',
  nameLabel: 'So soll Ihr Name erscheinen',
  namePlaceholder: 'z. B. Anna S.',
  cityLabel: 'Stadt (optional)',
  roleLabel: 'Position (optional)',
  consent: 'Ich erlaube GriffoWork, diese Erfahrung mit dem obigen Namen und der Stadt auf der Website zu veröffentlichen.',
  submit: 'Erfahrung senden',
  thanks: 'Danke! Ihre Erfahrung wird geprüft, bevor sie auf der Website erscheint.',
  error: 'Das Senden hat gerade nicht geklappt. Bitte versuchen Sie es gleich noch einmal.',
  sectionTitle: 'Das sagen unsere Nutzer',
}

const fr: TestimonialCopy = {
  askTitle: 'L’analyse vous a-t-elle aidé ?',
  askText: 'Racontez en quelques lignes ce qui a changé dans votre CV ou votre recherche. Votre témoignage aide d’autres personnes à se décider.',
  textPlaceholder: 'Ex. : j’ai corrigé ce que le diagnostic indiquait et j’ai commencé à être convoqué en entretien.',
  nameLabel: 'Comment votre nom doit apparaître',
  namePlaceholder: 'Ex. : Anne S.',
  cityLabel: 'Ville (facultatif)',
  roleLabel: 'Poste (facultatif)',
  consent: 'J’autorise GriffoWork à publier ce témoignage sur son site, avec le nom et la ville ci-dessus.',
  submit: 'Envoyer le témoignage',
  thanks: 'Merci ! Votre témoignage sera relu avant d’apparaître sur le site.',
  error: 'L’envoi n’a pas abouti. Réessayez dans un instant.',
  sectionTitle: 'Ils l’ont utilisé',
}

const it: TestimonialCopy = {
  askTitle: 'L’analisi ti è stata utile?',
  askText: 'Raccontaci in poche righe cosa è cambiato nel tuo CV o nella tua ricerca. La tua testimonianza aiuta altre persone a decidere.',
  textPlaceholder: 'Es.: ho corretto ciò che la diagnosi indicava e ho iniziato a ricevere inviti ai colloqui.',
  nameLabel: 'Come deve apparire il tuo nome',
  namePlaceholder: 'Es.: Anna S.',
  cityLabel: 'Città (facoltativo)',
  roleLabel: 'Ruolo (facoltativo)',
  consent: 'Autorizzo GriffoWork a pubblicare questa testimonianza sul sito, con il nome e la città indicati sopra.',
  submit: 'Invia testimonianza',
  thanks: 'Grazie! La tua testimonianza sarà revisionata prima di apparire sul sito.',
  error: 'Non siamo riusciti a inviarla. Riprova tra poco.',
  sectionTitle: 'Cosa dice chi l’ha usato',
}

const nl: TestimonialCopy = {
  askTitle: 'Heeft de analyse je geholpen?',
  askText: 'Vertel in een paar regels wat er veranderde aan je cv of je zoektocht. Jouw ervaring helpt anderen te beslissen.',
  textPlaceholder: 'Bijv.: ik heb verbeterd wat de diagnose aanwees en werd daarna uitgenodigd voor gesprekken.',
  nameLabel: 'Hoe je naam moet verschijnen',
  namePlaceholder: 'Bijv.: Anna S.',
  cityLabel: 'Stad (optioneel)',
  roleLabel: 'Functie (optioneel)',
  consent: 'Ik geef GriffoWork toestemming deze ervaring op de website te publiceren, met de naam en stad hierboven.',
  submit: 'Ervaring versturen',
  thanks: 'Bedankt! Je ervaring wordt gecontroleerd voordat ze op de site verschijnt.',
  error: 'Versturen lukte nu niet. Probeer het zo opnieuw.',
  sectionTitle: 'Wat gebruikers zeggen',
}

const sv: TestimonialCopy = {
  askTitle: 'Hjälpte analysen dig?',
  askText: 'Berätta med några rader vad som ändrades i ditt cv eller ditt jobbsökande. Din berättelse hjälper andra att bestämma sig.',
  textPlaceholder: 'T.ex.: jag åtgärdade det diagnosen pekade på och började bli kallad till intervjuer.',
  nameLabel: 'Hur ditt namn ska visas',
  namePlaceholder: 'T.ex.: Anna S.',
  cityLabel: 'Stad (valfritt)',
  roleLabel: 'Befattning (valfritt)',
  consent: 'Jag tillåter GriffoWork att publicera det här omdömet på webbplatsen, med namnet och staden ovan.',
  submit: 'Skicka omdöme',
  thanks: 'Tack! Ditt omdöme granskas innan det visas på webbplatsen.',
  error: 'Det gick inte att skicka just nu. Försök igen om en stund.',
  sectionTitle: 'Det här säger våra användare',
}

const ja: TestimonialCopy = {
  askTitle: '分析は役に立ちましたか？',
  askText: '履歴書や仕事探しで何が変わったか、数行で教えてください。あなたの声が、ほかの人の判断の助けになります。',
  textPlaceholder: '例：診断で指摘された点を直したら、面接に呼ばれるようになりました。',
  nameLabel: '表示するお名前',
  namePlaceholder: '例：佐藤 A.',
  cityLabel: '都市（任意）',
  roleLabel: '職種（任意）',
  consent: '上記の名前と都市とともに、この体験談をGriffoWorkのサイトに掲載することに同意します。',
  submit: '体験談を送る',
  thanks: 'ありがとうございます。体験談は確認後にサイトに掲載されます。',
  error: '送信できませんでした。しばらくしてからもう一度お試しください。',
  sectionTitle: '利用者の声',
}

const zh: TestimonialCopy = {
  askTitle: '这次分析对你有帮助吗？',
  askText: '用几句话告诉我们，你的简历或求职有了什么变化。你的评价能帮助其他人做决定。',
  textPlaceholder: '例如：我按诊断指出的问题做了修改，之后开始收到面试邀请。',
  nameLabel: '你的名字如何显示',
  namePlaceholder: '例如：王 A.',
  cityLabel: '城市（选填）',
  roleLabel: '职位（选填）',
  consent: '我同意 GriffoWork 在网站上发布这条评价，并显示上面的名字和城市。',
  submit: '提交评价',
  thanks: '谢谢！你的评价会在审核后显示在网站上。',
  error: '暂时无法提交，请稍后再试。',
  sectionTitle: '用户怎么说',
}

const ar: TestimonialCopy = {
  askTitle: 'هل ساعدك التحليل؟',
  askText: 'أخبرنا في بضعة أسطر بما تغيّر في سيرتك الذاتية أو في بحثك عن عمل. تساعد شهادتك الآخرين على اتخاذ القرار.',
  textPlaceholder: 'مثال: أصلحت ما أشار إليه التشخيص وبدأت أتلقى دعوات لمقابلات.',
  nameLabel: 'كيف يظهر اسمك',
  namePlaceholder: 'مثال: سارة م.',
  cityLabel: 'المدينة (اختياري)',
  roleLabel: 'المسمى الوظيفي (اختياري)',
  consent: 'أوافق على أن تنشر GriffoWork هذه الشهادة على موقعها، مع الاسم والمدينة أعلاه.',
  submit: 'إرسال الشهادة',
  thanks: 'شكرًا! ستُراجع شهادتك قبل ظهورها على الموقع.',
  error: 'تعذّر الإرسال الآن. حاول مرة أخرى بعد قليل.',
  sectionTitle: 'ماذا يقول المستخدمون',
}

const ko: TestimonialCopy = {
  askTitle: '분석이 도움이 되었나요?',
  askText: '이력서나 구직 과정에서 무엇이 달라졌는지 몇 줄로 알려 주세요. 여러분의 후기가 다른 사람의 결정을 돕습니다.',
  textPlaceholder: '예: 진단에서 지적한 부분을 고쳤더니 면접 연락이 오기 시작했습니다.',
  nameLabel: '표시될 이름',
  namePlaceholder: '예: 김 A.',
  cityLabel: '도시 (선택)',
  roleLabel: '직무 (선택)',
  consent: '위의 이름과 도시와 함께 이 후기를 GriffoWork 사이트에 게시하는 데 동의합니다.',
  submit: '후기 보내기',
  thanks: '감사합니다! 후기는 검토 후 사이트에 게시됩니다.',
  error: '지금은 보낼 수 없습니다. 잠시 후 다시 시도해 주세요.',
  sectionTitle: '이용자 후기',
}

export const TESTIMONIAL_COPY: Record<Language, TestimonialCopy> = { pt, en, es, de, fr, it, nl, sv, ja, zh, ar, ko }

export function testimonialCopy(lang: string | null | undefined): TestimonialCopy {
  return TESTIMONIAL_COPY[lang as Language] ?? TESTIMONIAL_COPY.en
}
