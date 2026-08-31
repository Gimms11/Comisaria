from typing import List, Optional, Dict, Tuple
from dataclasses import dataclass
from packages.shared.schemas.enums import ReportStatus, OfficerRole
from packages.shared.schemas.state_machine import TransitionOption

@dataclass
class TransitionRule:
    label: str
    allowed_roles: List[OfficerRole]
    min_note_length: int
    requires_evidence: bool
    requires_destination: bool
    color: str
    icon: str


class CrimeStateMachine:
    TRANSITIONS: Dict[Tuple[ReportStatus, ReportStatus], TransitionRule] = {
        (ReportStatus.PENDIENTE, ReportStatus.EN_REVISION): TransitionRule(
            label='Tomar Caso', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.OPERADOR],
            min_note_length=5, requires_evidence=False, requires_destination=False, color='sky', icon='eye'
        ),
        (ReportStatus.PENDIENTE, ReportStatus.RECHAZADO): TransitionRule(
            label='Rechazar Denuncia', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.OPERADOR],
            min_note_length=15, requires_evidence=False, requires_destination=False, color='red', icon='x-circle'
        ),
        (ReportStatus.EN_REVISION, ReportStatus.EN_ATENCION): TransitionRule(
            label='Despachar Patrullaje', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.OPERADOR],
            min_note_length=5, requires_evidence=False, requires_destination=False, color='amber', icon='shield'
        ),
        (ReportStatus.EN_REVISION, ReportStatus.DERIVADO): TransitionRule(
            label='Derivar a Fiscalía / Depincri', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.OPERADOR],
            min_note_length=10, requires_evidence=False, requires_destination=True, color='purple', icon='send'
        ),
        (ReportStatus.EN_REVISION, ReportStatus.ARCHIVADO): TransitionRule(
            label='Archivar por Falta de Elementos', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO],
            min_note_length=20, requires_evidence=False, requires_destination=False, color='slate', icon='archive'
        ),
        (ReportStatus.EN_ATENCION, ReportStatus.RESUELTO): TransitionRule(
            label='Resolver Intervención', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.OPERADOR],
            min_note_length=10, requires_evidence=True, requires_destination=False, color='emerald', icon='check-circle'
        ),
        (ReportStatus.EN_ATENCION, ReportStatus.DERIVADO): TransitionRule(
            label='Poner a Disposición Fiscal', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.OPERADOR],
            min_note_length=10, requires_evidence=False, requires_destination=True, color='purple', icon='send'
        ),
        (ReportStatus.EN_ATENCION, ReportStatus.ARCHIVADO): TransitionRule(
            label='Archivar Patrullaje Infructuoso', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO],
            min_note_length=15, requires_evidence=False, requires_destination=False, color='slate', icon='archive'
        ),
        (ReportStatus.DERIVADO, ReportStatus.EN_ATENCION): TransitionRule(
            label='Diligencias Conjuntas', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.OPERADOR],
            min_note_length=5, requires_evidence=False, requires_destination=False, color='amber', icon='shield'
        ),
        (ReportStatus.DERIVADO, ReportStatus.RESUELTO): TransitionRule(
            label='Concluir con Constancia Fiscal', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO],
            min_note_length=10, requires_evidence=True, requires_destination=False, color='emerald', icon='check-circle'
        ),
        (ReportStatus.DERIVADO, ReportStatus.ARCHIVADO): TransitionRule(
            label='Archivo por Desestimación Fiscal', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO],
            min_note_length=15, requires_evidence=False, requires_destination=False, color='slate', icon='archive'
        ),
        (ReportStatus.RESUELTO, ReportStatus.EN_REVISION): TransitionRule(
            label='Reabrir Caso', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO],
            min_note_length=15, requires_evidence=False, requires_destination=False, color='sky', icon='rotate-ccw'
        ),
        (ReportStatus.ARCHIVADO, ReportStatus.EN_REVISION): TransitionRule(
            label='Desarchivar Caso', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO],
            min_note_length=15, requires_evidence=False, requires_destination=False, color='sky', icon='rotate-ccw'
        ),
        (ReportStatus.RECHAZADO, ReportStatus.EN_REVISION): TransitionRule(
            label='Reconsiderar Denuncia', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO],
            min_note_length=15, requires_evidence=False, requires_destination=False, color='sky', icon='rotate-ccw'
        ),
    }

    @staticmethod
    def get_available_transitions(current_status: ReportStatus, officer_role: OfficerRole) -> List[TransitionOption]:
        options = []
        for (origin, target), rule in CrimeStateMachine.TRANSITIONS.items():
            if origin == current_status and officer_role in rule.allowed_roles:
                options.append(TransitionOption(
                    target_status=target,
                    label=rule.label,
                    color=rule.color,
                    icon=rule.icon,
                    requires_evidence=rule.requires_evidence,
                    requires_destination=rule.requires_destination,
                    min_note_length=rule.min_note_length
                ))
        return options

    @staticmethod
    def validate_transition(
        current_status: ReportStatus,
        target_status: ReportStatus,
        officer_role: OfficerRole,
        note: str,
        evidence_count: int = 0,
        destination_entity: Optional[str] = None,
        document_number: Optional[str] = None
    ) -> None:
        transition = CrimeStateMachine.TRANSITIONS.get((current_status, target_status))
        if not transition:
            raise ValueError(f"Transición no válida de {current_status.value} a {target_status.value}.")
        
        if officer_role not in transition.allowed_roles:
            raise ValueError("No tiene permisos para realizar esta transición.")
            
        if len(note) < transition.min_note_length:
            raise ValueError(f"La nota debe tener al menos {transition.min_note_length} caracteres.")
            
        if transition.requires_evidence and evidence_count < 1:
            raise ValueError("Se requiere al menos una evidencia para esta transición.")
            
        if transition.requires_destination and (not destination_entity or not document_number):
            raise ValueError("Se requiere especificar la entidad de destino y el número de documento.")


class CommunityStateMachine:
    TRANSITIONS: Dict[Tuple[ReportStatus, ReportStatus], TransitionRule] = {
        (ReportStatus.PENDIENTE, ReportStatus.EN_REVISION): TransitionRule(
            label='Evaluar Reporte', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.OPERADOR, OfficerRole.MODERADOR],
            min_note_length=5, requires_evidence=False, requires_destination=False, color='sky', icon='eye'
        ),
        (ReportStatus.PENDIENTE, ReportStatus.DERIVADO): TransitionRule(
            label='Canalizar a Serenazgo / Municipio', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.OPERADOR, OfficerRole.MODERADOR],
            min_note_length=5, requires_evidence=False, requires_destination=True, color='purple', icon='send'
        ),
        (ReportStatus.PENDIENTE, ReportStatus.RECHAZADO): TransitionRule(
            label='Descartar Reporte', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.OPERADOR, OfficerRole.MODERADOR],
            min_note_length=10, requires_evidence=False, requires_destination=False, color='red', icon='x-circle'
        ),
        (ReportStatus.EN_REVISION, ReportStatus.DERIVADO): TransitionRule(
            label='Derivar a Entidad Competente', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.OPERADOR, OfficerRole.MODERADOR],
            min_note_length=5, requires_evidence=False, requires_destination=True, color='purple', icon='send'
        ),
        (ReportStatus.EN_REVISION, ReportStatus.EN_ATENCION): TransitionRule(
            label='Inspección en Campo', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.OPERADOR, OfficerRole.MODERADOR],
            min_note_length=5, requires_evidence=False, requires_destination=False, color='amber', icon='shield'
        ),
        (ReportStatus.EN_REVISION, ReportStatus.ARCHIVADO): TransitionRule(
            label='Archivar Reporte', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.MODERADOR],
            min_note_length=10, requires_evidence=False, requires_destination=False, color='slate', icon='archive'
        ),
        (ReportStatus.DERIVADO, ReportStatus.EN_ATENCION): TransitionRule(
            label='Cuadrilla en Sitio', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.OPERADOR, OfficerRole.MODERADOR],
            min_note_length=5, requires_evidence=False, requires_destination=False, color='amber', icon='shield'
        ),
        (ReportStatus.DERIVADO, ReportStatus.RESUELTO): TransitionRule(
            label='Falla Subsanada por Entidad', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.OPERADOR, OfficerRole.MODERADOR],
            min_note_length=10, requires_evidence=True, requires_destination=False, color='emerald', icon='check-circle'
        ),
        (ReportStatus.DERIVADO, ReportStatus.ARCHIVADO): TransitionRule(
            label='No Procedente', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.MODERADOR],
            min_note_length=10, requires_evidence=False, requires_destination=False, color='slate', icon='archive'
        ),
        (ReportStatus.EN_ATENCION, ReportStatus.RESUELTO): TransitionRule(
            label='Trabajo Concluido', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.OPERADOR, OfficerRole.MODERADOR],
            min_note_length=10, requires_evidence=True, requires_destination=False, color='emerald', icon='check-circle'
        ),
        (ReportStatus.EN_ATENCION, ReportStatus.DERIVADO): TransitionRule(
            label='Re-canalizar a Otra Entidad', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.OPERADOR, OfficerRole.MODERADOR],
            min_note_length=5, requires_evidence=False, requires_destination=True, color='purple', icon='send'
        ),
        (ReportStatus.EN_ATENCION, ReportStatus.ARCHIVADO): TransitionRule(
            label='Inviable Técnicamente', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.MODERADOR],
            min_note_length=10, requires_evidence=False, requires_destination=False, color='slate', icon='archive'
        ),
        (ReportStatus.RESUELTO, ReportStatus.EN_REVISION): TransitionRule(
            label='Reclamación Vecinal', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.MODERADOR],
            min_note_length=10, requires_evidence=False, requires_destination=False, color='sky', icon='rotate-ccw'
        ),
        (ReportStatus.ARCHIVADO, ReportStatus.EN_REVISION): TransitionRule(
            label='Reabrir Reporte', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.MODERADOR],
            min_note_length=10, requires_evidence=False, requires_destination=False, color='sky', icon='rotate-ccw'
        ),
        (ReportStatus.RECHAZADO, ReportStatus.EN_REVISION): TransitionRule(
            label='Reconsiderar Reporte', allowed_roles=[OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.MODERADOR],
            min_note_length=10, requires_evidence=False, requires_destination=False, color='sky', icon='rotate-ccw'
        ),
    }

    @staticmethod
    def get_available_transitions(current_status: ReportStatus, officer_role: OfficerRole) -> List[TransitionOption]:
        options = []
        for (origin, target), rule in CommunityStateMachine.TRANSITIONS.items():
            if origin == current_status and officer_role in rule.allowed_roles:
                options.append(TransitionOption(
                    target_status=target,
                    label=rule.label,
                    color=rule.color,
                    icon=rule.icon,
                    requires_evidence=rule.requires_evidence,
                    requires_destination=rule.requires_destination,
                    min_note_length=rule.min_note_length
                ))
        return options

    @staticmethod
    def validate_transition(
        current_status: ReportStatus,
        target_status: ReportStatus,
        officer_role: OfficerRole,
        note: str,
        evidence_count: int = 0,
        destination_entity: Optional[str] = None,
        document_number: Optional[str] = None
    ) -> None:
        transition = CommunityStateMachine.TRANSITIONS.get((current_status, target_status))
        if not transition:
            raise ValueError(f"Transición no válida de {current_status.value} a {target_status.value}.")
        
        if officer_role not in transition.allowed_roles:
            raise ValueError("No tiene permisos para realizar esta transición.")
            
        if len(note) < transition.min_note_length:
            raise ValueError(f"La nota debe tener al menos {transition.min_note_length} caracteres.")
            
        if transition.requires_evidence and evidence_count < 1:
            raise ValueError("Se requiere al menos una evidencia para esta transición.")
            
        if transition.requires_destination and (not destination_entity or not document_number):
            raise ValueError("Se requiere especificar la entidad de destino y el número de documento.")
