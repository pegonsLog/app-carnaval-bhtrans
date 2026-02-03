import { Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { BlocosService } from '../../services/blocos';
import { AuthService } from '../../services/auth.service';
import { Blocos } from '../../interfaces/blocos.interface';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroFolder, heroCloudArrowUp, heroClock, heroTrash, heroChartBar, heroEllipsisHorizontal, heroXMark, heroExclamationTriangle, heroInformationCircle } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-excel-upload',
  imports: [CommonModule, NgIcon],
  viewProviders: [provideIcons({ heroFolder, heroCloudArrowUp, heroClock, heroTrash, heroChartBar, heroEllipsisHorizontal, heroXMark, heroExclamationTriangle, heroInformationCircle })],
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

  colunasEsperadas: string[] = [
    'periodo', 'possuiDesfiles', 'statusDoDesfile', 'justificativaStatus',
    'numeroInscricao', 'nomeDoBloco', 'categoriaDoBloco', 'autorizaDivulgacao',
    'dataCadastroModificacao', 'primeiroCadastro', 'publicoAnterior', 'publicoDeclarado',
    'publicoPlanejado', 'observacoesAnoAnterior', 'perfil', 'estiloDeMusica',
    'descricaoDoBloco', 'dataDoDesfile', 'horarioDeconcentracao', 'inicioDoDesfile',
    'horarioEncerramento', 'duracaoDoDesfile', 'horarioDispersao', 'equipamentosUtilizados',
    'larguraMetros', 'comprimentoMetros', 'alturaMetros', 'potenciaWatts',
    'dimensaoDeVeiculos', 'percurso', 'regional', 'enderecoDeConcentracao',
    'bairroDeConcentracao', 'enderecoDeDispersao', 'bairroDeDispersao',
    'extensaoDoDesfileMetros', 'numeroDeQuadras', 'areaDoTrajetoM2',
    'capacidadePublicoDoTrajeto', 'informacoesAdicionais', 'responsavelLegal',
    'cnpj', 'cpf', 'email', 'telefone', 'celular',
    'nomeResponsavelSecundario', 'emailResponsavelSecundario', 'celularContato2'
  ];

  displayColumns = [
    { key: 'nomeDoBloco', label: 'Nome do Bloco' },
    { key: 'dataDoDesfile', label: 'Data Desfile' },
    { key: 'regional', label: 'Regional' },
    { key: 'periodo', label: 'Período' },
    { key: 'publicoAnterior', label: 'Público Anterior' },
    { key: 'publicoDeclarado', label: 'Público Declarado' },
    { key: 'publicoPlanejado', label: 'Público Planejado' },
    { key: 'statusDoDesfile', label: 'Status' },
    { key: 'numeroInscricao', label: 'Nº Inscrição' },
    { key: 'categoriaDoBloco', label: 'Categoria' },
    { key: 'horarioDeconcentracao', label: 'Concentração' },
    { key: 'inicioDoDesfile', label: 'Início' },
    { key: 'horarioEncerramento', label: 'Encerramento' },
    { key: 'responsavelLegal', label: 'Responsável' },
    { key: 'celular', label: 'Celular' }
  ];

  progressoAtual = 0;
  progressoTotal = 0;
  progressoNovos = 0;
  progressoAtualizados = 0;
  activeTooltip: { rowIndex: number; header: string } | null = null;
  tooltipContent = '';
  isDeleting = false;
  deleteProgressoAtual = 0;
  deleteProgressoTotal = 0;
  showDeleteConfirm = false;
  showValidacaoModal = false;
  colunasFaltando: string[] = [];
  colunasExtras: string[] = [];
  showInfoColunasModal = false;

  constructor(
    private blocosService: BlocosService,
    private ngZone: NgZone,
    public authService: AuthService
  ) { }

  private validarColunas(colunasExcel: string[]): { valido: boolean; faltando: string[]; extras: string[] } {
    const colunasExcelSet = new Set(colunasExcel);
    const colunasEsperadasSet = new Set(this.colunasEsperadas);
    const faltando = this.colunasEsperadas.filter(col => !colunasExcelSet.has(col));
    const extras = colunasExcel.filter(col => !colunasEsperadasSet.has(col));
    return { valido: faltando.length === 0, faltando, extras };
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.fileName = file.name;
      this.saveMessage = '';
      this.excelData = [];
      this.headers = [];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Pega os headers diretamente da primeira linha (inclui colunas vazias)
        const headersArray = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 })[0] || [];
        const colunasExcel = headersArray.map((col: any) => String(col || '').trim()).filter(col => col !== '');
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });
        if (jsonData.length === 0) {
          this.saveMessage = 'A planilha está vazia.';
          this.saveMessageType = 'error';
          return;
        }
        
        const validacao = this.validarColunas(colunasExcel);
        if (!validacao.valido) {
          this.colunasFaltando = validacao.faltando;
          this.colunasExtras = validacao.extras;
          this.showValidacaoModal = true;
          return;
        }
        this.processarDadosExcel(jsonData);
      };
      reader.readAsBinaryString(file);
    }
  }

  private processarDadosExcel(jsonData: unknown[]) {
    // Normaliza as chaves removendo espaços extras
    const dadosNormalizados = jsonData.map((row: any) => {
      const novoRow: any = {};
      Object.keys(row).forEach(key => {
        novoRow[key.trim()] = row[key];
      });
      return novoRow;
    });

    const dadosFiltrados = dadosNormalizados.filter((row: any) => {
      const status = (row['statusDoDesfile'] || '').toString().toUpperCase().trim();
      return status === 'APROVADO' || status === 'ALTERADO';
    });
    this.excelData = dadosFiltrados.sort((a: any, b: any) => {
      const nomeA = (a['nomeDoBloco'] || '').toLowerCase();
      const nomeB = (b['nomeDoBloco'] || '').toLowerCase();
      return nomeA.localeCompare(nomeB, 'pt-BR');
    });
    if (this.excelData.length > 0) {
      this.headers = Object.keys(this.excelData[0]);
    }
    if (this.excelData.length === 0) {
      this.saveMessage = 'Nenhum bloco com status "APROVADO" ou "ALTERADO" encontrado.';
      this.saveMessageType = 'error';
    }
  }

  fecharValidacaoModal() {
    this.showValidacaoModal = false;
    this.colunasFaltando = [];
    this.colunasExtras = [];
    this.fileName = '';
  }

  copiarColunasEsperadas() {
    const texto = this.colunasEsperadas.join('\n');
    navigator.clipboard.writeText(texto).then(() => {
      this.saveMessage = 'Lista de colunas copiada!';
      this.saveMessageType = 'success';
      setTimeout(() => { this.saveMessage = ''; this.saveMessageType = ''; }, 2000);
    });
  }

  abrirInfoColunas() { this.showInfoColunasModal = true; }
  fecharInfoColunas() { this.showInfoColunasModal = false; }

  private parseExcelDate(dateValue: any): Date {
    if (!dateValue) return new Date();
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) return dateValue;
    if (typeof dateValue === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      return new Date(excelEpoch.getTime() + dateValue * 86400000);
    }
    if (typeof dateValue === 'string') {
      const trimmed = dateValue.trim();
      const brMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (brMatch) {
        return new Date(parseInt(brMatch[3]), parseInt(brMatch[2]) - 1, parseInt(brMatch[1]));
      }
      const isoMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
      if (isoMatch) {
        return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
      }
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }

  mapExcelDataToBlocos(excelRow: any): Blocos {
    const bloco: any = {
      periodo: excelRow['periodo'] || '',
      possuiDesfiles: (excelRow['possuiDesfiles'] || '').toString().toLowerCase() === 'sim',
      statusDoDesfile: excelRow['statusDoDesfile'] || '',
      numeroInscricao: excelRow['numeroInscricao'] || '',
      nomeDoBloco: excelRow['nomeDoBloco'] || '',
      categoriaDoBloco: excelRow['categoriaDoBloco'] || '',
      autorizaDivulgacao: (excelRow['autorizaDivulgacao'] || '').toString().toLowerCase() === 'sim',
      dataCadastroModificacao: this.parseExcelDate(excelRow['dataCadastroModificacao']),
      primeiroCadastro: (excelRow['primeiroCadastro'] || '').toString().toLowerCase() === 'sim',
      publicoDeclarado: parseInt(excelRow['publicoDeclarado']) || 0,
      perfil: excelRow['perfil'] || '',
      estiloDeMusica: excelRow['estiloDeMusica'] || '',
      descricaoDoBloco: excelRow['descricaoDoBloco'] || '',
      dataDoDesfile: this.parseExcelDate(excelRow['dataDoDesfile']),
      horarioDeconcentracao: excelRow['horarioDeconcentracao'] || '',
      inicioDoDesfile: excelRow['inicioDoDesfile'] || '',
      horarioEncerramento: excelRow['horarioEncerramento'] || '',
      duracaoDoDesfile: excelRow['duracaoDoDesfile'] || '',
      horarioDispersao: excelRow['horarioDispersao'] || '',
      equipamentosUtilizados: excelRow['equipamentosUtilizados'] ? excelRow['equipamentosUtilizados'].split(',').map((e: string) => e.trim()) : [],
      larguraMetros: parseFloat(excelRow['larguraMetros']) || 0,
      comprimentoMetros: parseFloat(excelRow['comprimentoMetros']) || 0,
      alturaMetros: parseFloat(excelRow['alturaMetros']) || 0,
      potenciaWatts: parseFloat(excelRow['potenciaWatts']) || 0,
      percurso: excelRow['percurso'] || '',
      regional: excelRow['regional'] || '',
      enderecoDeConcentracao: excelRow['enderecoDeConcentracao'] || '',
      bairroDeConcentracao: excelRow['bairroDeConcentracao'] || '',
      enderecoDeDispersao: excelRow['enderecoDeDispersao'] || '',
      bairroDeDispersao: excelRow['bairroDeDispersao'] || '',
      extensaoDoDesfileMetros: parseFloat(excelRow['extensaoDoDesfileMetros']) || 0,
      numeroDeQuadras: parseInt(excelRow['numeroDeQuadras']) || 0,
      areaDoTrajetoM2: parseFloat(excelRow['areaDoTrajetoM2']) || 0,
      capacidadePublicoDoTrajeto: parseInt(excelRow['capacidadePublicoDoTrajeto']) || 0,
      responsavelLegal: excelRow['responsavelLegal'] || '',
      email: excelRow['email'] || '',
      celular: excelRow['celular'] || ''
    };
    if (excelRow['justificativaStatus']) bloco.justificativaStatus = excelRow['justificativaStatus'];
    if (excelRow['publicoAnterior']) {
      const v = parseInt(excelRow['publicoAnterior']);
      if (!isNaN(v)) bloco.publicoAnterior = v;
    }
    if (excelRow['publicoPlanejado']) {
      const v = parseInt(excelRow['publicoPlanejado']);
      if (!isNaN(v)) bloco.publicoPlanejado = v;
    }
    if (excelRow['observacoesAnoAnterior']) bloco.observacoesAnoAnterior = excelRow['observacoesAnoAnterior'];
    if (excelRow['dimensaoDeVeiculos']) bloco.dimensaoDeVeiculos = excelRow['dimensaoDeVeiculos'];
    if (excelRow['informacoesAdicionais']) bloco.informacoesAdicionais = excelRow['informacoesAdicionais'];
    if (excelRow['cnpj']) bloco.cnpj = excelRow['cnpj'];
    if (excelRow['cpf']) bloco.cpf = excelRow['cpf'];
    if (excelRow['telefone']) bloco.telefone = excelRow['telefone'];
    if (excelRow['nomeResponsavelSecundario']) bloco.nomeResponsavelSecundario = excelRow['nomeResponsavelSecundario'];
    if (excelRow['emailResponsavelSecundario']) bloco.emailResponsavelSecundario = excelRow['emailResponsavelSecundario'];
    if (excelRow['celularContato2']) bloco.celularContato2 = excelRow['celularContato2'];
    return bloco as Blocos;
  }

  async salvarNoFirestore() {
    if (this.excelData.length === 0) {
      this.saveMessage = 'Nenhum dado para salvar.';
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
      const blocos: Blocos[] = this.excelData.map(row => this.mapExcelDataToBlocos(row));
      const resultado = await this.blocosService.salvarBlocos(blocos, (atual, total, novos, atualizados) => {
        this.ngZone.run(() => {
          this.progressoAtual = atual;
          this.progressoTotal = total;
          this.progressoNovos = novos;
          this.progressoAtualizados = atualizados;
        });
      });
      this.ngZone.run(() => {
        let msg = `Sucesso! ${resultado.total} processado(s): ${resultado.novos} novo(s), ${resultado.atualizados} atualizado(s).`;
        if (resultado.mapasVinculados > 0) msg += ` ${resultado.mapasVinculados} mapa(s) vinculado(s).`;
        this.saveMessage = msg;
        this.saveMessageType = 'success';
        this.isSaving = false;
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      this.ngZone.run(() => {
        this.saveMessage = `Erro ao salvar: ${error}`;
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

  isTextLong(value: any): boolean { return String(value || '').length > 30; }
  getTruncatedText(value: any): string {
    const text = String(value || '-');
    return text.length > 30 ? text.substring(0, 30) + '...' : text;
  }

  showTooltip(rowIndex: number, header: string, value: any) {
    this.activeTooltip = { rowIndex, header };
    this.tooltipContent = String(value || '-');
  }
  hideTooltip() { this.activeTooltip = null; this.tooltipContent = ''; }
  isTooltipActive(rowIndex: number, header: string): boolean {
    return this.activeTooltip?.rowIndex === rowIndex && this.activeTooltip?.header === header;
  }

  abrirConfirmacaoExclusao() { this.showDeleteConfirm = true; }
  fecharConfirmacaoExclusao() { this.showDeleteConfirm = false; }

  async excluirTodosBlocos() {
    this.showDeleteConfirm = false;
    this.isDeleting = true;
    this.deleteProgressoAtual = 0;
    this.deleteProgressoTotal = 0;
    try {
      const total = await this.blocosService.excluirTodosBlocos((atual, tot) => {
        this.ngZone.run(() => {
          this.deleteProgressoAtual = atual;
          this.deleteProgressoTotal = tot;
        });
      });
      this.ngZone.run(() => {
        this.saveMessage = `${total} bloco(s) excluído(s)!`;
        this.saveMessageType = 'success';
        this.isDeleting = false;
      });
    } catch (error) {
      console.error('Erro ao excluir:', error);
      this.ngZone.run(() => {
        this.saveMessage = `Erro ao excluir: ${error}`;
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
