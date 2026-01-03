import Notification from '@/models/Notification';
import { sendEmailMinimal } from './email';
import { Types } from 'mongoose';

type NotifyOptions = {
  userId?: Types.ObjectId | string;
  role?: 'ADMIN' | 'SDR' | 'CLIENT';
  type: 'USER_CREATED' | 'SDR_UPDATE' | 'ADMIN_NOTE' | 'LOGIN_SUCCESS';
  message: string;
  link?: string;
  email?: string;
};

export async function notifyAndEmail(opts: NotifyOptions) {
  const payload: any = {
    type: opts.type,
    message: opts.message,
    ...(opts.link && { link: opts.link }),
    ...(opts.userId && { userId: opts.userId }),
    ...(opts.role && { role: opts.role }),
  };

  let emailSent = false;
  if (opts.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(opts.email)) {
    const res = await sendEmailMinimal({
      to: opts.email,
      subject: opts.type,
      text: opts.message,
      link: opts.link,
    });
    emailSent = res.sent;
    payload.emailSent = emailSent;
  }

  await Notification.create(payload);
  return { notificationCreated: true, emailSent };
}

