"""
Seed script — Populates the database with the current semester data (202631).
Run once after database creation, or to reset to known state.
"""
from datetime import datetime
from sqlmodel import Session
from app.db.database import engine, create_db
from app.db.models import Subject, Session as ClassSession, Activity, ActivityStatus, ActivityType, Priority


def seed():
    create_db()

    with Session(engine) as db:
        # Check if already seeded
        existing = db.query(Subject).first()
        if existing:
            print("Database already seeded. Skipping.")
            return

        # ── ARQUITECTURA DE SOFTWARE ───────────────
        arq = Subject(name="Arquitectura de Software", short_name="Arq. Software", instructor="Jorge Castañeda", color="#4f8ef7")
        db.add(arq)
        db.flush()

        db.add(ClassSession(subject_id=arq.id, day_of_week=5, hour=20, minute=0, duration_hours=1.5, session_type="Clase sincrónica"))

        db.add_all([
            Activity(subject_id=arq.id, name="Act 1 - Conceptos básicos", activity_type=ActivityType.QUIZ, status=ActivityStatus.COMPLETED, completed_at=datetime(2026, 3, 1)),
            Activity(subject_id=arq.id, name="Act 2 - Definiendo arquitecturas", activity_type=ActivityType.TASK, status=ActivityStatus.COMPLETED, deadline=datetime(2026, 3, 15, 23, 59), completed_at=datetime(2026, 3, 14)),
            Activity(subject_id=arq.id, name="Act 3 - Tipos de arquitectura", activity_type=ActivityType.QUIZ, status=ActivityStatus.PENDING, deadline=datetime(2026, 3, 29, 23, 59), priority=Priority.HIGH),
            Activity(subject_id=arq.id, name="Act 4 - Diseñando arquitecturas", activity_type=ActivityType.TASK, status=ActivityStatus.PENDING, deadline=datetime(2026, 3, 29, 23, 59), priority=Priority.HIGH),
            Activity(subject_id=arq.id, name="Act 5 - Requerimientos de implementación", activity_type=ActivityType.QUIZ, status=ActivityStatus.PENDING, deadline=datetime(2026, 4, 12, 23, 59)),
            Activity(subject_id=arq.id, name="Act 6 - Aplicando Arquitecturas", activity_type=ActivityType.TASK, status=ActivityStatus.PENDING, deadline=datetime(2026, 4, 12, 23, 59)),
        ])

        # ── CÁLCULO INTEGRAL ───────────────────────
        cal = Subject(name="Cálculo Integral", short_name="Cálculo", instructor="Julián Páez", color="#7c63f7")
        db.add(cal)
        db.flush()

        db.add_all([
            ClassSession(subject_id=cal.id, day_of_week=1, hour=18, minute=30, duration_hours=1.5, session_type="Clase sincrónica"),
            ClassSession(subject_id=cal.id, day_of_week=3, hour=20, minute=0, duration_hours=1.5, session_type="Clase sincrónica"),
            ClassSession(subject_id=cal.id, day_of_week=5, hour=19, minute=0, duration_hours=1.0, session_type="Monitoria"),
        ])

        db.add_all([
            Activity(subject_id=cal.id, name="Act 1 - Derivación de funciones (Proctoring)", activity_type=ActivityType.QUIZ, status=ActivityStatus.PENDING, deadline=datetime(2026, 4, 5, 23, 59)),
            Activity(subject_id=cal.id, name="Act 2 - Antiderivadas", activity_type=ActivityType.TASK, status=ActivityStatus.PENDING, deadline=datetime(2026, 4, 5, 23, 59)),
            Activity(subject_id=cal.id, name="Act 3 - Integral indefinida (Proctoring)", activity_type=ActivityType.QUIZ, status=ActivityStatus.PENDING, deadline=datetime(2026, 4, 5, 23, 59)),
            Activity(subject_id=cal.id, name="Act 4 - Métodos de integración: sustitución y partes", activity_type=ActivityType.TASK, status=ActivityStatus.PENDING, deadline=datetime(2026, 5, 3, 23, 59)),
            Activity(subject_id=cal.id, name="Act 5 - Sustitución trigonométrica y fracciones parciales (Proctoring)", activity_type=ActivityType.QUIZ, status=ActivityStatus.PENDING, deadline=datetime(2026, 5, 3, 23, 59)),
            Activity(subject_id=cal.id, name="Test final (Proctoring)", activity_type=ActivityType.QUIZ, status=ActivityStatus.PENDING, deadline=datetime(2026, 6, 7, 23, 59)),
        ])

        # ── FUNDAMENTOS DE BASES DE DATOS ──────────
        bd = Subject(name="Fundamentos de Bases de Datos", short_name="Bases de Datos", instructor="Magda Fernández", color="#34d1bf")
        db.add(bd)
        db.flush()

        db.add(ClassSession(subject_id=bd.id, day_of_week=3, hour=20, minute=0, duration_hours=1.5, session_type="Clase sincrónica"))

        db.add_all([
            Activity(subject_id=bd.id, name="Act 1 - Introducción y conceptos", activity_type=ActivityType.QUIZ, status=ActivityStatus.COMPLETED, completed_at=datetime(2026, 3, 1)),
            Activity(subject_id=bd.id, name="Act 2 - Instrumentos de levantamiento", activity_type=ActivityType.TASK, status=ActivityStatus.COMPLETED, deadline=datetime(2026, 3, 15, 23, 59), completed_at=datetime(2026, 3, 14)),
            Activity(subject_id=bd.id, name="Act 3 - Modelos y sistemas gestores", activity_type=ActivityType.QUIZ, status=ActivityStatus.PENDING, deadline=datetime(2026, 3, 29, 23, 59), priority=Priority.HIGH),
            Activity(subject_id=bd.id, name="Act 4 - Modelo ER-SGBD", activity_type=ActivityType.TASK, status=ActivityStatus.PENDING, deadline=datetime(2026, 3, 29, 23, 59), priority=Priority.HIGH),
            Activity(subject_id=bd.id, name="Act 5 - Sistema Gestor de Bases de Datos", activity_type=ActivityType.QUIZ, status=ActivityStatus.PENDING, deadline=datetime(2026, 4, 12, 23, 59)),
            Activity(subject_id=bd.id, name="Act 6 - Diccionario de Datos", activity_type=ActivityType.TASK, status=ActivityStatus.PENDING, deadline=datetime(2026, 4, 12, 23, 59)),
        ])

        # ── MÉTODOS NUMÉRICOS ──────────────────────
        mn = Subject(name="Métodos Numéricos", short_name="Mét. Numéricos", instructor="Arturo Rayo", color="#f7944f")
        db.add(mn)
        db.flush()

        db.add_all([
            ClassSession(subject_id=mn.id, day_of_week=1, hour=20, minute=0, duration_hours=2.0, session_type="Clase sincrónica"),
            ClassSession(subject_id=mn.id, day_of_week=4, hour=20, minute=0, duration_hours=2.0, session_type="Clase sincrónica"),
            ClassSession(subject_id=mn.id, day_of_week=3, hour=20, minute=0, duration_hours=2.0, session_type="Tutoría"),
        ])

        db.add_all([
            Activity(subject_id=mn.id, name="Act 1 - Conceptos básicos, exactitud y precisión", activity_type=ActivityType.QUIZ, status=ActivityStatus.PENDING, deadline=datetime(2026, 4, 5, 23, 59)),
            Activity(subject_id=mn.id, name="Act 2 - Raíces de ecuaciones", activity_type=ActivityType.TASK, status=ActivityStatus.PENDING, deadline=datetime(2026, 4, 5, 23, 59)),
            Activity(subject_id=mn.id, name="Act 3 - Sistema de ecuaciones lineales y no lineales", activity_type=ActivityType.QUIZ, status=ActivityStatus.PENDING, deadline=datetime(2026, 5, 3, 23, 59)),
            Activity(subject_id=mn.id, name="Act 4 - Interpolación", activity_type=ActivityType.TASK, status=ActivityStatus.PENDING, deadline=datetime(2026, 5, 3, 23, 59)),
            Activity(subject_id=mn.id, name="Act 6 - Integración numérica y ecuaciones diferenciales", activity_type=ActivityType.TASK, status=ActivityStatus.PENDING, deadline=datetime(2026, 6, 7, 23, 59)),
            Activity(subject_id=mn.id, name="Postest - Evaluación integral", activity_type=ActivityType.QUIZ, status=ActivityStatus.PENDING, deadline=datetime(2026, 6, 14, 23, 59)),
        ])

        db.commit()
        print("Database seeded successfully.")
        print(f"  Subjects: 4")
        print(f"  Sessions: 8")
        print(f"  Activities: 24")


if __name__ == "__main__":
    seed()
