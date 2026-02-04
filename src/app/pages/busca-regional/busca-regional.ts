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
    selector: 'app-busca-regional',
    standalone: true,
    imports: [CommonModule, FormsModule, NgIcon],
    viewProviders: [provideIcons({ heroArrowLeft, heroMap, heroDocumentText })],
    templateUrl: './busca-regional.html',
    styleUrl: './busca-regional.scss'
})
export class BuscaRegionalComponent implements OnInit {
    blocos: BlocoItem[] = [];
    blocosFiltrados: BlocoItem[] = [];
    regionais: string[] = [];
    filtroRegional = '';
    filtroRegionalNome = '';
    carregando = false;
    erro = '';
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
            this.filtroRegional = state['filtroRegional'] || '';
            this.filtroRegionalNome = state['filtroRegionalNome'] || '';
            this.blocoDestacadoId = state['blocoId'] || null;
        }
    }

    async ngOnInit() {
        await this.carregarBlocos();
        
        // Se voltou do mapa, executa a busca para restaurar os resultados
        if (this.filtroRegional || this.filtroRegionalNome) {
            this.filtrarPorRegional();
            
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
        this.erro = '';
        try {
            const dados = await this.blocosService.getBlocosPublicos();
            
            if (!dados || dados.length === 0) {
                this.erro = 'Nenhum bloco encontrado';
                this.carregando = false;
                return;
            }
            
            this.blocos = dados.map(b => ({
                id: b.id,
                nomeDoBloco: b.nomeDoBloco,
                dataDoDesfile: b.dataDoDesfile,
                regional: b.regional,
                myMapsEmbedUrl: b.myMapsEmbedUrl,
                percursoUrl: b.percursoUrl
            }));
            
            this.extrairRegionais();
            this.cdr.detectChanges();
        } catch (error: any) {
            console.error('Erro ao carregar blocos:', error);
            this.erro = 'Erro ao carregar dados: ' + (error?.message || 'Erro desconhecido');
        }
        this.carregando = false;
        this.cdr.detectChanges();
    }

    extrairRegionais() {
        const regionaisSet = new Set<string>();
        this.blocos.forEach(b => {
            if (b.regional) {
                regionaisSet.add(b.regional);
            }
        });
        this.regionais = Array.from(regionaisSet).sort();
    }

    filtrarPorRegional() {
        this.blocosFiltrados = this.blocos
            .filter(b => {
                const matchRegional = !this.filtroRegional || b.regional === this.filtroRegional;
                const matchNome = !this.filtroRegionalNome.trim() ||
                    b.nomeDoBloco?.toLowerCase().includes(this.filtroRegionalNome.toLowerCase());
                return matchRegional && matchNome;
            })
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
                    returnUrl: '/busca-regional'
                },
                state: {
                    filtroRegional: this.filtroRegional,
                    filtroRegionalNome: this.filtroRegionalNome,
                    blocoId: bloco.id
                }
            });
        }
    }

    abrirDocumentoCompleto(bloco: BlocoItem) {
        this.router.navigate(['/documento', bloco.id], {
            state: {
                returnUrl: '/busca-regional',
                filtroRegional: this.filtroRegional,
                filtroRegionalNome: this.filtroRegionalNome,
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
