import { Platform } from 'react-native';
import { API_CONFIG } from '@/config/api.config';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface FetchOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiFetch<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { timeoutMs = API_CONFIG.TIMEOUT_MS, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = new Headers(fetchOptions.headers || {});
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }
    if (
      fetchOptions.body &&
      typeof fetchOptions.body === 'string' &&
      !headers.has('Content-Type')
    ) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      let errorMessage = `Error HTTP ${response.status}: ${response.statusText}`;
      if (data && typeof data === 'object') {
        if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMessage = data.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
        } else if (typeof data.message === 'string') {
          errorMessage = data.message;
        }
      }
      throw new ApiError(errorMessage, response.status, data);
    }

    return data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ApiError(
        'Tiempo de espera agotado al conectar con el servidor',
        408
      );
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error.message || 'Error de red o conexión no disponible',
      0
    );
  }
}

export async function apiUploadFile<T>(
  url: string,
  fileUri: string,
  fieldName: string = 'file',
  fileName: string = 'evidencia.jpg',
  mimeType: string = 'image/jpeg',
  timeoutMs: number = 60000
): Promise<T> {
  console.log('[UploadTrace] ========================================');
  console.log('[UploadTrace] 📤 Iniciando transferencia multipart');
  console.log('[UploadTrace] 🎯 URL Destino:', url);
  console.log('[UploadTrace] 📱 Plataforma:', Platform.OS);
  console.log('[UploadTrace] 📁 Archivo Local URI:', fileUri);
  console.log('[UploadTrace] 🏷️ Nombre:', fileName, '| Tipo:', mimeType);
  console.log('[UploadTrace] ========================================');

  if (Platform.OS === 'web') {
    try {
      const res = await fetch(fileUri);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append(fieldName, blob, fileName);

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });

      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        let msg = `Error HTTP ${response.status}`;
        if (data && typeof data === 'object') {
          msg = data.detail || data.message || msg;
        }
        console.error('[UploadTrace] ❌ Error Web:', msg);
        throw new ApiError(msg, response.status, data);
      }

      console.log('[UploadTrace] ✅ Subida Web exitosa:', data);
      return data as T;
    } catch (err: any) {
      console.error('[UploadTrace] ❌ Fallo en subida Web:', err);
      if (err instanceof ApiError) throw err;
      throw new ApiError(err.message || 'Error al subir archivo en Web', 0);
    }
  }

  // En Android / iOS usamos XMLHttpRequest nativo
  // El motor nativo de React Native procesa { uri, name, type } directamente en Java / Obj-C
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.timeout = timeoutMs;
    xhr.setRequestHeader('Accept', 'application/json');

    const formData = new FormData();
    // @ts-ignore
    formData.append(fieldName, {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    });

    if (xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          console.log(`[UploadTrace] ⏳ Progreso: ${percent}% (${event.loaded}/${event.total} bytes)`);
        }
      };
    }

    xhr.onload = () => {
      console.log(`[UploadTrace] 📥 Respuesta del servidor recibida (HTTP ${xhr.status})`);
      let parsedData: any;
      try {
        parsedData = JSON.parse(xhr.responseText);
      } catch {
        parsedData = xhr.responseText;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        console.log('[UploadTrace] ✅ Evidencia multimedia cargada con éxito:', parsedData);
        resolve(parsedData as T);
      } else {
        let errMsg = `Error HTTP ${xhr.status}: ${xhr.statusText || 'Fallo de subida'}`;
        if (parsedData && typeof parsedData === 'object') {
          if (typeof parsedData.detail === 'string') errMsg = parsedData.detail;
          else if (Array.isArray(parsedData.detail)) errMsg = parsedData.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
          else if (typeof parsedData.message === 'string') errMsg = parsedData.message;
        }
        console.error('[UploadTrace] ❌ Error en servidor al procesar foto:', errMsg);
        reject(new ApiError(errMsg, xhr.status, parsedData));
      }
    };

    xhr.onerror = (err) => {
      console.error('[UploadTrace] ❌ Error de red XMLHttpRequest:', err);
      reject(new ApiError('Error de red al subir archivo a través de la pasarela', 0, err));
    };

    xhr.ontimeout = () => {
      console.error('[UploadTrace] ❌ Timeout excedido tras', timeoutMs, 'ms');
      reject(new ApiError('Tiempo de espera agotado al subir archivo', 408));
    };

    console.log('[UploadTrace] 🚀 Enviando paquete XMLHttpRequest al backend...');
    xhr.send(formData);
  });
}

