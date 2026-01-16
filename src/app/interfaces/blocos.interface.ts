export interface Blocos {
    // Informações Básicas
    periodo: string;
    possuiDesfiles: boolean;
    statusDoDesfile: string;
    justificativaStatus?: string;
    numeroInscricao: string;
    nomeDoBloco: string;
    categoriaDoBloco: string;
    autorizaDivulgacao: boolean;
    dataCadastroModificacao: Date;
    primeiroCadastro: boolean;

    // Informações de Público
    publicoAnterior?: number;
    publicoDeclarado: number;
    publicoPlanejado?: number;
    observacoesAnoAnterior?: string;

    // Características do Bloco
    perfil: string;
    estiloDeMusica: string;
    descricaoDoBloco: string;

    // Informações de Data e Horário
    dataDoDesfile: Date;
    horarioDeconcentracao: string;
    inicioDoDesfile: string;
    horarioEncerramento: string;
    duracaoDoDesfile: string;
    horarioDispersao: string;

    // Equipamentos e Dimensões
    equipamentosUtilizados: string[];
    larguraMetros: number;
    comprimentoMetros: number;
    alturaMetros: number;
    potenciaWatts: number;
    dimensaoDeVeiculos?: string;

    // Localização e Percurso
    percurso: string;
    regional: string;
    enderecoDeConcentracao: string;
    bairroDeConcentracao: string;
    enderecoDeDispersao: string;
    bairroDeDispersao: string;
    extensaoDoDesfileMetros: number;
    numeroDeQuadras: number;
    areaDoTrajetoM2: number;
    capacidadePublicoDoTrajeto: number;

    // Informações Adicionais
    informacoesAdicionais?: string;

    // Responsável Legal
    responsavelLegal: string;
    cnpj?: string;
    cpf?: string;
    email: string;
    telefone?: string;
    celular: string;

    // Responsável Secundário
    nomeResponsavelSecundario?: string;
    emailResponsavelSecundario?: string;
    celularContato2?: string;
}
