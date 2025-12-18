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
        } catch (error) {
            console.error('Erro ao carregar blocos:', error);
        }
        this.carregando = false;
    }

    filtrarPorBloco() {
        if (!this.filtroBlocoNome.trim()) {
            this.blocosFiltrados = [];
            return;
        }
        const termo = this.filtroBlocoNome.toLowerCase();
        this.blocosFiltrados = this.blocos.filter(b =>
            b.nomeDoBloco?.toLowerCase().includes(termo)
        );
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
