# Comunicado da migração de saldos

Rascunho para revisão antes do disparo. Três idiomas, porque a base é global.

**Variáveis a substituir por conta:**

- `{{NOME}}` — primeiro nome do usuário
- `{{CREDITOS}}` — saldo de créditos antes da conversão
- `{{ANALISES}}` — análises creditadas (`Math.ceil(creditos / 25)`)

Envie **apenas para quem tinha saldo maior que zero**. Quem tinha 0 crédito não
teve nada convertido e receberia um aviso sobre uma mudança que não o afeta —
o `migrate:analyses` imprime a lista de quem foi convertido.

Disparar **depois** da migração ter rodado, não antes: o e-mail diz que o saldo
já está na conta, e precisa ser verdade quando a pessoa clicar.

---

## Português

**Assunto:** Seus créditos viraram análises completas — e você saiu ganhando

Olá, {{NOME}},

Mudamos como o Griffo cobra, e queremos que você saiba exatamente o que
aconteceu com o seu saldo.

**Antes:** você comprava créditos e gastava um tanto em cada ação — 20 na
avaliação, 10 na reescrita, 15 na carta, 1 em cada download. Era preciso fazer
conta antes de usar.

**Agora:** existe uma coisa só, a **Análise Completa**. Uma compra libera tudo
para um currículo, sem contagem:

- Laudo das 8 dimensões
- Comparação com a vaga alvo
- Reescrita de experiências (STAR/XYZ)
- Orientação profissional
- Otimização de perfil (LinkedIn/Gupy)
- Análise de mídias sociais
- Carta de apresentação
- Resumo profissional
- Download em PDF

**O que aconteceu com o seu saldo:** seus **{{CREDITOS}} créditos** viraram
**{{ANALISES}} análise(s) completa(s)**, já disponíveis na sua conta.

A conversão foi de 25 créditos por análise, arredondando **para cima, a seu
favor**. Quem tinha 40 créditos, por exemplo, recebeu 2 análises — não 1. Você
não perdeu nada, e em vários casos ganhou mais do que o saldo antigo comprava.

Duas coisas que não mudam: não existe assinatura, mensalidade nem renovação
automática, e o que você já baixou continua seu.

Uma coisa que melhorou: se a inteligência artificial falhar no meio de algum
item, isso não custa mais nada. O currículo continua liberado e você pede de
novo.

Qualquer dúvida, é só responder este e-mail.

Equipe Griffo

---

## English

**Subject:** Your credits are now complete analyses — and you came out ahead

Hi {{NOME}},

We changed how Griffo charges, and we want you to know exactly what happened to
your balance.

**Before:** you bought credits and spent a different amount on each action — 20
for the audit, 10 for the rewrite, 15 for the cover letter, 1 per download. You
had to do the math before using anything.

**Now:** there is one thing only, the **Complete Analysis**. One purchase
unlocks everything for a resume, with no counting:

- 8-dimension audit report
- Target job comparison
- Experience rewrite (STAR/XYZ)
- Career guidance report
- Profile optimization (LinkedIn/ATS)
- Social media review
- Cover letter
- Professional summary
- PDF download

**What happened to your balance:** your **{{CREDITOS}} credits** became
**{{ANALISES}} complete analysis/analyses**, already available in your account.

We converted at 25 credits per analysis, rounding **up, in your favor**. Someone
with 40 credits, for instance, received 2 analyses — not 1. You lost nothing,
and in many cases you gained more than the old balance could buy.

Two things that do not change: there is no subscription, monthly fee or
auto-renewal, and everything you already downloaded stays yours.

One thing that got better: if the AI fails partway through any item, it no
longer costs you anything. The resume stays unlocked and you simply ask again.

Any questions, just reply to this email.

The Griffo Team

---

## Español

**Asunto:** Tus créditos ahora son análisis completos — y saliste ganando

Hola, {{NOME}}:

Cambiamos la forma en que Griffo cobra, y queremos que sepas exactamente qué
pasó con tu saldo.

**Antes:** comprabas créditos y gastabas una cantidad distinta en cada acción:
20 en la evaluación, 10 en la reescritura, 15 en la carta, 1 por descarga. Había
que hacer cuentas antes de usar.

**Ahora:** existe una sola cosa, el **Análisis Completo**. Una compra libera
todo para un currículum, sin contar nada:

- Informe de 8 dimensiones
- Comparación con la vacante
- Reescritura de experiencias (STAR/XYZ)
- Orientación profesional
- Optimización de perfil (LinkedIn/ATS)
- Análisis de redes sociales
- Carta de presentación
- Resumen profesional
- Descarga en PDF

**Qué pasó con tu saldo:** tus **{{CREDITOS}} créditos** se convirtieron en
**{{ANALISES}} análisis completo(s)**, ya disponibles en tu cuenta.

La conversión fue de 25 créditos por análisis, redondeando **hacia arriba, a tu
favor**. Quien tenía 40 créditos, por ejemplo, recibió 2 análisis, no 1. No
perdiste nada, y en varios casos ganaste más de lo que el saldo anterior
compraba.

Dos cosas que no cambian: no hay suscripción, mensualidad ni renovación
automática, y todo lo que ya descargaste sigue siendo tuyo.

Una cosa que mejoró: si la inteligencia artificial falla a mitad de algún ítem,
eso ya no te cuesta nada. El currículum sigue liberado y lo pides de nuevo.

Cualquier duda, responde a este correo.

Equipo Griffo
