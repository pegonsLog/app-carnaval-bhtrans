import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Storage, ref, getBytes } from '@angular/fire/storage';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroArrowLeft, heroPrinter } from '@ng-icons/heroicons/outline';
import { BlocosService } from '../../services/blocos';
import { CapasService } from '../../services/capas';
import { Capa } from '../../interfaces/capa.interface';

@Component({
  selector: 'app-documento-bloco',
  imports: [CommonModule, NgIcon],
  viewProviders: [provideIcons({ heroArrowLeft, heroPrinter })],
  templateUrl: './documento-bloco.html',
  styleUrl: './documento-bloco.scss'
})
export class DocumentoBlocoComponent implements OnInit {
  bloco: any = null;
  capa: Capa | null = null;
  parsedMymaps: any = { titulo: '', secoes: [] };
  markdownContent = '';
  mapEmbedUrl = '';
  safeMapUrl: SafeResourceUrl | null = null;

  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private blocosService: BlocosService,
    private capasService: CapasService,
    private storage: Storage,
    private ngZone: NgZone,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    const blocoId = this.route.snapshot.paramMap.get('id');
    if (blocoId) {
      this.carregarDados(blocoId);
    } else {
      this.errorMessage = 'ID do bloco não informado';
      this.isLoading = false;
    }
  }

  async carregarDados(blocoId: string) {
    try {
      // Carrega o bloco
      const blocos = await this.blocosService.getBlocos();
      this.bloco = blocos.find((b: any) => b.id === blocoId);

      if (!this.bloco) {
        this.errorMessage = 'Bloco não encontrado';
        this.isLoading = false;
        return;
      }

      // Carrega a capa baseada na regional do bloco
      await this.carregarCapa();

      // Carrega dados do MyMaps se existir
      if (this.bloco.percursoUrl) {
        await this.carregarMymaps();
      }

      // Usa a URL de embed do My Maps salva no bloco (prioridade)
      if (this.bloco.myMapsEmbedUrl) {
        this.mapEmbedUrl = this.bloco.myMapsEmbedUrl;
        this.safeMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.bloco.myMapsEmbedUrl);
        console.log('Usando myMapsEmbedUrl do bloco:', this.bloco.myMapsEmbedUrl);
      }

      this.ngZone.run(() => {
        this.isLoading = false;
      });
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      this.ngZone.run(() => {
        this.errorMessage = 'Erro ao carregar dados do bloco';
        this.isLoading = false;
      });
    }
  }

  async carregarCapa() {
    try {
      const capas = await this.capasService.getCapas();
      // Busca a capa que contém a regional do bloco
      const regionalBloco = this.bloco.regional?.trim().toLowerCase();

      if (regionalBloco) {
        this.capa = capas.find((c: Capa) =>
          c.regionais?.some(r => r.trim().toLowerCase() === regionalBloco)
        ) || null;
      }
    } catch (error) {
      console.error('Erro ao carregar capa:', error);
    }
  }

  async carregarMymaps() {
    try {
      const storagePath = this.extrairPathDoStorage(this.bloco.percursoUrl);
      if (storagePath) {
        const storageRef = ref(this.storage, storagePath);
        const bytes = await getBytes(storageRef);
        const decoder = new TextDecoder('utf-8');
        this.markdownContent = decoder.decode(bytes);
        this.parsedMymaps = this.parseMarkdown(this.markdownContent);
      }
    } catch (error) {
      console.error('Erro ao carregar MyMaps:', error);
    }
  }

  private extrairPathDoStorage(url: string): string | null {
    try {
      const match = url.match(/\/o\/([^?]+)/);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    } catch {
      return null;
    }
    return null;
  }

  private parseMarkdown(md: string): any {
    const data: any = { titulo: '', secoes: [], mapUrl: '' };
    const lines = md.split('\n');
    let currentSection: any = null;
    let placemarkNames: string[] = []; // Coleta nomes dos placemarks (###)

    for (const line of lines) {
      const trimmed = line.trim();

      // Título principal (# )
      if (trimmed.startsWith('# ') && !trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
        data.titulo = trimmed.substring(2).trim();
        continue;
      }

      // Seção/Pasta (## )
      if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
        // Finaliza seção anterior com contagem e itens únicos
        if (currentSection) {
          currentSection.contagem = this.contarItens(placemarkNames);
          currentSection.itens = [...new Set(placemarkNames)]; // Itens únicos sem contagem
          data.secoes.push(currentSection);
        }

        const tituloSecao = trimmed.substring(3).trim();

        // Ignora a pasta "Ícone" e variações
        if (this.isPastaIgnorada(tituloSecao)) {
          currentSection = null;
          placemarkNames = [];
          continue;
        }

        currentSection = {
          titulo: tituloSecao,
          contagem: [],
          itens: [], // Lista de itens únicos (sem contagem)
          exibirContagem: this.isPastaComContagem(tituloSecao)
        };
        placemarkNames = [];
        continue;
      }

      // Placemark (### ) - coleta o nome para contagem
      if (trimmed.startsWith('### ') && currentSection) {
        const nomeItem = trimmed.substring(4).trim();
        placemarkNames.push(nomeItem);
        continue;
      }

      // Busca links no formato markdown [texto](url)
      const linkMatch = trimmed.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        const url = linkMatch[2];
        // Extrai o link do Google Maps para embed
        if (this.isGoogleMapsUrl(url) && !data.mapUrl) {
          data.mapUrl = url;
          this.convertToEmbedUrl(url);
        }
      }

      // Busca URLs diretas do Google Maps (sem formato markdown)
      if (!linkMatch && this.isGoogleMapsUrl(trimmed) && !data.mapUrl) {
        data.mapUrl = trimmed;
        this.convertToEmbedUrl(trimmed);
      }
    }

    // Finaliza última seção
    if (currentSection) {
      currentSection.contagem = this.contarItens(placemarkNames);
      currentSection.itens = [...new Set(placemarkNames)]; // Itens únicos sem contagem
      data.secoes.push(currentSection);
    }

    console.log('Markdown parseado:', data);
    return data;
  }

  private contarItens(nomes: string[]): { nome: string; quantidade: number }[] {
    const contagem: { [key: string]: number } = {};

    for (const nome of nomes) {
      const nomeNormalizado = nome.trim();
      if (nomeNormalizado) {
        contagem[nomeNormalizado] = (contagem[nomeNormalizado] || 0) + 1;
      }
    }

    // Converte para array e ordena por quantidade (maior primeiro)
    return Object.entries(contagem)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }

  private isGoogleMapsUrl(url: string): boolean {
    return url.includes('google.com/maps') ||
      url.includes('goo.gl/maps') ||
      url.includes('maps.google.com');
  }

  private isPastaIgnorada(titulo: string): boolean {
    const tituloLower = titulo.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove acentos

    const pastasIgnoradas = ['icone', 'icones', 'icon', 'icons'];
    return pastasIgnoradas.some(pasta => tituloLower.includes(pasta));
  }

  private isPastaComContagem(titulo: string): boolean {
    const tituloLower = titulo.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove acentos

    const pastasComContagem = ['presencas', 'presenca', 'sinalizacao', 'fechamentos', 'fechamento'];
    return pastasComContagem.some(pasta => tituloLower.includes(pasta));
  }

  private convertToEmbedUrl(url: string): void {
    // Converte URL do Google My Maps para embed
    let embedUrl = url;

    // Formato: https://www.google.com/maps/d/u/0/viewer?mid=xxx
    // Para: https://www.google.com/maps/d/u/0/embed?mid=xxx
    if (url.includes('/viewer?')) {
      embedUrl = url.replace('/viewer?', '/embed?');
    } else if (url.includes('/edit?')) {
      embedUrl = url.replace('/edit?', '/embed?');
    } else if (url.includes('/maps/d/') && !url.includes('/embed?')) {
      // Se é um link do My Maps mas não tem viewer nem edit, adiciona embed
      embedUrl = url.replace(/\/maps\/d\/([^/]+)\//, '/maps/d/$1/embed?');
    }

    console.log('URL original:', url);
    console.log('URL embed:', embedUrl);

    this.mapEmbedUrl = embedUrl;
    // Cria URL segura para o iframe
    this.safeMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  voltar() {
    // Volta para a lista com parâmetro para reabrir o modal de ações
    this.router.navigate(['/'], { 
      queryParams: { abrirAcoes: this.bloco?.id } 
    });
  }

  imprimir() {
    window.print();
  }

  formatDate(value: any): string {
    if (!value) return '-';
    try {
      const date = value.toDate ? value.toDate() : new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR');
      }
    } catch {
      return String(value);
    }
    return '-';
  }

  formatBoolean(value: boolean | undefined): string {
    if (value === undefined || value === null) return '-';
    return value ? 'Sim' : 'Não';
  }

  formatArray(value: any[]): string {
    if (!value || !Array.isArray(value) || value.length === 0) return '-';
    return value.join(', ');
  }

  formatNumber(value: number | undefined): string {
    if (value === undefined || value === null) return '-';
    return value.toLocaleString('pt-BR');
  }

  getTotalAgentes(): number {
    if (!this.bloco?.agentes) return 0;
    return this.bloco.agentes.reduce((total: number, item: any) => total + (item.quantidade || 0), 0);
  }

  getTotalSinalizacoes(): number {
    if (!this.bloco?.sinalizacoes) return 0;
    return this.bloco.sinalizacoes.reduce((total: number, item: any) => total + (item.quantidade || 0), 0);
  }
}
