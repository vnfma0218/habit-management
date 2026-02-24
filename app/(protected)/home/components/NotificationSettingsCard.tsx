"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function base64UrlToUint8Array(base64UrlString: string) {
  const padding = "=".repeat((4 - (base64UrlString.length % 4)) % 4);
  const base64 = (base64UrlString + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function getServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("이 브라우저는 서비스워커를 지원하지 않습니다.");
  }
  return navigator.serviceWorker.register("/sw.js");
}

export function NotificationSettingsCard() {
  const [reminderTime, setReminderTime] = useState("20:00");
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await getServiceWorkerRegistration();
        const res = await fetch("/api/notifications/settings", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "알림 설정 조회 실패");

        setReminderTime(json.reminder_time ?? "20:00");
        setEnabled(Boolean(json.is_enabled));
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "알림 설정을 불러오지 못했습니다.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const subscribePush = async () => {
    if (!("Notification" in window)) {
      throw new Error("이 브라우저는 알림을 지원하지 않습니다.");
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("알림 권한이 허용되지 않았습니다.");
    }

    const registration = await getServiceWorkerRegistration();
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const vapidRes = await fetch("/api/notifications/vapid-public-key");
      const vapidJson = await vapidRes.json();
      if (!vapidRes.ok) {
        throw new Error(vapidJson.error ?? "VAPID 키 조회 실패");
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToUint8Array(vapidJson.publicKey),
      });
    }

    const saveRes = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        reminder_time: reminderTime,
        is_enabled: true,
      }),
    });
    const saveJson = await saveRes.json();
    if (!saveRes.ok) {
      throw new Error(saveJson.error ?? "알림 구독 저장 실패");
    }
  };

  const unsubscribePush = async () => {
    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    const subscription = await registration?.pushManager.getSubscription();

    await fetch("/api/notifications/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reminder_time: reminderTime,
        is_enabled: false,
      }),
    });

    if (subscription) {
      await fetch("/api/notifications/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
    }
  };

  const onSave = async () => {
    setSaving(true);
    try {
      if (enabled) {
        await subscribePush();
      } else {
        await unsubscribePush();
      }
      toast.success("알림 설정이 저장되었습니다.");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "알림 설정 저장에 실패했습니다.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const onSendTest = async () => {
    try {
      const res = await fetch("/api/notifications/test", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "테스트 알림 발송 실패");
      toast.success(`테스트 알림 ${json.sent}건 발송됨`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "테스트 알림 발송 실패";
      toast.error(message);
    }
  };

  return (
    <Card className="border bg-white/90 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">알림 설정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-sm text-slate-500">알림 설정을 불러오는 중...</div>
        ) : (
          <>
            <label className="flex items-center justify-between text-sm">
              <span className="text-slate-700">매일 알림 받기</span>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
            </label>

            <label className="flex items-center justify-between text-sm">
              <span className="text-slate-700">알림 시간 (KST)</span>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="rounded-md border border-slate-300 px-2 py-1"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <Button type="button" onClick={onSave} disabled={saving}>
                {saving ? "저장 중..." : "알림 저장"}
              </Button>
              <Button type="button" variant="outline" onClick={onSendTest}>
                테스트 발송
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
