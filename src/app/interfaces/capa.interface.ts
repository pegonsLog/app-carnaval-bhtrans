export interface Capa {
  id?: string;
  gerencia: string;
  elaboradoPor: string;
  dataElaboracao: string;
  responsavel: string;
  regionais: string[];
  dataCriacao?: Date;
  dataAtualizacao?: Date;
}
