# Políticas de Seguridad y Privacidad

Reglas de protección de datos personales y salvaguarda del anonimato ciudadano para la plataforma distrital.

---

## 1. Privacidad en Denuncias Anónimas

- **Sin recolección de PII:** Prohibido solicitar nombre, documento de identidad (DNI), teléfono, email o dirección particular.
- **Sin huella digital ni tracking:**
  - Desactivar persistencia de dirección IP en logs de aplicación y base de datos para endpoints de denuncias anónimas.
  - No asociar identificadores persistentes del dispositivo móvil (IMEI, IDFV, Android ID).
- **Código anónimo:** Generación de identificador único público `LT-YYYY-XXXXXX`. El código secreto opcional solo se almacena computado mediante algoritmo criptográfico de un solo sentido (hash seguro).

---

## 2. Tratamiento Seguro de Archivos Multimedia

Antes de persistir cualquier imagen, video o audio:

1. **Eliminación estricta de metadatos EXIF/IPTC:** Limpieza completa de coordenadas GPS embebidas, modelo de cámara, número de serie del sensor y fecha/hora original.
2. **Compresión y estandarización:** Re-codificación del archivo en el cliente/servidor para eliminar cargas útiles ocultas (esteganografía o scripts maliciosos).
3. **Generación de miniaturas:** Creación de previsualizaciones de baja resolución para reducir transferencia de datos.
4. **Almacenamiento seguro desacoplado:** Custodia en bucket privado con acceso restringido.
5. **URLs firmadas temporales:** Los oficiales de policía solo pueden visualizar evidencias mediante enlaces firmados de vigencia corta (ej. expiración en 15 minutos).

---

## 3. Seguridad del Panel Policial

- **Autenticación robusta obligatoria:** Acceso exclusivo para oficiales registrados con contraseñas hasheadas (bcrypt con factor de costo adecuado o Argon2id).
- **Control de acceso basado en roles (RBAC):**
  - `admin`: Administración y altas de usuarios internos.
  - `comisario`: Supervisión estratégica y emisión de directivas.
  - `operador`: Atención operativa diaria y cambio de estados.
  - `moderador`: Verificación de reportes cívicos y contenidos.
- **Auditoría inmutable:** Todo cambio de estado, nota interna o visualización de expediente queda registrado con marca temporal y UUID del oficial actuante.
- **Canal seguro:** Obligatoriedad de HTTPS / TLS 1.3 en todas las comunicaciones.
- **Doble factor de autenticación (2FA):** Recomendado para cuentas de rol `admin` y `comisario`.
