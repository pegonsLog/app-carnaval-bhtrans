export interface Usuario {
    id?: string;
    matricula: string;
    senha: string;
    area: 'GARBO' | 'GARNP' | 'GARNE' | 'GARVN' | 'GEACE' | 'OUTRAS';
    perfil: 'admin' | 'operador' | 'visualizador' | 'administrador';
}
