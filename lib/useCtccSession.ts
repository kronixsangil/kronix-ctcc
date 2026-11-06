"use client";

import { useEffect, useRef } from "react";

export function useCtccSession(enabled: boolean, initialDeadline: number, onExpired: () => void) {
  const onExpiredRef = useRef(onExpired);
  useEffect(() => { onExpiredRef.current = onExpired; }, [onExpired]);

  useEffect(() => {
    if (!enabled) return;
    let deadline = initialDeadline;
    let stopped = false;
    let checking = false;
    let renewing = false;
    let lastRequest = 0;
    let pending = false;
    let timer: number | undefined;
    let trailing: number | undefined;
    const activityEvents = ["pointerdown", "keydown", "wheel", "touchmove", "input"];
    const abort = new AbortController();

    function expire() {
      if (stopped) return;
      stopped = true;
      onExpiredRef.current();
    }

    function schedule(next: number) {
      if (stopped || !Number.isFinite(next) || next <= 0) return;
      deadline = next;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void check(), Math.max(0, deadline - Date.now()));
    }

    async function check() {
      if (checking || stopped) return;
      checking = true;
      try {
        const response = await fetch("/api/ctcc/auth/me", {
          cache: "no-store", signal: AbortSignal.any([abort.signal, AbortSignal.timeout(5000)]),
        });
        if (response.status === 401) return expire();
        if (response.ok) {
          const next = Number(response.headers.get("X-CTCC-Expires-At"));
          if (next > Date.now()) return schedule(Math.max(deadline, next));
        }
      } catch {
        // Connectivity failures do not end an otherwise unexpired session.
      } finally {
        checking = false;
      }
      if (deadline > 0 && Date.now() >= deadline) expire();
    }

    async function renew() {
      if (stopped || renewing || !pending) return;
      if (deadline > 0 && Date.now() >= deadline) {
        pending = false;
        void check();
        return;
      }
      const delay = lastRequest + 2000 - Date.now();
      if (delay > 0) {
        window.clearTimeout(trailing);
        trailing = window.setTimeout(() => void renew(), delay);
        return;
      }
      pending = false;
      renewing = true;
      lastRequest = Date.now();
      try {
        const response = await fetch("/api/auth/activity", {
          method: "POST", headers: { "x-ctcc-activity": "1" },
          signal: AbortSignal.any([abort.signal, AbortSignal.timeout(5000)]),
        });
        if (response.status === 401) return void check();
        if (response.ok) schedule(Number((await response.json()).expiresAt));
      } catch {
        // An action can try again when the connection returns.
      } finally {
        renewing = false;
        if (pending) void renew();
      }
    }

    function activity(event: Event) {
      if (!event.isTrusted || document.visibilityState !== "visible") return;
      pending = true;
      void renew();
    }

    function visible() {
      if (document.visibilityState === "visible") void check();
    }

    schedule(initialDeadline);
    const interval = window.setInterval(visible, 15000);
    for (const name of activityEvents) window.addEventListener(name, activity, { passive: true, capture: true });
    window.addEventListener("focus", visible);
    window.addEventListener("pageshow", visible);
    document.addEventListener("visibilitychange", visible);

    return () => {
      stopped = true;
      abort.abort();
      window.clearInterval(interval);
      window.clearTimeout(timer);
      window.clearTimeout(trailing);
      for (const name of activityEvents) window.removeEventListener(name, activity, true);
      window.removeEventListener("focus", visible);
      window.removeEventListener("pageshow", visible);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [enabled, initialDeadline]);
}
