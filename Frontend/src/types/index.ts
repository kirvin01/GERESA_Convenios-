// src/types/index.ts

export interface Paciente {
    Abrev_Tipo_Doc: string;
    Numero_Documento: string;
    Fecha_Nacimiento: string;
    Genero: string;
    EDAD: number;
    id: string;
}

export interface Atencion {
    N: string;
    Id_Cita: string;
    F_ATENCION: string;
    Codigo_Item: string;
    Descripcion_Item: string;
    LAB1: string;
    LAB2: string;
    LAB3: string;
    F_REGISTRO: string;
    F_MODIFICACION: string | null;
    ESTABLECIMIENTO: string;
    'DISTRITO | PROVINCIA': string;
    SISTEMA: string | null;
    REGISTRADOR: string;
    id: string;
}

export interface NotificationState {
    key: number;
    severity: 'error' | 'info' | 'warning';
    message: string;
}

export interface User {
    id: number;
    username: string;
    role: string;
}