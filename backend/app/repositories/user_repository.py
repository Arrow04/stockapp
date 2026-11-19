"""Persistence for the ``auth_users`` table.

All sqlite access lives in this class. Passwords are stored already hashed;
hashing is a service/core concern and never happens here.
"""
import sqlite3
from datetime import datetime


class UserRepository:
    def __init__(self, db_path: str):
        self.db_path = db_path

    def _conn(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self, admin_email: str, admin_name: str, admin_password_hash: str):
        """Create the table and seed the admin account if it is missing."""
        conn = self._conn()
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS auth_users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'user',
                    totp_secret TEXT,
                    is_2fa_enabled INTEGER NOT NULL DEFAULT 0,
                    is_active INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL,
                    last_login TEXT
                )
                """
            )
            conn.commit()
            row = conn.execute(
                "SELECT id FROM auth_users WHERE email=?", (admin_email,)
            ).fetchone()
            if not row:
                conn.execute(
                    """INSERT INTO auth_users
                       (email, name, password_hash, role, is_2fa_enabled, is_active, created_at)
                       VALUES (?,?,?,?,0,1,?)""",
                    (
                        admin_email.lower(),
                        admin_name,
                        admin_password_hash,
                        "admin",
                        datetime.utcnow().isoformat(),
                    ),
                )
                conn.commit()
        finally:
            conn.close()

    def get_by_email(self, email: str):
        conn = self._conn()
        try:
            row = conn.execute(
                "SELECT * FROM auth_users WHERE email=?", (email.lower(),)
            ).fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    def get_by_id(self, uid: int):
        conn = self._conn()
        try:
            row = conn.execute(
                "SELECT * FROM auth_users WHERE id=?", (uid,)
            ).fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    def create_user(self, email: str, name: str, password_hash: str, role: str = "user"):
        conn = self._conn()
        try:
            cur = conn.execute(
                """INSERT INTO auth_users
                   (email, name, password_hash, role, is_2fa_enabled, is_active, created_at)
                   VALUES (?,?,?,?,0,1,?)""",
                (
                    email.lower(),
                    name,
                    password_hash,
                    role,
                    datetime.utcnow().isoformat(),
                ),
            )
            conn.commit()
            uid = cur.lastrowid
        finally:
            conn.close()
        return self.get_by_id(uid)

    def update_last_login(self, uid: int):
        conn = self._conn()
        try:
            conn.execute(
                "UPDATE auth_users SET last_login=? WHERE id=?",
                (datetime.utcnow().isoformat(), uid),
            )
            conn.commit()
        finally:
            conn.close()

    def set_2fa(self, uid: int, secret: str):
        conn = self._conn()
        try:
            conn.execute(
                "UPDATE auth_users SET totp_secret=?, is_2fa_enabled=1 WHERE id=?",
                (secret, uid),
            )
            conn.commit()
        finally:
            conn.close()

    def disable_2fa(self, uid: int):
        conn = self._conn()
        try:
            conn.execute(
                "UPDATE auth_users SET totp_secret=NULL, is_2fa_enabled=0 WHERE id=?",
                (uid,),
            )
            conn.commit()
        finally:
            conn.close()

    def list_all(self):
        conn = self._conn()
        try:
            rows = conn.execute("SELECT * FROM auth_users ORDER BY id").fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()
