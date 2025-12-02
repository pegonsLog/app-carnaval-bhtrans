import { Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { BlocosService } from '../../services/blocos';
import { AuthService } from '../../services/auth.service';
import { Blocos } from '../../interfaces/blocos.interface';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroFolder, heroCloudArrowUp, heroClock, heroTrash, heroChartBar, heroEllipsisHorizontal, heroXMark } from '@ng-icons/heroicons/outline';


@Component({
  selector: 'app-excel-upload',
  imports: [CommonModule, NgIcon],
  viewProviders: [provideIcons({ heroFolder, heroCloudArrowUp, heroClock, heroTrash, heroChartBar, heroEllipsisHorizontal, heroXMark })],
  templateUrl: './excel-upload.html',
  styleUrl: './excel-upload.scss'
})
export class ExcelUploadComponent {
  excelData: any[] = [];
  fileName = '';
  headers: string[] = [];
  isSaving = false;
  saveMessage = '';
  saveMessageType: 'success' | 'error' | '' = '';

  // Colunas ordenadas (mesma sequência da lista de blocos)
  displayColumns = [
    { key: 'Nome Do Bloco', label: 'Nome do Bloco' },
    { key: 'Data Do Desfile', label: 'Data Desfile' },
    { key: 'Regional', label: 'Regional' },
    { key: 'Periodo', label: 'Período' },
    { key: 'Público Anterior', label: 'Público Anterior' },
    { key: 'Público Declarado', label: 'Público Declarado' },
    { key: 'Possui Desfiles?', label: 'Possui Desfiles' },
    { key: 'Status do Desfile', label: 'Status' },
    { key: 'Justificativa Status', label: 'Justificativa' },
    { key: 'Nº de Inscrição', label: 'Nº Inscrição' },
    { key: 'Categoria Do Bloco', label: 'Categoria' },
    { key: 'Autoriza Divulgação', label: 'Autoriza Divulgação' },
    { key: 'Data de Cadastro ou Modificação', label: 'Data Cadastro' },
    { key: 'Primeiro Cadastro?', label: 'Primeiro Cadastro' },
    { key: 'Observações Ano Anterior', label: 'Obs. Ano Anterior' },
    { key: 'Perfil', label: 'Perfil' },
    { key: 'Estilo de Música', label: 'Estilo Musical' },
    { key: 'Descrição Do Bloco', label: 'Descrição' },
    { key: 'Horário Deconcentração', label: 'Concentração' },
    { key: 'Início Do Desfile', label: 'Início' },
    { key: 'Horário Encerramento', label: 'Encerramento' },
    { key: 'Duração Do Desfile', label: 'Duração' },
    { key: 'Horário Dispersão', label: 'Dispersão' },
    { key: 'Equipamentos Utilizados', label: 'Equipamentos' },
    { key: 'Largura Metros', label: 'Largura (m)' },
    { key: 'Comprimento Metros', label: 'Comprimento (m)' },
    { key: 'Altura Metros', label: 'Altura (m)' },
    { key: 'Potência Watts', label: 'Potência (W)' },
    { key: 'Dimensão De Veículos', label: 'Dimensão Veículos' },
    { key: 'Percurso', label: 'Percurso' },
    { key: 'Endereço De Concentração', label: 'End. Concentração' },
    { key: 'Bairro De Concentração', label: 'Bairro Concentração' },
    { key: 'Endereço De Dispersão', label: 'End. Dispersão' },
    { key: 'Bairro De Dispersão', label: 'Bairro Dispersão' },
    { key: 'Extensão Do Desfile Metros', label: 'Extensão (m)' },
    { key: 'Número De Quadras', label: 'Nº Quadras' },
    { key: 'Área Do Trajeto M²', label: 'Área (m²)' },
    { key: 'Capacidade Público Do Trajeto', label: 'Capacidade' },
    { key: 'Informações Adicionais', label: 'Info. Adicionais' },
    { key: 'Responsável Legal', label: 'Responsável' },
    { key: 'CNPJ', label: 'CNPJ' },
    { key: 'CPF', label: 'CPF' },
    { key: 'E Mail', label: 'E-mail' },
    { key: 'Telefone', label: 'Telefone' },
    { key: 'Celular', label: 'Celular' },
    { key: 'Nome Responsável Secundário', label: 'Resp. Secundário' },
    { key: 'Celular Contato 2', label: 'Celular 2' }
  ];

  // Progresso do salvamento
  progressoAtual = 0;
  progressoTotal = 0;
  progressoNovos = 0;
  progressoAtualizados = 0;

  // Controle do tooltip
  activeTooltip: { rowIndex: number; header: string } | null = null;
  tooltipContent = '';

  // Exclusão em massa
  isDeleting = false;
  deleteProgressoAtual = 0;
  deleteProgressoTotal = 0;
  showDeleteConfirm = false;

  constructor(
    private blocosService: BlocosService,
    private ngZone: NgZone,
    public authService: AuthService
  ) { }

  // Função auxiliar para parsear datas do Excel
  private parseExcelDate(dateValue: any): Date {
    if (!dateValue) {
      return new Date();
    }

    // Se já for um objeto Date válido
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return dateValue;
    }

    // Se for um número (serial do Excel)
    if (typeof dateValue === 'number') {
      // Excel usa 1/1/1900 como base (com bug do ano bissexto)
      const excelEpoch = new Date(1899, 11, 30);
      return new Date(excelEpoch.getTime() + dateValue * 86400000);
    }

    // Se for string, tenta diferentes formatos
    if (typeof dateValue === 'string') {
      const trimmed = dateValue.trim();

      // Formato dd/mm/yyyy ou dd-mm-yyyy
      const brMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (brMatch) {
        const [, day, month, year] = brMatch;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }

      // Formato yyyy-mm-dd ou yyyy/mm/dd
      const isoMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
      if (isoMatch) {
        const [, year, month, day] = isoMatch;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }

      // Tenta o parse padrão do JavaScript
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    // Se nada funcionar, retorna a data atual
    console.warn('Não foi possível parsear a data:', dateValue);
    return new Date();
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.fileName = file.name;
      this.saveMessage = '';
      const reader = new FileReader();

      reader.onload = (e: any) => {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Pega a primeira planilha
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Converte para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        // Filtra apenas registros com status "APROVADO"
        const dadosFiltrados = jsonData.filter((row: any) => {
          const status = (row['Status do Desfile'] || '').toString().toUpperCase().trim();
          return status === 'APROVADO';
        });

        // Ordena por nome do bloco
        this.excelData = dadosFiltrados.sort((a: any, b: any) => {
          const nomeA = (a['Nome Do Bloco'] || '').toLowerCase();
          const nomeB = (b['Nome Do Bloco'] || '').toLowerCase();
          return nomeA.localeCompare(nomeB, 'pt-BR');
        });

        // Extrai os headers (nomes das colunas)
        if (this.excelData.length > 0) {
          this.headers = Object.keys(this.excelData[0]);
        }
      };

      reader.readAsBinaryString(file);
    }
  }

  // Mapeia os dados do Excel para a interface Blocos
  mapExcelDataToBlocos(excelRow: any): Blocos {
    const bloco: any = {
      periodo: excelRow['Periodo'] || '',
      possuiDesfiles: excelRow['Possui Desfiles?']?.toLowerCase() === 'sim',
      statusDoDesfile: excelRow['Status do Desfile'] || '',
      numeroInscricao: excelRow['Nº de Inscrição'] || '',
      nomeDoBloco: excelRow['Nome Do Bloco'] || '',
      categoriaDoBloco: excelRow['Categoria Do Bloco'] || '',
      autorizaDivulgacao: excelRow['Autoriza Divulgação']?.toLowerCase() === 'sim',
      dataCadastroModificacao: this.parseExcelDate(excelRow['Data de Cadastro ou Modificação']),
      primeiroCadastro: excelRow['Primeiro Cadastro?']?.toLowerCase() === 'sim',

      publicoDeclarado: parseInt(excelRow['Público Declarado']) || 0,

      perfil: excelRow['Perfil'] || '',
      estiloDeMusica: excelRow['Estilo de Música'] || '',
      descricaoDoBloco: excelRow['Descrição Do Bloco'] || '',

      dataDoDesfile: this.parseExcelDate(excelRow['Data Do Desfile']),
      horarioDeconcentracao: excelRow['Horário Deconcentração'] || '',
      inicioDoDesfile: excelRow['Início Do Desfile'] || '',
      horarioEncerramento: excelRow['Horário Encerramento'] || '',
      duracaoDoDesfile: excelRow['Duração Do Desfile'] || '',
      horarioDispersao: excelRow['Horário Dispersão'] || '',

      equipamentosUtilizados: excelRow['Equipamentos Utilizados'] ? excelRow['Equipamentos Utilizados'].split(',').map((e: string) => e.trim()) : [],
      larguraMetros: parseFloat(excelRow['Largura Metros']) || 0,
      comprimentoMetros: parseFloat(excelRow['Comprimento Metros']) || 0,
      alturaMetros: parseFloat(excelRow['Altura Metros']) || 0,
      potenciaWatts: parseFloat(excelRow['Potência Watts']) || 0,

      percurso: excelRow['Percurso'] || '',
      regional: excelRow['Regional'] || '',
      enderecoDeConcentracao: excelRow['Endereço De Concentração'] || '',
      bairroDeConcentracao: excelRow['Bairro De Concentração'] || '',
      enderecoDeDispersao: excelRow['Endereço De Dispersão'] || '',
      bairroDeDispersao: excelRow['Bairro De Dispersão'] || '',
      extensaoDoDesfileMetros: parseFloat(excelRow['Extensão Do Desfile Metros']) || 0,
      numeroDeQuadras: parseInt(excelRow['Número De Quadras']) || 0,
      areaDoTrajetoM2: parseFloat(excelRow['Área Do Trajeto M²']) || 0,
      capacidadePublicoDoTrajeto: parseInt(excelRow['Capacidade Público Do Trajeto']) || 0,

      responsavelLegal: excelRow['Responsável Legal'] || '',
      email: excelRow['E Mail'] || '',
      celular: excelRow['Celular'] || ''
    };

    // Adiciona campos opcionais apenas se tiverem valor
    if (excelRow['Justificativa Status']) {
      bloco.justificativaStatus = excelRow['Justificativa Status'];
    }

    if (excelRow['Público Anterior']) {
      const publicoAnterior = parseInt(excelRow['Público Anterior']);
      if (!isNaN(publicoAnterior)) {
        bloco.publicoAnterior = publicoAnterior;
      }
    }

    if (excelRow['Observações Ano Anterior']) {
      bloco.observacoesAnoAnterior = excelRow['Observações Ano Anterior'];
    }

    if (excelRow['Dimensão De Veículos']) {
      bloco.dimensaoDeVeiculos = excelRow['Dimensão De Veículos'];
    }

    if (excelRow['Informações Adicionais']) {
      bloco.informacoesAdicionais = excelRow['Informações Adicionais'];
    }

    if (excelRow['CNPJ']) {
      bloco.cnpj = excelRow['CNPJ'];
    }

    if (excelRow['CPF']) {
      bloco.cpf = excelRow['CPF'];
    }

    if (excelRow['Telefone']) {
      bloco.telefone = excelRow['Telefone'];
    }

    if (excelRow['Nome Responsável Secundário']) {
      bloco.nomeResponsavelSecundario = excelRow['Nome Responsável Secundário'];
    }

    if (excelRow['Celular Contato 2']) {
      bloco.celularContato2 = excelRow['Celular Contato 2'];
    }

    return bloco as Blocos;
  }

  async salvarNoFirestore() {
    if (this.excelData.length === 0) {
      this.saveMessage = 'Nenhum dado para salvar. Por favor, carregue um arquivo Excel primeiro.';
      this.saveMessageType = 'error';
      return;
    }

    this.isSaving = true;
    this.saveMessage = '';
    this.progressoAtual = 0;
    this.progressoTotal = this.excelData.length;
    this.progressoNovos = 0;
    this.progressoAtualizados = 0;

    try {
      // Mapear os dados do Excel para a interface Blocos
      const blocos: Blocos[] = this.excelData.map(row => this.mapExcelDataToBlocos(row));

      // Salvar no Firestore com callback de progresso
      const resultado = await this.blocosService.salvarBlocos(blocos, (atual, total, novos, atualizados) => {
        this.ngZone.run(() => {
          this.progressoAtual = atual;
          this.progressoTotal = total;
          this.progressoNovos = novos;
          this.progressoAtualizados = atualizados;
        });
      });

      this.ngZone.run(() => {
        let mensagem = `✓ Sucesso! ${resultado.total} registro(s) processado(s): ${resultado.novos} novo(s), ${resultado.atualizados} atualizado(s).`;
        if (resultado.mapasVinculados > 0) {
          mensagem += ` 🗺️ ${resultado.mapasVinculados} mapa(s) vinculado(s) automaticamente.`;
        }
        this.saveMessage = mensagem;
        this.saveMessageType = 'success';
        this.isSaving = false;
      });
    } catch (error) {
      console.error('Erro ao salvar no Firestore:', error);
      this.ngZone.run(() => {
        this.saveMessage = `✗ Erro ao salvar no Firestore: ${error}`;
        this.saveMessageType = 'error';
        this.isSaving = false;
      });
    }
  }

  get progressoPorcentagem(): number {
    if (this.progressoTotal === 0) return 0;
    return Math.round((this.progressoAtual / this.progressoTotal) * 100);
  }

  clearData() {
    this.excelData = [];
    this.fileName = '';
    this.headers = [];
    this.saveMessage = '';
    this.saveMessageType = '';
  }

  // Funções de truncamento e tooltip
  isTextLong(value: any): boolean {
    const text = String(value || '');
    return text.length > 30;
  }

  getTruncatedText(value: any): string {
    const text = String(value || '-');
    if (text.length > 30) {
      return text.substring(0, 30) + '...';
    }
    return text;
  }

  showTooltip(rowIndex: number, header: string, value: any) {
    this.activeTooltip = { rowIndex, header };
    this.tooltipContent = String(value || '-');
  }

  hideTooltip() {
    this.activeTooltip = null;
    this.tooltipContent = '';
  }

  isTooltipActive(rowIndex: number, header: string): boolean {
    return this.activeTooltip?.rowIndex === rowIndex && this.activeTooltip?.header === header;
  }

  // Exclusão em massa - apenas admin
  abrirConfirmacaoExclusao() {
    this.showDeleteConfirm = true;
  }

  fecharConfirmacaoExclusao() {
    this.showDeleteConfirm = false;
  }

  async excluirTodosBlocos() {
    this.showDeleteConfirm = false;
    this.isDeleting = true;
    this.deleteProgressoAtual = 0;
    this.deleteProgressoTotal = 0;

    try {
      const total = await this.blocosService.excluirTodosBlocos((atual, total) => {
        this.ngZone.run(() => {
          this.deleteProgressoAtual = atual;
          this.deleteProgressoTotal = total;
        });
      });

      this.ngZone.run(() => {
        this.saveMessage = `✓ ${total} bloco(s) excluído(s) com sucesso!`;
        this.saveMessageType = 'success';
        this.isDeleting = false;
      });
    } catch (error) {
      console.error('Erro ao excluir blocos:', error);
      this.ngZone.run(() => {
        this.saveMessage = `✗ Erro ao excluir blocos: ${error}`;
        this.saveMessageType = 'error';
        this.isDeleting = false;
      });
    }
  }

  get deleteProgressoPorcentagem(): number {
    if (this.deleteProgressoTotal === 0) return 0;
    return Math.round((this.deleteProgressoAtual / this.deleteProgressoTotal) * 100);
  }
}
