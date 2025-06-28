// Debug utilities for development
export const DEBUG = process.env.NODE_ENV === 'development';

export function log(...args: any[]) {
  if (DEBUG) {
    console.log('[DEBUG]:', ...args);
  }
}

export function warn(...args: any[]) {
  if (DEBUG) {
    console.warn('[WARN]:', ...args);
  }
}

export function error(...args: any[]) {
  if (DEBUG) {
    console.error('[ERROR]:', ...args);
  }
}

export function table(data: any) {
  if (DEBUG) {
    console.table(data);
  }
}

export function group(label: string, callback: () => void) {
  if (DEBUG) {
    console.group(label);
    callback();
    console.groupEnd();
  }
}

export function time(label: string) {
  if (DEBUG) {
    console.time(label);
  }
}

export function timeEnd(label: string) {
  if (DEBUG) {
    console.timeEnd(label);
  }
}

export function logApiCall(method: string, url: string, data?: any) {
  if (DEBUG) {
    group(`API ${method.toUpperCase()} ${url}`, () => {
      log('URL:', url);
      log('Method:', method);
      if (data) {
        log('Data:', data);
      }
    });
  }
}
