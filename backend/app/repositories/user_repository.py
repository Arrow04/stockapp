"""Persistence for the ``auth_users`` table.

Database-agnostic repository built on SQLAlchemy Core. Supports SQLite (local
dev / tests) and PostgreSQL (production) through a single ``database_url``.
Passwords are stored already hashed; hashing is a service/core concern.
"""
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    Table,
    MetaData,
    create_engine,
    insert,
    select,
    update,
)
from sqlalchemy.engine import Engine


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class UserRepository:
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.engine: Engine = create_engine(
            database_url,
            future=True,
            connect_args={"check_same_thread": False} if database_url.startswith("sqlite") else {},
        )
        self.metadata = MetaData()
        self.users = Table(
            "auth_users",
            self.metadata,
            Column("id", Integer, primary_key=True, autoincrement=True),
            Column("email", String(255), unique=True, nullable=False),
            Column("name", String(255), nullable=False),
            Column("password_hash", String(512), nullable=False),
            Column("role", String(50), nullable=False, default="user"),
            Column("totp_secret", String(255), nullable=True),
            Column("is_2fa_enabled", Integer, nullable=False, default=0),
            Column("is_active", Integer, nullable=False, default=1),
            Column("created_at", String(64), nullable=False),
            Column("last_login", String(64), nullable=True),
        )
        self.metadata.create_all(self.engine)

    def _row_to_dict(self, row) -> dict | None:
        return dict(row._mapping) if row is not None else None

    def init_db(self, admin_email: str, admin_name: str, admin_password_hash: str):
        """Create the table (done in __init__) and seed admin if missing."""
        with self.engine.begin() as conn:
            row = conn.execute(
                select(self.users.c.id).where(self.users.c.email == admin_email.lower())
            ).first()
            if not row:
                conn.execute(
                    insert(self.users).values(
                        email=admin_email.lower(),
                        name=admin_name,
                        password_hash=admin_password_hash,
                        role="admin",
                        is_2fa_enabled=0,
                        is_active=1,
                        created_at=_now(),
                    )
                )

    def get_by_email(self, email: str):
        with self.engine.begin() as conn:
            row = conn.execute(
                select(self.users).where(self.users.c.email == email.lower())
            ).first()
            return self._row_to_dict(row)

    def get_by_id(self, uid: int):
        with self.engine.begin() as conn:
            row = conn.execute(select(self.users).where(self.users.c.id == uid)).first()
            return self._row_to_dict(row)

    def create_user(self, email: str, name: str, password_hash: str, role: str = "user"):
        with self.engine.begin() as conn:
            result = conn.execute(
                insert(self.users).values(
                    email=email.lower(),
                    name=name,
                    password_hash=password_hash,
                    role=role,
                    is_2fa_enabled=0,
                    is_active=1,
                    created_at=_now(),
                )
            )
            uid = result.inserted_primary_key[0]
        return self.get_by_id(uid)

    def update_last_login(self, uid: int):
        with self.engine.begin() as conn:
            conn.execute(
                update(self.users).where(self.users.c.id == uid).values(last_login=_now())
            )

    def set_2fa(self, uid: int, secret: str):
        with self.engine.begin() as conn:
            conn.execute(
                update(self.users)
                .where(self.users.c.id == uid)
                .values(totp_secret=secret, is_2fa_enabled=1)
            )

    def disable_2fa(self, uid: int):
        with self.engine.begin() as conn:
            conn.execute(
                update(self.users)
                .where(self.users.c.id == uid)
                .values(totp_secret=None, is_2fa_enabled=0)
            )

    def list_all(self):
        with self.engine.begin() as conn:
            rows = conn.execute(select(self.users).order_by(self.users.c.id)).fetchall()
            return [self._row_to_dict(r) for r in rows]
