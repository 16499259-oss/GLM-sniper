import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// 本地定义类型，避免 verbatimModuleSyntax 问题
export type LogLevel = 'info' | 'success' | 'warning' | 'error';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
}

let logId = 0;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createLog(level: LogLevel, message: string): LogEntry {
  return {
    id: `log-${++logId}-${Date.now()}`,
    timestamp: new Date(),
    level,
    message,
  };
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function getTargetDateTime(date: string, time: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}
