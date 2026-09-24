/**
 * WOWTEK Warranty Calculation & Automation Service
 * Business: WOWTEK (wowtek.lk)
 *
 * Automatically computes warranty start and expiry dates, evaluates statuses
 * (Active, Expiring Soon, Expired, Claimed), and provides reminder scheduling
 * with duplicate alert prevention.
 */

import { WarrantyRecord, WarrantyStatus } from '../types';

export function calculateExpiryDate(
  startDateStr: string,
  duration: number,
  unit: 'DAYS' | 'MONTHS' | 'YEARS' | string
): string {
  const date = new Date(startDateStr);
  if (isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  if (unit === 'DAYS') {
    date.setDate(date.getDate() + duration);
  } else if (unit === 'YEARS') {
    date.setFullYear(date.getFullYear() + duration);
  } else {
    // Default or MONTHS
    date.setMonth(date.getMonth() + duration);
  }

  return date.toISOString();
}

export function evaluateWarrantyStatus(
  expiryDateStr?: string | null,
  existingStatus?: WarrantyStatus | string
): { status: WarrantyStatus; daysRemaining: number } {
  if (existingStatus === 'CLAIMED') {
    return { status: 'CLAIMED', daysRemaining: 0 };
  }

  if (!expiryDateStr) {
    return { status: 'ACTIVE', daysRemaining: 365 };
  }

  const now = new Date();
  const expiry = new Date(expiryDateStr);
  if (isNaN(expiry.getTime())) {
    return { status: 'ACTIVE', daysRemaining: 365 };
  }

  const diffTime = expiry.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining <= 0) {
    return { status: 'EXPIRED', daysRemaining };
  }

  if (daysRemaining <= 30) {
    return { status: 'EXPIRING_SOON', daysRemaining };
  }

  return { status: 'ACTIVE', daysRemaining };
}

export type ReminderInterval = '30_DAYS' | '14_DAYS' | '7_DAYS' | '1_DAY' | 'EXPIRED';

export interface DueReminder {
  warranty: WarrantyRecord;
  interval: ReminderInterval;
  daysRemaining: number;
}

/**
 * Checks all active warranties and identifies which need SMS notifications
 * based on enabled reminder settings, strictly avoiding duplicate sends.
 */
export function identifyDueReminders(
  warranties: WarrantyRecord[],
  enabledReminders: Record<ReminderInterval, boolean>
): DueReminder[] {
  const dueList: DueReminder[] = [];

  for (const w of warranties) {
    if (w.status === 'CLAIMED') continue;

    const { status, daysRemaining } = evaluateWarrantyStatus(w.expiryDate, w.status);

    if (daysRemaining <= 0) {
      if (enabledReminders.EXPIRED && !w.reminderHistory.includes('EXPIRED')) {
        dueList.push({ warranty: w, interval: 'EXPIRED', daysRemaining });
      }
      continue;
    }

    if (daysRemaining <= 1 && enabledReminders['1_DAY'] && !w.reminderHistory.includes('1_DAY')) {
      dueList.push({ warranty: w, interval: '1_DAY', daysRemaining });
    } else if (daysRemaining <= 7 && enabledReminders['7_DAYS'] && !w.reminderHistory.includes('7_DAYS')) {
      dueList.push({ warranty: w, interval: '7_DAYS', daysRemaining });
    } else if (daysRemaining <= 14 && enabledReminders['14_DAYS'] && !w.reminderHistory.includes('14_DAYS')) {
      dueList.push({ warranty: w, interval: '14_DAYS', daysRemaining });
    } else if (daysRemaining <= 30 && enabledReminders['30_DAYS'] && !w.reminderHistory.includes('30_DAYS')) {
      dueList.push({ warranty: w, interval: '30_DAYS', daysRemaining });
    }
  }

  return dueList;
}
