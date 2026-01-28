import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroArrowLeft, heroEllipsisHorizontal, heroXMark } from '@ng-icons/heroicons/outline';
import { LinhaTcService } from '../../services/linha-tc.service';

interface LinhaItem {
    id: string;
    linhaDestino: string;
    pc: string;
    itinerario: string;
    pedsAtivados: string;
}

@Component({
    selector: 'app-busca-linha',
    standalone: true,
    imports: [CommonModule, FormsModule, NgIcon],
    viewProviders: [provideIcons({ heroArrowLeft, heroEllipsisHorizontal, heroXMark })],
    templateUrl: './busca-linha.html',
    styleUrl: './busca-linha.scss'
})
export class BuscaLinhaComponent implements OnInit {
    linhas: LinhaItem[] = [];
    linhasFiltradas: LinhaItem[] = [];
    filtroLinha = '';
    carregando = false;
    linhaExpandida: string | null = null;

    constructor(
        private linhaTcService: LinhaTcService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {
        const navigation = this.router.getCurrentNavigation();
        const state = navigation?.extras?.state || history.state;
        if (state && state['filtroLinha']) {
            this.filtroLinha = state['filtroLinha'] || '';
        }
    }

    async ngOnInit() {
        await this.carregarLinhas();
        if (this.filtroLinha) {
            this.filtrarPorLinha();
            this.cdr.detectChanges();
        }
    }

    async carregarLinhas() {
        this.carregando = true;
        try {
            const dados = await this.linhaTcService.getLinhasTc();
            this.linhas = dados.map(l => ({
                id: l.id,
                linhaDestino: l.linhaDestino,
                pc: l.pc,
                itinerario: l.itinerario,
                pedsAtivados: l.pedsAtivados
            }));
            this.cdr.detectChanges();
        } catch (error) {
            console.error('Erro ao carregar linhas:', error);
        }
        this.carregando = false;
        this.cdr.detectChanges();
    }

    filtrarPorLinha() {
        if (!this.filtroLinha.trim()) {
            this.linhasFiltradas = [];
            return;
        }
        const termo = this.filtroLinha.toLowerCase();
        this.linhasFiltradas = this.linhas
            .filter(l => 
                l.linhaDestino?.toLowerCase().includes(termo) ||
                l.pc?.toLowerCase().includes(termo)
            )
            .sort((a, b) => (a.linhaDestino || '').localeCompare(b.linhaDestino || '', 'pt-BR'));
    }

    toggleExpansao(linhaId: string) {
        this.linhaExpandida = this.linhaExpandida === linhaId ? null : linhaId;
    }

    voltar() {
        this.router.navigate(['/']);
    }
}
