/**
 * Sistema Unificado de Logging para la Aplicación Móvil
 * Proporciona trazabilidad detallada de peticiones de red, errores y eventos de ciclo de vida.
 */

type LogTag =
  | 'APP'
  | 'API'
  | 'AUTH'
  | 'COMMUNITY'
  | 'CRIME'
  | 'GUIDES'
  | 'MEDIA'
  | 'STORAGE'
  | 'LOCATION';

class AppLogger {
  private isEnabled: boolean = true;

  private formatHeader(tag: LogTag, level: string, icon: string): string {
    const time = new Date().toLocaleTimeString('es-PE', { hour12: false });
    return `${icon} [${time}] [${tag}]`;
  }

  debug(tag: LogTag, message: string, ...args: any[]): void {
    if (__DEV__ && this.isEnabled) {
      console.log(`${this.formatHeader(tag, 'DEBUG', '🔍')} ${message}`, ...args);
    }
  }

  info(tag: LogTag, message: string, ...args: any[]): void {
    if (this.isEnabled) {
      console.log(`${this.formatHeader(tag, 'INFO', 'ℹ️')} ${message}`, ...args);
    }
  }

  warn(tag: LogTag, message: string, ...args: any[]): void {
    if (this.isEnabled) {
      console.warn(`${this.formatHeader(tag, 'WARN', '⚠️')} ${message}`, ...args);
    }
  }

  error(tag: LogTag, message: string, error?: any, ...args: any[]): void {
    if (this.isEnabled) {
      const errDetail = error instanceof Error ? `${error.name}: ${error.message}` : error ? JSON.stringify(error) : '';
      console.error(`${this.formatHeader(tag, 'ERROR', '❌')} ${message} ${errDetail}`.trim(), ...args);
    }
  }

  /**
   * Rastrea una petición HTTP con tiempo de respuesta y resultado estructurado
   */
  traceRequest(method: string, url: string) {
    const startTime = Date.now();
    const cleanUrl = url.replace(/([?&]pin=)[^&]+/gi, '$1***');
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
          `❌ [${method.toUpperCase()}] ${cleanUrl} -> Falló tras ${elapsed}ms: ${errMsg}`
        );
      },
    };
  }
}

export const logger = new AppLogger();
export default logger;
