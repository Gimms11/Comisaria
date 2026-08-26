from enum import Enum


class OfficerRole(str, Enum):
    ADMIN = "admin"
    COMISARIO = "comisario"
    OPERADOR = "operador"
    MODERADOR = "moderador"


class ReportType(str, Enum):
    DENUNCIA_ANONIMA = "denuncia_anonima"
    REPORTE_COMUNITARIO = "reporte_comunitario"


class ReportStatus(str, Enum):
    PENDIENTE = "pendiente"
    EN_REVISION = "en_revision"
    EN_ATENCION = "en_atencion"
    DERIVADO = "derivado"
    RESUELTO = "resuelto"
    ARCHIVADO = "archivado"
    RECHAZADO = "rechazado"


class ReportPriority(str, Enum):
    BAJA = "baja"
    MEDIA = "media"
    ALTA = "alta"
    URGENTE = "urgente"


class MediaType(str, Enum):
    FOTO = "foto"
    VIDEO = "video"
    AUDIO = "audio"


class GuideContentType(str, Enum):
    VIDEO = "video"
    ARTICULO = "articulo"
    MIXTO = "mixto"


class GuideResourceType(str, Enum):
    VIDEO = "video"
    TEXTO = "texto"
    IMAGEN = "imagen"
    ENLACE = "enlace"
