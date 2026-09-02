import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface EmailInvitePayload {
  toEmail: string;
  inviterName: string;
  familyName: string;
  inviteId: string;
  registrationUrl?: string;
}

/**
 * Queue an email invitation in Firestore 'mail' collection (Trigger Email extension pattern)
 * and generate a direct registration/joining link for fallback/dev preview.
 */
export async function queueEmailInvitation(payload: EmailInvitePayload): Promise<{ success: boolean; inviteLink: string }> {
  const inviteLink = `${window.location.origin}/#invite=${payload.inviteId}`;
  
  const emailData = {
    to: [payload.toEmail],
    message: {
      subject: `Приглашение в семейный бюджет от ${payload.inviterName}`,
      text: `Здравствуйте! ${payload.inviterName} приглашает вас присоединиться к семейному продуктовому пространству «${payload.familyName}» в Смарт-Бюджете. Перейдите по ссылке для входа: ${inviteLink}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background-color: #0F172A; color: #F8FAFC; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px;">🥑</span>
            <h2 style="color: #10B981; margin: 8px 0 4px;">Смарт-Бюджет</h2>
            <p style="color: #94A3B8; font-size: 14px; margin: 0;">Семейное управление покупками и продуктами</p>
          </div>
          <div style="background-color: #1E293B; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="font-size: 15px; margin: 0 0 12px; color: #E2E8F0;">
              <strong>${payload.inviterName}</strong> приглашает вас вести общий продуктовый бюджет и список покупок в семье <strong>«${payload.familyName}»</strong>.
            </p>
            <p style="font-size: 13px; color: #94A3B8; margin: 0;">
              С общим доступом вы сможете вместе отслеживать лимиты, планировать закупки и получать советы от умного ассистента.
            </p>
          </div>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${inviteLink}" style="display: inline-block; background-color: #10B981; color: #000000; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 10px;">
              Принять приглашение и войти
            </a>
          </div>
          <p style="font-size: 11px; color: #64748B; text-align: center; margin: 0;">
            Если кнопка не нажимается, скопируйте ссылку: <br/>
            <span style="color: #10B981;">${inviteLink}</span>
          </p>
        </div>
      `,
    },
    createdAt: serverTimestamp(),
    status: 'pending',
  };

  try {
    const mailColRef = collection(db, 'mail');
    await addDoc(mailColRef, emailData);
  } catch (err) {
    // Fallback in dev/sandbox if mail collection is not indexed or rules restricted
    console.warn('Mail queue notice (dev preview fallback active):', err);
  }

  return {
    success: true,
    inviteLink,
  };
}
