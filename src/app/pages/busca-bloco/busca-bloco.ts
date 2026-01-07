import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroArrowLeft, heroMap, heroDocumentText } from '@ng-icons/heroicons/outline';
import { BlocosService } from '../../services/blocos';

interface BlocoItem {
    id: string;
    nomeDoBloco: string;
    dataDoDesfile: any;
    regional: string;
    myMapsEmbedUrl?: string;
    percursoUrl?: string;
}

@Component({
    selector: 'app-busca-bloco',
    standalone: true,
    imports: [CommonModule, FormsModule, NgIcon],
    viewProviders: [provideIcons({ heroArrowLeft, heroMap, heroDocumentText })],
    templateUrl: './busca-bloco.html',
    styleUrl: './busca-bloco.scss'
})
export class BuscaBlocoComponent implements OnInit {
    blocos: BlocoItem[] = [];
    blocosFiltrados: BlocoItem[] = [];
    filtroBlocoNome = '';
    carregando = false;
    blocoDestacadoId: string | null = null;

    constructor(
        private blocosService: BlocosService, 
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {
        // Restaura o estado ao voltar da navegação
        const navigation = this.router.getCurrentNavigation();
        const state = navigation?.extras?.state || history.state;
        
        if (state && (state['fromMapa'] || state['fromDocumento'])) {
            this.filtroBlocoNome = state['filtroBlocoNome'] || '';
            this.blocoDestacadoId = state['blocoId'] || null;
        }
    }

    async ngOnInit() {
        await this.carregarBlocos();
        
        // Se voltou do mapa ou documento, executa a busca para restaurar os resultados
        if (this.filtroBlocoNome) {
            this.filtrarPorBloco();
            this.cdr.detectChanges();
            
            // Scroll para o bloco destacado após um pequeno delay
            if (this.blocoDestacadoId) {
                setTimeout(() => {
                    const elemento = document.getElementById(`bloco-${this.blocoDestacadoId}`);
                    if (elemento) {
                        elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 300);
            }
        }
    }

    async carregarBlocos() {
        this.carregando = true;
        try {
            const dados = await this.blocosService.getBlocos();
            this.blocos = dados.map(b => ({
                id: b.id,
                nomeDoBloco: b.nomeDoBloco,
                dataDoDesfile: b.dataDoDesfile,
                regional: b.regional,
                myMapsEmbedUrl: b.myMapsEmbedUrl,
                percursoUrl: b.percursoUrl
            }));
            this.cdr.detectChanges();
        } catch (error) {
            console.error('Erro ao carregar blocos:', error);
        }
        this.carregando = false;
        this.cdr.detectChanges();
    }

    filtrarPorBloco() {
        if (!this.filtroBlocoNome.trim()) {
            this.blocosFiltrados = [];
            return;
        }
        const termo = this.filtroBlocoNome.toLowerCase();
        this.blocosFiltrados = this.blocos
            .filter(b => b.nomeDoBloco?.toLowerCase().includes(termo))
            .sort((a, b) => (a.nomeDoBloco || '').localeCompare(b.nomeDoBloco || '', 'pt-BR'));
    }

    formatarData(data: any): string {
        if (!data) return '';
        if (data.toDate) return data.toDate().toLocaleDateString('pt-BR');
        if (data instanceof Date) return data.toLocaleDateString('pt-BR');
        return String(data);
    }

    abrirMapa(bloco: BlocoItem) {
        const url = bloco.myMapsEmbedUrl || bloco.percursoUrl;
        if (url) {
            this.router.navigate(['/mapa'], {
                queryParams: { 
                    url, 
                    titulo: bloco.nomeDoBloco,
                    returnUrl: '/busca-bloco'
                },
                state: {
                    filtroBlocoNome: this.filtroBlocoNome,
                    blocoId: bloco.id
                }
            });
        }
    }

    abrirDocumentoCompleto(bloco: BlocoItem) {
        this.router.navigate(['/documento', bloco.id], {
            state: {
                returnUrl: '/busca-bloco',
                filtroBlocoNome: this.filtroBlocoNome,
                blocoId: bloco.id
            }
        });
    }

    temMapa(bloco: BlocoItem): boolean {
        return !!(bloco.myMapsEmbedUrl || bloco.percursoUrl);
    }

    getDiaSemana(data: string): string {
        if (!data) return '';
        try {
            const partes = data.split('/');
            const dataObj = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
            const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
            return diasSemana[dataObj.getDay()];
        } catch {
            return '';
        }
    }

    voltar() {
        this.router.navigate(['/menu']);
    }
}
