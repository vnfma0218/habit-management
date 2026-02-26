import { toKSTDateString } from "@/lib/date/kst";

type PushRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  // last_sent_date: string | null;
};

function getVapidConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@example.com";

  if (!publicKey || !privateKey) {
    throw new Error("Missing VAPID keys in environment variables");
  }
  return { publicKey, privateKey, subject };
}

async function getWebPush() {
  const webpush = await import("web-push");
  const vapid = getVapidConfig();
  webpush.default.setVapidDetails(
    vapid.subject,
    vapid.publicKey,
    vapid.privateKey
  );
  return webpush.default;
}

export async function sendPushToSubscription(
  row: PushRow,
  payload: Record<string, unknown>
) {
  const webpush = await getWebPush();
  return webpush.sendNotification(
    {
      endpoint: row.endpoint,
      keys: {
        p256dh: row.p256dh,
        auth: row.auth,
      },
    },
    JSON.stringify(payload)
  );
}

export function getKSTTodayString() {
  return toKSTDateString(new Date());
}
