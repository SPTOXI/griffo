import type { Language } from '../i18n/types'

/**
 * Regra de reembolso mostrada ao cliente na tela de compra (§2.163), nos 12
 * idiomas. Não há botão: o pedido é feito pelo suporte (decisão do operador).
 *
 * "Iniciamos a devolução em até 24 horas" e não "o dinheiro volta em 24
 * horas": a Stripe devolve na hora, mas o tempo até aparecer na fatura é do
 * banco do cliente (dias). Prometer o que não controlamos seria enganoso.
 */
export interface RefundCopy {
  title: string
  policy: string
  requestHow: string
}

export const REFUND_COPY: Record<Language, RefundCopy> = {
  pt: {
    title: 'Reembolso',
    policy: 'Você pode pedir reembolso em até 7 dias depois da compra, desde que o serviço não tenha sido executado: a análise ainda não foi usada, ou foi paga e não entregue. Depois de 7 dias não há reembolso. Se uma análise falhar, você pode gerá-la de novo sem pagar outra vez. Aprovado o pedido, iniciamos a devolução em até 24 horas, pelo mesmo meio de pagamento; o prazo para aparecer na fatura depende do seu banco.',
    requestHow: 'Para pedir, escreva para {email} com o e-mail da sua conta.',
  },
  en: {
    title: 'Refund',
    policy: "You can request a refund within 7 days of purchase, as long as the service hasn't been delivered: the analysis hasn't been used yet, or it was paid for and not delivered. After 7 days there are no refunds. If an analysis fails, you can generate it again without paying twice. Once your request is approved, we start the refund within 24 hours, to the same payment method; how long it takes to appear on your statement depends on your bank.",
    requestHow: 'To request one, email {email} from the address on your account.',
  },
  es: {
    title: 'Reembolso',
    policy: 'Puedes solicitar el reembolso hasta 7 días después de la compra, siempre que el servicio no se haya prestado: el análisis aún no se usó, o se pagó y no se entregó. Pasados 7 días no hay reembolso. Si un análisis falla, puedes generarlo de nuevo sin volver a pagar. Una vez aprobada la solicitud, iniciamos la devolución en un máximo de 24 horas, por el mismo medio de pago; el tiempo hasta que aparezca en tu extracto depende de tu banco.',
    requestHow: 'Para solicitarlo, escribe a {email} desde el correo de tu cuenta.',
  },
  de: {
    title: 'Rückerstattung',
    policy: 'Sie können innerhalb von 7 Tagen nach dem Kauf eine Rückerstattung beantragen, sofern die Leistung nicht erbracht wurde: Die Analyse wurde noch nicht genutzt, oder sie wurde bezahlt und nicht geliefert. Nach 7 Tagen ist keine Rückerstattung mehr möglich. Wenn eine Analyse fehlschlägt, können Sie sie ohne erneute Zahlung noch einmal erstellen. Nach Genehmigung Ihres Antrags veranlassen wir die Rückerstattung innerhalb von 24 Stunden über dieselbe Zahlungsart; wann sie auf Ihrem Kontoauszug erscheint, hängt von Ihrer Bank ab.',
    requestHow: 'Schreiben Sie dafür von der E-Mail-Adresse Ihres Kontos an {email}.',
  },
  fr: {
    title: 'Remboursement',
    policy: "Vous pouvez demander un remboursement dans les 7 jours suivant l'achat, à condition que le service n'ait pas été fourni : l'analyse n'a pas encore été utilisée, ou elle a été payée et non livrée. Après 7 jours, aucun remboursement n'est possible. Si une analyse échoue, vous pouvez la relancer sans payer à nouveau. Une fois la demande acceptée, nous lançons le remboursement sous 24 heures, sur le même moyen de paiement ; le délai d'apparition sur votre relevé dépend de votre banque.",
    requestHow: "Pour le demander, écrivez à {email} depuis l'adresse de votre compte.",
  },
  it: {
    title: 'Rimborso',
    policy: "Puoi chiedere il rimborso entro 7 giorni dall'acquisto, purché il servizio non sia stato erogato: l'analisi non è ancora stata usata, oppure è stata pagata e non consegnata. Dopo 7 giorni non è previsto alcun rimborso. Se un'analisi non va a buon fine, puoi generarla di nuovo senza pagare un'altra volta. Approvata la richiesta, avviamo il rimborso entro 24 ore, sullo stesso metodo di pagamento; il tempo perché compaia sull'estratto conto dipende dalla tua banca.",
    requestHow: "Per chiederlo, scrivi a {email} dall'indirizzo del tuo account.",
  },
  nl: {
    title: 'Terugbetaling',
    policy: 'Je kunt binnen 7 dagen na aankoop een terugbetaling aanvragen, zolang de dienst niet is geleverd: de analyse is nog niet gebruikt, of is betaald en niet geleverd. Na 7 dagen is terugbetaling niet meer mogelijk. Mislukt een analyse, dan kun je die opnieuw laten maken zonder nog eens te betalen. Na goedkeuring van je aanvraag starten we de terugbetaling binnen 24 uur, via dezelfde betaalmethode; hoe snel die op je afschrift staat, hangt af van je bank.',
    requestHow: 'Mail hiervoor naar {email} vanaf het e-mailadres van je account.',
  },
  sv: {
    title: 'Återbetalning',
    policy: 'Du kan begära återbetalning inom 7 dagar efter köpet, så länge tjänsten inte har levererats: analysen har inte använts ännu, eller den är betald men inte levererad. Efter 7 dagar görs inga återbetalningar. Om en analys misslyckas kan du göra den igen utan att betala en gång till. När begäran har godkänts påbörjar vi återbetalningen inom 24 timmar, till samma betalningsmetod som du betalade med; hur snabbt den syns på ditt kontoutdrag beror på din bank.',
    requestHow: 'Mejla {email} från e-postadressen på ditt konto för att begära den.',
  },
  ja: {
    title: '返金',
    policy: 'サービスが提供されていない場合に限り、購入から7日以内であれば返金を申請できます。対象は、分析をまだ使っていない場合、またはお支払い後に分析が提供されなかった場合です。7日を過ぎると返金はできません。分析が失敗した場合は、追加料金なしでもう一度作成できます。申請が承認されると、24時間以内に同じお支払い方法で返金手続きを開始します。明細に反映されるまでの期間はご利用の金融機関によって異なります。',
    requestHow: '申請は、アカウントのメールアドレスから {email} までご連絡ください。',
  },
  zh: {
    title: '退款',
    policy: '在服务尚未提供的情况下，你可以在购买后 7 天内申请退款：即分析尚未使用，或已付款但未交付。超过 7 天不予退款。如果分析失败，你可以重新生成，无需再次付费。申请获批后，我们会在 24 小时内通过原支付方式发起退款；款项显示在账单上的时间取决于你的银行。',
    requestHow: '如需申请，请使用账户邮箱发送邮件至 {email}。',
  },
  ar: {
    title: 'استرداد المبلغ',
    policy: 'يمكنك طلب استرداد المبلغ خلال 7 أيام من الشراء، بشرط ألا تكون الخدمة قد قُدِّمت: أي أن التحليل لم يُستخدم بعد، أو دُفع ثمنه ولم يُسلَّم. بعد مرور 7 أيام لا يوجد استرداد. إذا فشل التحليل، يمكنك إنشاؤه من جديد دون أن تدفع مرة أخرى. بعد الموافقة على الطلب، نبدأ إجراءات الاسترداد خلال 24 ساعة وبوسيلة الدفع نفسها، أما مدة ظهوره في كشف حسابك فتعتمد على مصرفك.',
    requestHow: 'لتقديم الطلب، راسلنا على {email} من البريد الإلكتروني المسجّل في حسابك.',
  },
  ko: {
    title: '환불',
    policy: '서비스가 제공되지 않은 경우에 한해 구매 후 7일 이내에 환불을 요청할 수 있어요. 분석을 아직 사용하지 않았거나, 결제했는데 분석을 받지 못한 경우가 해당돼요. 7일이 지나면 환불되지 않아요. 분석이 실패하면 추가 비용 없이 다시 만들 수 있어요. 요청이 승인되면 24시간 이내에 같은 결제 수단으로 환불을 시작하며, 명세서에 반영되는 시점은 이용하는 은행에 따라 달라요.',
    requestHow: '요청하려면 계정 이메일로 {email}에 메일을 보내 주세요.',
  },
}
