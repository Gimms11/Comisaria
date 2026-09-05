from typing import Annotated, List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from packages.shared.models.officer import Officer
from packages.shared.schemas.enums import OfficerRole
from packages.shared.security import hash_password, verify_password
from app.core.dependencies import get_current_officer, get_db, require_roles
from app.schemas.officer import (
    OfficerChangePassword,
    OfficerCreate,
    OfficerResponse,
    OfficerUpdate,
)

router = APIRouter(prefix="/officers", tags=["Gestión de Efectivos Policiales"])


@router.get("", response_model=List[OfficerResponse], include_in_schema=False, dependencies=[Depends(require_roles(OfficerRole.ADMIN, OfficerRole.COMISARIO))])
@router.get(
    "/",
    response_model=List[OfficerResponse],
    dependencies=[Depends(require_roles(OfficerRole.ADMIN, OfficerRole.COMISARIO))],
)
async def list_officers(
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = 0,
    limit: int = 100,
):
    """Lista todos los oficiales registrados (acceso: admin o comisario)."""
    query = select(Officer).offset(skip).limit(limit).order_by(Officer.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=OfficerResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False, dependencies=[Depends(require_roles(OfficerRole.ADMIN))])
@router.post(
    "/",
    response_model=OfficerResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(OfficerRole.ADMIN))],
)

async def create_officer(
    officer_in: OfficerCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Crea una nueva cuenta de oficial policial (acceso exclusivo: admin)."""
    # Verificar si el correo ya existe
    existing_query = select(Officer).where(Officer.email == officer_in.email.lower().strip())
    existing = await db.execute(existing_query)
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un oficial registrado con este correo electrónico",
        )

    new_officer = Officer(
        full_name=officer_in.full_name.strip(),
        email=officer_in.email.lower().strip(),
        password_hash=hash_password(officer_in.password),
        role=officer_in.role,
        is_active=True,
    )
    db.add(new_officer)
    await db.commit()
    await db.refresh(new_officer)
    return new_officer


@router.patch(
    "/{officer_id}",
    response_model=OfficerResponse,
    dependencies=[Depends(require_roles(OfficerRole.ADMIN))],
)
async def update_officer(
    officer_id: uuid.UUID,
    officer_update: OfficerUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Actualiza datos o estado de un oficial (acceso exclusivo: admin)."""
    query = select(Officer).where(Officer.id == officer_id)
    result = await db.execute(query)
    officer = result.scalar_one_or_none()

    if not officer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Oficial no encontrado",
        )

    if officer_update.full_name is not None:
        officer.full_name = officer_update.full_name.strip()
    if officer_update.role is not None:
        officer.role = officer_update.role
    if officer_update.is_active is not None:
        officer.is_active = officer_update.is_active

    await db.commit()
    await db.refresh(officer)
    return officer


@router.patch("/me/password", status_code=status.HTTP_200_OK)
async def change_password(
    pwd_data: OfficerChangePassword,
    current_officer: Annotated[Officer, Depends(get_current_officer)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Permite al oficial autenticado cambiar su contraseña."""
    if not verify_password(pwd_data.current_password, current_officer.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta",
        )

    current_officer.password_hash = hash_password(pwd_data.new_password)
    await db.commit()
    return {"message": "Contraseña actualizada exitosamente"}
