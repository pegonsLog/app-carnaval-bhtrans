import { Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { LinhaTcService } from '../../services/linha-tc.service';
import { AuthService } from '../../services/auth.service';
import { LinhaTc } from '../../interfaces/linha-tc.interface';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroFolder, heroCloudArrowUp, heroClock, heroTrash, heroChartBar, heroEllipsisHorizontal, heroXMark, heroExclamationTriangle, heroInformationCircle } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-linha-tc-upload',
  imports: [CommonModule, NgIcon],
  viewProviders: [provideIcons({ heroFolder, heroCloudArrowUp, heroClock, heroTrash, heroChartBar, heroEllipsisHorizontal, heroXMark, heroExclamationTriangle, heroInformationCircle })],
  templateUrl: './linha-tc-upload.html',
  styleUrl: './linha-tc-upload.scss'
})
export class LinhaTcUploadComponent {
  excelData: any[] = [];
  fileName = '';
  headers: string[] = [];
  isSaving = false;
  saveMessage = '';
  saveMessageType: 'success' | 'error' | '' = '';

  colunasEsperadas: string[] = ['linhaDestino', 'pc', 'itinerario', 'pedsAtivados'];

  displayColumns = [
    { key: 'linhaDestino', label: 'Linha/Destino' },
    { key: 'pc', label: 'PC' },
    { key: 'itinerario', label: 'Itinerário' },
    { key: 'pedsAtivados', label: 'PEDs Ativados' }
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
    private linhaTcService: LinhaTcService,
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
    const dadosNormalizados = jsonData.map((row: any) => {
      const novoRow: any = {};
      Object.keys(row).forEach(key => {
        novoRow[key.trim()] = row[key];
      });
      return novoRow;
    });

    this.excelData = dadosNormalizados.sort((a: any, b: any) => {
      const linhaA = (a['linhaDestino'] || '').toLowerCase();
      const linhaB = (b['linhaDestino'] || '').toLowerCase();
      return linhaA.localeCompare(linhaB, 'pt-BR');
    });

    if (this.excelData.length > 0) {
      this.headers = Object.keys(this.excelData[0]);
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

  mapExcelDataToLinhaTc(excelRow: any): LinhaTc {
    return {
      linhaDestino: excelRow['linhaDestino'] || '',
      pc: excelRow['pc'] || '',
      itinerario: excelRow['itinerario'] || '',
      pedsAtivados: excelRow['pedsAtivados'] || ''
    };
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
      const linhas: LinhaTc[] = this.excelData.map(row => this.mapExcelDataToLinhaTc(row));
      const resultado = await this.linhaTcService.salvarLinhasTc(linhas, (atual, total, novos, atualizados) => {
        this.ngZone.run(() => {
          this.progressoAtual = atual;
          this.progressoTotal = total;
          this.progressoNovos = novos;
          this.progressoAtualizados = atualizados;
        });
      });
      this.ngZone.run(() => {
        this.saveMessage = `Sucesso! ${resultado.total} processado(s): ${resultado.novos} novo(s), ${resultado.atualizados} atualizado(s).`;
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

  isTextLong(value: any): boolean { return String(value || '').length > 50; }
  getTruncatedText(value: any): string {
    const text = String(value || '-');
    return text.length > 50 ? text.substring(0, 50) + '...' : text;
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

  async excluirTodasLinhas() {
    this.showDeleteConfirm = false;
    this.isDeleting = true;
    this.deleteProgressoAtual = 0;
    this.deleteProgressoTotal = 0;
    try {
      const total = await this.linhaTcService.excluirTodasLinhasTc((atual, tot) => {
        this.ngZone.run(() => {
          this.deleteProgressoAtual = atual;
          this.deleteProgressoTotal = tot;
        });
      });
      this.ngZone.run(() => {
        this.saveMessage = `${total} linha(s) excluída(s)!`;
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
