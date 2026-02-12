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
    filtroItinerario = '';
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
        if (this.filtroLinha || this.filtroItinerario) {
            this.aplicarFiltros();
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

    aplicarFiltros() {
        const termoLinha = this.filtroLinha.trim().toLowerCase();
        const termoItinerario = this.filtroItinerario.trim().toLowerCase();

        if (!termoLinha && !termoItinerario) {
            this.linhasFiltradas = [];
            return;
        }

        this.linhasFiltradas = this.linhas
            .filter(l => {
                const matchLinha = !termoLinha || 
                    l.linhaDestino?.toLowerCase().includes(termoLinha) ||
                    l.pc?.toLowerCase().includes(termoLinha);
                const matchItinerario = !termoItinerario || 
                    l.itinerario?.toLowerCase().includes(termoItinerario);
                return matchLinha && matchItinerario;
            })
            .sort((a, b) => {
                const pcA = (a.pc || '').trim();
                const pcB = (b.pc || '').trim();
                
                // Fonte preta (PC != '-') antes da vermelha (PC == '-')
                if (pcA === '-' && pcB !== '-') return 1;
                if (pcA !== '-' && pcB === '-') return -1;
                
                return (a.linhaDestino || '').localeCompare(b.linhaDestino || '', 'pt-BR');
            });
    }

    toggleExpansao(linhaId: string) {
        this.linhaExpandida = this.linhaExpandida === linhaId ? null : linhaId;
    }

    voltar() {
        this.router.navigate(['/']);
    }
}
