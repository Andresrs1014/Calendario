# Calendario Académico y Organizacional

Este proyecto es una plataforma diseñada para gestionar tiempos, cronogramas y tareas, orientada a fines académicos y organizacionales.

## Características principales
- Gestión de actividades y recordatorios
- Registro de logs de estudio
- Sincronización de datos
- Interfaz moderna y responsiva

## Estructura del proyecto

- **backend/**: API y lógica de negocio (Python, FastAPI)
- **frontend/**: Aplicación web (React + TypeScript + Tailwind CSS)
- **desktop/**: Cliente de escritorio (Electron)

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd <NOMBRE_DEL_REPOSITORIO>
```

### 2. Backend (API)

Requisitos: Python 3.10+

```bash
cd backend
python -m venv venv
# En Windows
venv\Scripts\activate
# En Linux/Mac
source venv/bin/activate
pip install -r requirements.txt
# Ejecutar la API
python main.py
```

### 3. Frontend (Web)

Requisitos: Node.js 18+

```bash
cd frontend
npm install
npm run dev
```

### 4. Desktop (Cliente de escritorio)

Requisitos: Node.js 18+

```bash
cd desktop
npm install
npm start
```

## Uso

- Accede a la aplicación web en [http://localhost:5173](http://localhost:5173) (por defecto)
- La API estará disponible en [http://localhost:8000](http://localhost:8000)

## Notas
- Para fines académicos y organizacionales.
- No incluye datos personales ni información sensible.

---

