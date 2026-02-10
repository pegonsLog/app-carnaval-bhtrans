import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LinhaTcService } from '../../services/linha-tc.service';
import { AuthService } from '../../services/auth.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroEllipsisHorizontal, heroXMark, heroMagnifyingGlass, heroArrowUpTray, heroPencilSquare } from '@ng-icons/heroicons/outline';
import { LinhaTc } from '../../interfaces/linha-tc.interface';

@Component({
  selector: 'app-linha-tc-list',
  imports: [CommonModule, FormsModule, NgIcon, RouterLink],
  viewProviders: [provideIcons({ heroEllipsisHorizontal, heroXMark, heroMagnifyingGlass, heroArrowUpTray, heroPencilSquare })],
  templateUrl: './linha-tc-list.html',
  styleUrl: './linha-tc-list.scss'
})
export class LinhaTcListComponent implements OnInit {
  linhas: any[] = [];
  linhasFiltradas: any[] = [];
  linhasExibidas: any[] = [];
  isLoading = true;
  isLoadingTodas = false;
  errorMessage = '';
  limitePaginacao = 20;
  todasCarregadas = false;

  filtroLinhaDestino = '';
  filtroPc = '';
  filtroLivre = '';

  activeTooltip: { rowIndex: number; field: string } | null = null;
  tooltipContent = '';

  // Edição
  editModalOpen = false;
  linhaEmEdicao: any = null;
  editForm: LinhaTc = { linhaDestino: '', pc: '', itinerario: '', pedsAtivados: '' };
  isSaving = false;
  editError = '';

  displayColumns = [
    { key: 'linhaDestino', label: 'Linha/Destino' },
    { key: 'pc', label: 'PC' },
    { key: 'itinerario', label: 'Itinerário' },
    { key: 'pedsAtivados', label: 'PEDs Ativados' }
  ];

  constructor(
    private linhaTcService: LinhaTcService,
    private ngZone: NgZone,
    public authService: AuthService
  ) { }

  ngOnInit() {
    this.carregarLinhas();
  }

  async carregarLinhas() {
    this.isLoading = true;
    this.errorMessage = '';
    this.todasCarregadas = false;

    try {
      const todasLinhas = await this.linhaTcService.getLinhasTc();
      this.ngZone.run(() => {
        this.linhas = this.ordenarLinhas(todasLinhas);
        this.linhasFiltradas = this.linhas;
        this.linhasExibidas = this.linhas.slice(0, this.limitePaginacao);
        this.todasCarregadas = true;
        this.isLoading = false;
      });
    } catch (error: any) {
      console.error('Erro ao carregar linhas:', error);
      this.ngZone.run(() => {
        this.errorMessage = error?.message || 'Erro ao carregar as linhas. Verifique sua conexão.';
        this.isLoading = false;
      });
    }
  }

  private ordenarLinhas(linhas: any[]): any[] {
    return linhas.sort((a: any, b: any) => {
      const linhaA = (a.linhaDestino || '').toLowerCase();
      const linhaB = (b.linhaDestino || '').toLowerCase();
      const compareLinha = linhaA.localeCompare(linhaB, 'pt-BR');
      
      if (compareLinha !== 0) return compareLinha;
      
      const pcA = (a.pc || '').toLowerCase();
      const pcB = (b.pc || '').toLowerCase();
      return pcA.localeCompare(pcB, 'pt-BR');
    });
  }

  carregarMais() {
    this.linhasExibidas = [...this.linhasFiltradas];
  }

  private buscaEmTodosCampos(linha: any, termo: string): boolean {
    if (!termo) return true;
    const termoLower = termo.toLowerCase();
    return Object.values(linha).some(valor => {
      if (valor === null || valor === undefined) return false;
      return String(valor).toLowerCase().includes(termoLower);
    });
  }

  aplicarFiltros() {
    this.linhasFiltradas = this.linhas.filter(linha => {
      const linhaMatch = !this.filtroLinhaDestino ||
        (linha.linhaDestino || '').toLowerCase().includes(this.filtroLinhaDestino.toLowerCase());
      const pcMatch = !this.filtroPc ||
        (linha.pc || '').toLowerCase().includes(this.filtroPc.toLowerCase());
      const livreMatch = this.buscaEmTodosCampos(linha, this.filtroLivre);
      return linhaMatch && pcMatch && livreMatch;
    });
    this.linhasExibidas = this.linhasFiltradas.slice(0, this.limitePaginacao);
  }

  limparFiltros() {
    this.filtroLinhaDestino = '';
    this.filtroPc = '';
    this.filtroLivre = '';
    this.linhasFiltradas = this.linhas;
    this.linhasExibidas = this.linhas.slice(0, this.limitePaginacao);
  }

  isTextLong(value: any): boolean { return String(value || '').length > 60; }

  getTruncatedText(value: any): string {
    const text = String(value || '-');
    return text.length > 60 ? text.substring(0, 60) + '...' : text;
  }

  showTooltip(rowIndex: number, field: string, value: any) {
    this.activeTooltip = { rowIndex, field };
    this.tooltipContent = String(value || '-');
  }

  hideTooltip() {
    this.activeTooltip = null;
    this.tooltipContent = '';
  }

  isTooltipActive(rowIndex: number, field: string): boolean {
    return this.activeTooltip?.rowIndex === rowIndex && this.activeTooltip?.field === field;
  }

  // Métodos de edição
  abrirEdicao(linha: any) {
    this.linhaEmEdicao = linha;
    this.editForm = {
      linhaDestino: linha.linhaDestino || '',
      pc: linha.pc || '',
      itinerario: linha.itinerario || '',
      pedsAtivados: linha.pedsAtivados || ''
    };
    this.editError = '';
    this.editModalOpen = true;
  }

  fecharEdicao() {
    this.editModalOpen = false;
    this.linhaEmEdicao = null;
    this.editError = '';
    this.isSaving = false;
  }

  async salvarEdicao() {
    if (!this.linhaEmEdicao?.id) return;

    this.isSaving = true;
    this.editError = '';

    try {
      await this.linhaTcService.atualizarLinhaTc(this.linhaEmEdicao.id, this.editForm);

      this.ngZone.run(() => {
        // Atualiza localmente
        const index = this.linhas.findIndex(l => l.id === this.linhaEmEdicao.id);
        if (index !== -1) {
          this.linhas[index] = { ...this.linhas[index], ...this.editForm };
          this.aplicarFiltros();
        }
        this.fecharEdicao();
      });
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      this.ngZone.run(() => {
        this.editError = error?.message || 'Erro ao salvar alterações.';
        this.isSaving = false;
      });
    }
  }
}
