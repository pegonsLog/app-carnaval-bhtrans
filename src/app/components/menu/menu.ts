import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroXMark, heroMagnifyingGlass, heroMapPin, heroCalendarDays, heroDocumentText, heroMap, heroBuildingOffice2 } from '@ng-icons/heroicons/outline';
import { BlocosService } from '../../services/blocos';
import { MapaModalComponent } from '../mapa-modal/mapa-modal';

interface BlocoItem {
  id: string;
  nomeDoBloco: string;
  dataDoDesfile: any;
  regional: string;
  myMapsEmbedUrl?: string;
  percursoUrl?: string;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon, MapaModalComponent],
  viewProviders: [provideIcons({ heroXMark, heroMagnifyingGlass, heroMapPin, heroCalendarDays, heroDocumentText, heroMap, heroBuildingOffice2 })],
  templateUrl: './menu.html',
  styleUrl: './menu.scss'
})
export class MenuComponent implements OnInit {
  // Controle dos modais
  modalPorBlocoAberto = false;
  modalPorRegionalAberto = false;
  modalPorDataAberto = false;
  modalMapaAberto = false;

  // Dados
  blocos: BlocoItem[] = [];
  blocosFiltrados: BlocoItem[] = [];
  regionais: string[] = [];
  datas: string[] = [];

  // Filtros
  filtroBlocoNome = '';
  filtroRegional = '';
  filtroRegionalNome = '';
  filtroData = '';
  filtroDataNome = '';

  // Mapa
  mapaUrl = '';
  mapaTitulo = '';

  // Loading
  carregando = false;

  constructor(private blocosService: BlocosService) {}

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
      this.extrairDatas();
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

  formatarData(data: any): string {
    if (!data) return '';
    if (data.toDate) {
      return data.toDate().toLocaleDateString('pt-BR');
    }
    if (data instanceof Date) {
      return data.toLocaleDateString('pt-BR');
    }
    return String(data);
  }

  // Modal Por Bloco
  abrirModalPorBloco() {
    this.modalPorBlocoAberto = true;
    this.filtroBlocoNome = '';
    this.blocosFiltrados = [];
  }

  fecharModalPorBloco() {
    this.modalPorBlocoAberto = false;
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

  // Modal Por Regional
  abrirModalPorRegional() {
    this.modalPorRegionalAberto = true;
    this.filtroRegional = '';
    this.filtroRegionalNome = '';
    this.blocosFiltrados = [];
  }

  fecharModalPorRegional() {
    this.modalPorRegionalAberto = false;
  }

  filtrarPorRegional() {
    this.blocosFiltrados = this.blocos.filter(b => {
      const matchRegional = !this.filtroRegional || b.regional === this.filtroRegional;
      const matchNome = !this.filtroRegionalNome.trim() || 
        b.nomeDoBloco?.toLowerCase().includes(this.filtroRegionalNome.toLowerCase());
      return matchRegional && matchNome;
    });
  }

  // Modal Por Data
  abrirModalPorData() {
    this.modalPorDataAberto = true;
    this.filtroData = '';
    this.filtroDataNome = '';
    this.blocosFiltrados = [];
  }

  fecharModalPorData() {
    this.modalPorDataAberto = false;
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

  // Ações dos blocos
  abrirMapa(bloco: BlocoItem) {
    const url = bloco.myMapsEmbedUrl || bloco.percursoUrl;
    if (url) {
      this.mapaUrl = url;
      this.mapaTitulo = `Mapa - ${bloco.nomeDoBloco}`;
      this.modalMapaAberto = true;
    }
  }

  fecharMapa() {
    this.modalMapaAberto = false;
  }

  abrirDocumentoCompleto(bloco: BlocoItem) {
    // Navegar para a página de documento do bloco (DOT)
    window.open(`/documento/${bloco.id}`, '_blank');
  }

  temMapa(bloco: BlocoItem): boolean {
    return !!(bloco.myMapsEmbedUrl || bloco.percursoUrl);
  }
}
