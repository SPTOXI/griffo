import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db as prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-signature') || '';
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || '';

    // Verify signature
    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');

    if (digest.length !== signatureBuffer.length || !crypto.timingSafeEqual(digest, signatureBuffer)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;
    const obj = payload.data.attributes;

    // Save webhook event for audit/debug
    await prisma.webhookEvent.create({
      data: {
        eventName,
        body: JSON.stringify(payload),
      },
    });

    if (eventName === 'order_created' && obj.status === 'paid') {
      const customData = payload.meta.custom_data || {};
      const userId = customData.user_id;
      const creditAmount = parseInt(customData.credit_amount, 10);
      const orderId = payload.data.id;

      if (!userId || !creditAmount) {
        console.error('Missing custom_data in order:', payload.data.id);
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      // Check if this order was already processed
      const existing = await prisma.creditTransaction.findFirst({
        where: { paymentRef: orderId },
      });

      if (!existing) {
        // Add credits
        await prisma.creditTransaction.create({
          data: {
            userId,
            amount: creditAmount,
            type: 'purchase',
            description: `Compra de ${creditAmount} créditos via Lemon Squeezy`,
            paymentRef: orderId,
            costBrl: parseFloat(obj.total_formatted.replace(/[^0-9.-]+/g,"")), // approximate if in BRL
            status: 'completed'
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
