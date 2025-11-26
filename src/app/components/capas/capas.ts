import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
    heroPlus,
    heroPencil,
    heroTrash,
    heroXMark,
    heroDocumentArrowDown,
    heroEye,
} from '@ng-icons/heroicons/outline';
import { CapasService } from '../../services/capas';
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
            heroDocumentArrowDown,
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
    capaAtual: Capa = { gerencia: '', equipe: '', responsavel: '', regionais: [] };
    novaRegional = '';

    // Modal de preview
    showPreviewModal = false;
    capaPreview: Capa | null = null;

    // Modal de confirmação de exclusão
    capaParaExcluir: Capa | null = null;

    constructor(
        private capasService: CapasService,
        private ngZone: NgZone
    ) { }

    ngOnInit() {
        this.carregarCapas();
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
        this.capaAtual = { gerencia: '', equipe: '', responsavel: '', regionais: [] };
        this.novaRegional = '';
        this.isEditing = false;
        this.showFormModal = true;
    }

    abrirFormEditar(capa: Capa) {
        this.capaAtual = { ...capa, regionais: capa.regionais || [] };
        this.novaRegional = '';
        this.isEditing = true;
        this.showFormModal = true;
    }

    fecharFormModal() {
        this.showFormModal = false;
        this.capaAtual = { gerencia: '', equipe: '', responsavel: '', regionais: [] };
        this.novaRegional = '';
    }

    adicionarRegional() {
        if (this.novaRegional.trim() && !this.capaAtual.regionais.includes(this.novaRegional.trim())) {
            this.capaAtual.regionais.push(this.novaRegional.trim());
            this.novaRegional = '';
        }
    }

    removerRegional(index: number) {
        this.capaAtual.regionais.splice(index, 1);
    }

    async salvarCapa() {
        if (!this.capaAtual.gerencia || !this.capaAtual.equipe || !this.capaAtual.responsavel) {
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

    abrirPreview(capa: Capa) {
        this.capaPreview = capa;
        this.showPreviewModal = true;
    }

    fecharPreview() {
        this.showPreviewModal = false;
        this.capaPreview = null;
    }

    gerarPDF(capa: Capa) {
        // Abre o preview para impressão/PDF
        this.abrirPreview(capa);
        setTimeout(() => {
            window.print();
        }, 500);
    }
}
