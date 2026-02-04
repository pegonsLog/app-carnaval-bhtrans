import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BlocosService } from '../../services/blocos';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroEye, heroTrash, heroMagnifyingGlass, heroXMark } from '@ng-icons/heroicons/outline';
import { BlocoDetalheComponent } from '../bloco-detalhe/bloco-detalhe';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal';

@Component({
  selector: 'app-blocos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon, BlocoDetalheComponent, ConfirmModalComponent],
  viewProviders: [provideIcons({ heroEye, heroTrash, heroMagnifyingGlass, heroXMark })],
  templateUrl: './blocos-admin.html',
  styleUrl: './blocos-admin.scss'
})
export class BlocosAdminComponent implements OnInit {
  blocos: any[] = [];
  blocosFiltrados: any[] = [];
  isLoading = true;
  errorMessage = '';

  // Filtros
  filtroNome = '';
  filtroStatus = '';
  statusDisponiveis: string[] = [];

  // Modal de detalhe
  blocoSelecionado: any = null;

  // Modal de exclusão
  blocoParaExcluir: any = null;
  excluindo = false;

  constructor(
    private blocosService: BlocosService,
    private ngZone: NgZone,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregarBlocos();
  }

  async carregarBlocos() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const blocos = await this.blocosService.getBlocos();
      this.ngZone.run(() => {
        this.blocos = this.ordenarBlocos(blocos);
        this.extrairStatus();
        this.aplicarFiltros();
        this.isLoading = false;
      });
    } catch (error: any) {
      console.error('Erro ao carregar blocos:', error);
      this.ngZone.run(() => {
        this.errorMessage = error?.message || 'Erro ao carregar os blocos.';
        this.isLoading = false;
      });
    }
  }

  private ordenarBlocos(blocos: any[]): any[] {
    return blocos.sort((a, b) => {
      const nomeA = (a.nomeDoBloco || '').toLowerCase();
      const nomeB = (b.nomeDoBloco || '').toLowerCase();
      return nomeA.localeCompare(nomeB, 'pt-BR');
    });
  }

  extrairStatus() {
    const status = new Set<string>();
    this.blocos.forEach(bloco => {
      if (bloco.statusDoDesfile && bloco.statusDoDesfile.trim()) {
        status.add(bloco.statusDoDesfile.trim());
      }
    });
    this.statusDisponiveis = Array.from(status).sort();
  }

  aplicarFiltros() {
    this.blocosFiltrados = this.blocos.filter(bloco => {
      const nomeMatch = !this.filtroNome ||
        (bloco.nomeDoBloco || '').toLowerCase().includes(this.filtroNome.toLowerCase());
      const statusMatch = !this.filtroStatus ||
        bloco.statusDoDesfile === this.filtroStatus;
      return nomeMatch && statusMatch;
    });
  }

  limparFiltros() {
    this.filtroNome = '';
    this.filtroStatus = '';
    this.aplicarFiltros();
  }

  formatarData(value: any): string {
    if (!value) return '-';
    try {
      const date = value.toDate ? value.toDate() : new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR');
      }
    } catch {
      return '-';
    }
    return '-';
  }

  abrirDetalhe(bloco: any) {
    this.blocoSelecionado = bloco;
  }

  fecharDetalhe() {
    this.blocoSelecionado = null;
  }

  abrirModalExcluir(bloco: any) {
    this.blocoParaExcluir = bloco;
  }

  fecharModalExcluir() {
    this.blocoParaExcluir = null;
  }

  async confirmarExclusao() {
    if (!this.blocoParaExcluir?.id) return;

    this.excluindo = true;
    try {
      await this.blocosService.excluirBloco(this.blocoParaExcluir.id);
      this.ngZone.run(() => {
        this.blocos = this.blocos.filter(b => b.id !== this.blocoParaExcluir.id);
        this.aplicarFiltros();
        this.blocoParaExcluir = null;
        this.excluindo = false;
      });
    } catch (error: any) {
      console.error('Erro ao excluir bloco:', error);
      alert(`Erro ao excluir: ${error.message}`);
      this.excluindo = false;
    }
  }

  voltarParaAdmin() {
    this.router.navigate(['/admin']);
  }
}
