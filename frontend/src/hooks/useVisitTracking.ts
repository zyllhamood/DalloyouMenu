import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { visitCreate, type VisitDevice } from '../lib/api';

const VISITOR_KEY = 'dalloyou.visitor_id';

function visitorId(): string {
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const id =
      window.crypto?.randomUUID?.() ??
      `visitor_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    return `visitor_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

function deviceType(): VisitDevice {
  const ua = navigator.userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return 'tablet';
  if (/mobi|iphone|android/.test(ua)) return 'mobile';
  return 'desktop';
}

export function useVisitTracking() {
  const location = useLocation();

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    void visitCreate({
      visitor_id: visitorId(),
      path,
      referrer: document.referrer || '',
      device_type: deviceType(),
    }).catch(() => {
      // Tracking should never interrupt browsing.
    });
  }, [location.pathname, location.search]);
}
