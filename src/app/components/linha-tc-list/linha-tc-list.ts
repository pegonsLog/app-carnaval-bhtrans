import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LinhaTcService } from '../../services/linha-tc.service';
import { AuthService } from '../../services/auth.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroEllipsisHorizontal, heroXMark, heroMagnifyingGlass, heroArrowUpTray } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-linha-tc-list',
  imports: [CommonModule, FormsModule, NgIcon, RouterLink],
  viewProviders: [provideIcons({ heroEllipsisHorizontal, heroXMark, heroMagnifyingGlass, heroArrowUpTray })],
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
      return linhaA.localeCompare(linhaB, 'pt-BR');
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
}
