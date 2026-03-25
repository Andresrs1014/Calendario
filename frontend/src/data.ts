// Datos completos del semestre 202631 - Universidad Ibero

export interface Sesion {
  dia: number;       // 0=Dom, 1=Lun, ... 6=Sáb
  hora: number;
  min: number;
  durHoras: number;
  tipo: string;
  monitoria?: boolean;
}

export interface Actividad {
  nombre: string;
  tipo: 'Quiz' | 'Tarea';
  estado: 'entregada' | 'pendiente';
  fecha: string | null; // ISO date string or null
}

export interface Materia {
  id: string;
  nombre: string;
  profesor: string;
  color: string;
  colorClass: string;
  sesiones: Sesion[];
  actividades: Actividad[];
}

export const MATERIAS: Materia[] = [
  {
    id: 'arquitectura',
    nombre: 'Arquitectura de Software',
    profesor: 'Jorge Castañeda',
    color: '#4f8ef7',
    colorClass: 'ev-arq',
    sesiones: [
      { dia: 5, hora: 20, min: 0, durHoras: 1.5, tipo: 'Clase sincrónica' }
    ],
    actividades: [
      { nombre: 'Act 1 - Conceptos básicos', tipo: 'Quiz', estado: 'entregada', fecha: null },
      { nombre: 'Act 2 - Definiendo arquitecturas', tipo: 'Tarea', estado: 'entregada', fecha: '2026-03-15T23:59:00' },
      { nombre: 'Act 3 - Tipos de arquitectura', tipo: 'Quiz', estado: 'pendiente', fecha: '2026-03-29T23:59:00' },
      { nombre: 'Act 4 - Diseñando arquitecturas', tipo: 'Tarea', estado: 'pendiente', fecha: '2026-03-29T23:59:00' },
      { nombre: 'Act 5 - Requerimientos de implementación', tipo: 'Quiz', estado: 'pendiente', fecha: '2026-04-12T23:59:00' },
      { nombre: 'Act 6 - Aplicando Arquitecturas', tipo: 'Tarea', estado: 'pendiente', fecha: '2026-04-12T23:59:00' }
    ]
  },
  {
    id: 'calculo',
    nombre: 'Cálculo Integral',
    profesor: 'Julián Páez',
    color: '#7c63f7',
    colorClass: 'ev-cal',
    sesiones: [
      { dia: 1, hora: 18, min: 30, durHoras: 1.5, tipo: 'Clase sincrónica' },
      { dia: 3, hora: 20, min: 0, durHoras: 1.5, tipo: 'Clase sincrónica' },
      { dia: 5, hora: 19, min: 0, durHoras: 1, tipo: 'Monitoria', monitoria: true }
    ],
    actividades: [
      { nombre: 'Act 1 - Derivación de funciones (Proctoring)', tipo: 'Quiz', estado: 'pendiente', fecha: '2026-04-05T23:59:00' },
      { nombre: 'Act 2 - Antiderivadas', tipo: 'Tarea', estado: 'pendiente', fecha: '2026-04-05T23:59:00' },
      { nombre: 'Act 3 - Integral indefinida (Proctoring)', tipo: 'Quiz', estado: 'pendiente', fecha: '2026-04-05T23:59:00' },
      { nombre: 'Act 4 - Métodos de integración: sustitución y partes', tipo: 'Tarea', estado: 'pendiente', fecha: '2026-05-03T23:59:00' },
      { nombre: 'Act 5 - Sustitución trigonométrica y fracciones parciales (Proctoring)', tipo: 'Quiz', estado: 'pendiente', fecha: '2026-05-03T23:59:00' },
      { nombre: 'Test final (Proctoring)', tipo: 'Quiz', estado: 'pendiente', fecha: '2026-06-07T23:59:00' }
    ]
  },
  {
    id: 'bases',
    nombre: 'Fundamentos de Bases de Datos',
    profesor: 'Magda Fernández',
    color: '#34d1bf',
    colorClass: 'ev-bd',
    sesiones: [
      { dia: 3, hora: 20, min: 0, durHoras: 1.5, tipo: 'Clase sincrónica' }
    ],
    actividades: [
      { nombre: 'Act 1 - Introducción y conceptos', tipo: 'Quiz', estado: 'entregada', fecha: null },
      { nombre: 'Act 2 - Instrumentos de levantamiento', tipo: 'Tarea', estado: 'entregada', fecha: '2026-03-15T23:59:00' },
      { nombre: 'Act 3 - Modelos y sistemas gestores', tipo: 'Quiz', estado: 'pendiente', fecha: '2026-03-29T23:59:00' },
      { nombre: 'Act 4 - Modelo ER-SGBD', tipo: 'Tarea', estado: 'pendiente', fecha: '2026-03-29T23:59:00' },
      { nombre: 'Act 5 - Sistema Gestor de Bases de Datos', tipo: 'Quiz', estado: 'pendiente', fecha: '2026-04-12T23:59:00' },
      { nombre: 'Act 6 - Diccionario de Datos', tipo: 'Tarea', estado: 'pendiente', fecha: '2026-04-12T23:59:00' }
    ]
  },
  {
    id: 'metodos',
    nombre: 'Métodos Numéricos',
    profesor: 'Arturo Rayo',
    color: '#f7944f',
    colorClass: 'ev-mn',
    sesiones: [
      { dia: 1, hora: 20, min: 0, durHoras: 2, tipo: 'Clase sincrónica' },
      { dia: 4, hora: 20, min: 0, durHoras: 2, tipo: 'Clase sincrónica' },
      { dia: 3, hora: 20, min: 0, durHoras: 2, tipo: 'Tutoría', monitoria: true }
    ],
    actividades: [
      { nombre: 'Act 1 - Conceptos básicos, exactitud y precisión', tipo: 'Quiz', estado: 'pendiente', fecha: '2026-04-05T23:59:00' },
      { nombre: 'Act 2 - Raíces de ecuaciones', tipo: 'Tarea', estado: 'pendiente', fecha: '2026-04-05T23:59:00' },
      { nombre: 'Act 3 - Sistema de ecuaciones lineales y no lineales', tipo: 'Quiz', estado: 'pendiente', fecha: '2026-05-03T23:59:00' },
      { nombre: 'Act 4 - Interpolación', tipo: 'Tarea', estado: 'pendiente', fecha: '2026-05-03T23:59:00' },
      { nombre: 'Act 6 - Integración numérica y ecuaciones diferenciales', tipo: 'Tarea', estado: 'pendiente', fecha: '2026-06-07T23:59:00' },
      { nombre: 'Postest - Evaluación integral', tipo: 'Quiz', estado: 'pendiente', fecha: '2026-06-14T23:59:00' }
    ]
  }
];

export const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const DIAS_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const HORAS = [18, 19, 20, 21, 22];
