import { Component, OnInit } from '@angular/core';
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

    constructor(private blocosService: BlocosService, private router: Router) { }

    ngOnInit() {
        this.carregarBlocos();
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
            this.extrairRegionais();
        } catch (error) {
            console.error('Erro ao carregar blocos:', error);
        }
        this.carregando = false;
    }

    extrairRegionais() {
        const regionaisSet = new Set<string>();
        this.blocos.forEach(b => {
            if (b.regional) regionaisSet.add(b.regional);
        });
        this.regionais = Array.from(regionaisSet).sort();
    }

    filtrarPorRegional() {
        this.blocosFiltrados = this.blocos.filter(b => {
            const matchRegional = !this.filtroRegional || b.regional === this.filtroRegional;
            const matchNome = !this.filtroRegionalNome.trim() ||
                b.nomeDoBloco?.toLowerCase().includes(this.filtroRegionalNome.toLowerCase());
            return matchRegional && matchNome;
        });
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
                queryParams: { url, titulo: bloco.nomeDoBloco }
            });
        }
    }

    abrirDocumentoCompleto(bloco: BlocoItem) {
        this.router.navigate(['/documento', bloco.id]);
    }

    temMapa(bloco: BlocoItem): boolean {
        return !!(bloco.myMapsEmbedUrl || bloco.percursoUrl);
    }

    voltar() {
        this.router.navigate(['/menu']);
    }
}
