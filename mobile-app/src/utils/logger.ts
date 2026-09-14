/**
 * Sistema Unificado de Logging para la Aplicación Móvil (Grado Empresarial)
 * Proporciona trazabilidad detallada de red, errores, eventos de ciclo de vida
 * y ofuscación automática de datos sensibles (PINs, tokens, PII).
 */

export type LogTag =
  | 'APP'
  | 'API'
  | 'AUTH'
  | 'COMMUNITY'
  | 'CRIME'
  | 'GUIDES'
  | 'MEDIA'
  | 'STORAGE'
  | 'LOCATION'
  | 'I18N'
  | 'NAVIGATION'
  | 'UI';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

/**
 * Sanitiza recursivamente objetos y cadenas para prevenir la fuga de PINs o datos sensibles en logs
 */
export function sanitizeLogData(data: any): any {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    return data
      .replace(/([?&]pin=)[^&]+/gi, '$1***')
      .replace(/([?&]followup_code=)[^&]+/gi, '$1***')
      .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, '$1***');
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeLogData);
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('pin') ||
        lowerKey.includes('followup_code') ||
        lowerKey.includes('password') ||
        lowerKey.includes('token') ||
        lowerKey.includes('authorization') ||
        lowerKey.includes('secret')
      ) {
        sanitized[key] = '***';
      } else {
        sanitized[key] = sanitizeLogData(data[key]);
      }
    }
    return sanitized;
  }

  return data;
}

class AppLogger {
  private isEnabled: boolean = true;

  private formatHeader(tag: LogTag, level: LogLevel, icon: string): string {
    const time = new Date().toLocaleTimeString('es-PE', { hour12: false });
    return `${icon} [${time}] [${tag}]`;
  }

  debug(tag: LogTag, message: string, ...args: any[]): void {
    if (__DEV__ && this.isEnabled) {
      const sanitizedArgs = args.map(sanitizeLogData);
      console.log(`${this.formatHeader(tag, 'DEBUG', '🔍')} ${sanitizeLogData(message)}`, ...sanitizedArgs);
    }
  }

  info(tag: LogTag, message: string, ...args: any[]): void {
    if (this.isEnabled) {
      const sanitizedArgs = args.map(sanitizeLogData);
      console.log(`${this.formatHeader(tag, 'INFO', 'ℹ️')} ${sanitizeLogData(message)}`, ...sanitizedArgs);
    }
  }

  warn(tag: LogTag, message: string, ...args: any[]): void {
    if (this.isEnabled) {
      const sanitizedArgs = args.map(sanitizeLogData);
      console.warn(`${this.formatHeader(tag, 'WARN', '⚠️')} ${sanitizeLogData(message)}`, ...sanitizedArgs);
    }
  }

  error(tag: LogTag, message: string, error?: any, ...args: any[]): void {
    if (this.isEnabled) {
      const errDetail =
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : error
          ? JSON.stringify(sanitizeLogData(error))
          : '';
      const sanitizedArgs = args.map(sanitizeLogData);
      console.error(
        `${this.formatHeader(tag, 'ERROR', '❌')} ${sanitizeLogData(message)} ${errDetail}`.trim(),
        ...sanitizedArgs
      );
    }
  }

  /**
   * Registro estructurado de eventos de ciclo de vida (montaje de pantalla, cambios de estado)
   */
  lifecycle(tag: LogTag, event: string, details?: Record<string, any>): void {
    if (__DEV__ && this.isEnabled) {
      const detailStr = details ? ` | ${JSON.stringify(sanitizeLogData(details))}` : '';
      console.log(`${this.formatHeader(tag, 'INFO', '🔄')} [LIFECYCLE] ${event}${detailStr}`);
    }
  }

  /**
   * Rastrea una petición HTTP con tiempo de respuesta y resultado estructurado
   */
  traceRequest(method: string, url: string) {
    const startTime = Date.now();
    const cleanUrl = sanitizeLogData(url);
    this.info('API', `🌐 [${method.toUpperCase()}] ${cleanUrl}`);

    return {
      done: (status: number, dataSize?: number) => {
        const elapsed = Date.now() - startTime;
        const sizeInfo = dataSize !== undefined ? ` | ~${dataSize}B` : '';
        const icon = status >= 200 && status < 300 ? '✅' : '⚠️';
        this.info(
          'API',
          `${icon} [${method.toUpperCase()}] ${cleanUrl} -> HTTP ${status} (${elapsed}ms${sizeInfo})`
        );
      },
      fail: (error: any) => {
        const elapsed = Date.now() - startTime;
        const errMsg = error?.message || (typeof error === 'string' ? error : 'Error desconocido');
        this.error(
          'API',
          `❌ [${method.toUpperCase()}] ${cleanUrl} -> Falló tras ${elapsed}ms: ${sanitizeLogData(errMsg)}`
        );
      },
    };
  }

  /**
   * Trazabilidad estructurada para subida de evidencia multimedia
   */
  traceUpload(url: string, fileName: string, mimeType: string) {
    const startTime = Date.now();
    const cleanUrl = sanitizeLogData(url);
    this.info('MEDIA', `📤 [UPLOAD] Iniciando transferencia: ${fileName} (${mimeType}) -> ${cleanUrl}`);

    return {
      progress: (percent: number, loaded: number, total: number) => {
        this.debug('MEDIA', `⏳ [UPLOAD] Progreso: ${percent}% (${loaded}/${total} bytes)`);
      },
      done: (status: number, result?: any) => {
        const elapsed = Date.now() - startTime;
        this.info(
          'MEDIA',
          `✅ [UPLOAD] Completado en ${elapsed}ms (HTTP ${status}) para ${fileName}`,
          sanitizeLogData(result)
        );
      },
      fail: (error: any) => {
        const elapsed = Date.now() - startTime;
        const errMsg = error?.message || (typeof error === 'string' ? error : 'Error desconocido');
        this.error(
          'MEDIA',
          `❌ [UPLOAD] Falló tras ${elapsed}ms para ${fileName}: ${sanitizeLogData(errMsg)}`
        );
      },
    };
  }
}

export const logger = new AppLogger();
export default logger;
