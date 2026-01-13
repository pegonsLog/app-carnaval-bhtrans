import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroPlus,
  heroPencil,
  heroTrash,
  heroXMark,
  heroEye,
} from '@ng-icons/heroicons/outline';
import { CapasService } from '../../services/capas';
import { BlocosService } from '../../services/blocos';
import { Capa } from '../../interfaces/capa.interface';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal';

@Component({
  selector: 'app-capas',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon, ConfirmModalComponent],
  viewProviders: [
    provideIcons({
      heroPlus,
      heroPencil,
      heroTrash,
      heroXMark,
      heroEye,
    }),
  ],
  templateUrl: './capas.html',
  styleUrl: './capas.scss',
})
export class CapasComponent implements OnInit {
  capas: Capa[] = [];
  isLoading = true;
  errorMessage = '';

  // Modal de formulário
  showFormModal = false;
  isEditing = false;
  capaAtual: Capa = { gerencia: '', elaboradoPor: '', dataElaboracao: '', responsavel: '', regionais: [] };
  novaRegional = '';

  // Modal de confirmação de exclusão
  capaParaExcluir: Capa | null = null;

  // Modal de visualização
  capaParaVisualizar: Capa | null = null;

  // Regionais disponíveis (extraídas dos blocos)
  regionaisDisponiveis: string[] = [];
  regionalSelecionada = '';

  constructor(
    private capasService: CapasService,
    private blocosService: BlocosService,
    private ngZone: NgZone
  ) { }

  ngOnInit() {
    this.carregarCapas();
    this.carregarRegionaisDisponiveis();
  }

  async carregarRegionaisDisponiveis() {
    try {
      const blocos = await this.blocosService.getBlocos();
      const regionaisSet = new Set<string>();
      blocos.forEach(bloco => {
        if (bloco.regional) {
          regionaisSet.add(bloco.regional);
        }
      });
      this.ngZone.run(() => {
        this.regionaisDisponiveis = Array.from(regionaisSet).sort();
      });
    } catch (error) {
      console.error('Erro ao carregar regionais:', error);
    }
  }

  async carregarCapas() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const capas = await this.capasService.getCapas();
      this.ngZone.run(() => {
        this.capas = capas;
        this.isLoading = false;
      });
    } catch (error: any) {
      this.ngZone.run(() => {
        this.errorMessage = error?.message || 'Erro ao carregar capas.';
        this.isLoading = false;
      });
    }
  }

  abrirFormNovo() {
    this.capaAtual = { gerencia: '', elaboradoPor: '', dataElaboracao: '', responsavel: '', regionais: [] };
    this.novaRegional = '';
    this.regionalSelecionada = '';
    this.isEditing = false;
    this.showFormModal = true;
  }

  abrirFormEditar(capa: Capa) {
    this.capaAtual = { ...capa, regionais: capa.regionais || [] };
    this.novaRegional = '';
    this.regionalSelecionada = '';
    this.isEditing = true;
    this.showFormModal = true;
  }

  fecharFormModal() {
    this.showFormModal = false;
    this.capaAtual = { gerencia: '', elaboradoPor: '', dataElaboracao: '', responsavel: '', regionais: [] };
    this.novaRegional = '';
    this.regionalSelecionada = '';
  }

  adicionarRegional() {
    const regional = this.regionalSelecionada || this.novaRegional.trim();
    if (regional && !this.capaAtual.regionais.includes(regional)) {
      this.capaAtual.regionais.push(regional);
      this.novaRegional = '';
      this.regionalSelecionada = '';
    }
  }

  removerRegional(index: number) {
    this.capaAtual.regionais.splice(index, 1);
  }

  async salvarCapa() {
    if (!this.capaAtual.gerencia || !this.capaAtual.elaboradoPor || !this.capaAtual.responsavel) {
      return;
    }

    try {
      if (this.isEditing && this.capaAtual.id) {
        await this.capasService.atualizarCapa(this.capaAtual.id, this.capaAtual);
      } else {
        await this.capasService.salvarCapa(this.capaAtual);
      }
      this.fecharFormModal();
      await this.carregarCapas();
    } catch (error: any) {
      console.error('Erro ao salvar capa:', error);
    }
  }

  abrirConfirmExcluir(capa: Capa) {
    this.capaParaExcluir = capa;
  }

  fecharConfirmExcluir() {
    this.capaParaExcluir = null;
  }

  async confirmarExclusao() {
    if (!this.capaParaExcluir?.id) return;

    try {
      await this.capasService.excluirCapa(this.capaParaExcluir.id);
      this.capaParaExcluir = null;
      await this.carregarCapas();
    } catch (error: any) {
      console.error('Erro ao excluir capa:', error);
    }
  }

  visualizarCapa(capa: Capa) {
    this.capaParaVisualizar = capa;
  }

  fecharVisualizacao() {
    this.capaParaVisualizar = null;
  }

  aplicarMascaraData(event: Event): void {
    const input = event.target as HTMLInputElement;
    let valor = input.value.replace(/\D/g, '');
    if (valor.length > 8) valor = valor.substring(0, 8);
    if (valor.length > 4) {
      valor = valor.substring(0, 2) + '/' + valor.substring(2, 4) + '/' + valor.substring(4);
    } else if (valor.length > 2) {
      valor = valor.substring(0, 2) + '/' + valor.substring(2);
    }
    this.capaAtual.dataElaboracao = valor;
  }

  formatarData(data: any): string {
    if (!data) return '';
    if (typeof data === 'string') return data;
    // Firestore Timestamp
    if (data.toDate) {
      const d = data.toDate();
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }
    // Date object
    if (data instanceof Date) {
      return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
    }
    return String(data);
  }
}
