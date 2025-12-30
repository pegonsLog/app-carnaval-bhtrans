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
    selector: 'app-busca-data',
    standalone: true,
    imports: [CommonModule, FormsModule, NgIcon],
    viewProviders: [provideIcons({ heroArrowLeft, heroMap, heroDocumentText })],
    templateUrl: './busca-data.html',
    styleUrl: './busca-data.scss'
})
export class BuscaDataComponent implements OnInit {
    blocos: BlocoItem[] = [];
    blocosFiltrados: BlocoItem[] = [];
    datas: string[] = [];
    filtroData = '';
    filtroDataNome = '';
    carregando = false;

    constructor(
        private blocosService: BlocosService, 
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

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
            this.extrairDatas();
            this.cdr.detectChanges();
        } catch (error) {
            console.error('Erro ao carregar blocos:', error);
        }
        this.carregando = false;
        this.cdr.detectChanges();
    }

    extrairDatas() {
        const datasSet = new Set<string>();
        this.blocos.forEach(b => {
            if (b.dataDoDesfile) {
                const dataFormatada = this.formatarData(b.dataDoDesfile);
                if (dataFormatada) datasSet.add(dataFormatada);
            }
        });
        this.datas = Array.from(datasSet).sort();
    }

    filtrarPorData() {
        this.blocosFiltrados = this.blocos.filter(b => {
            const dataFormatada = this.formatarData(b.dataDoDesfile);
            const matchData = !this.filtroData || dataFormatada === this.filtroData;
            const matchNome = !this.filtroDataNome.trim() ||
                b.nomeDoBloco?.toLowerCase().includes(this.filtroDataNome.toLowerCase());
            return matchData && matchNome;
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

    getDiaSemana(data: string): string {
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
