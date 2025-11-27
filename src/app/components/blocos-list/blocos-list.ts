import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Storage, ref, deleteObject } from '@angular/fire/storage';
import { Firestore, collection, query, where, getDocs, updateDoc, doc, deleteField } from '@angular/fire/firestore';
import { BlocosService } from '../../services/blocos';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroEllipsisHorizontal, heroXMark, heroMagnifyingGlass, heroEye, heroMapPin, heroDocumentText, heroTrash, heroClipboardDocument, heroGlobeAmericas, heroDocumentDuplicate } from '@ng-icons/heroicons/outline';
import { BlocoDetalheComponent } from '../bloco-detalhe/bloco-detalhe';
import { KmlUploadComponent } from '../kml-upload/kml-upload';
import { PercursoViewerComponent } from '../percurso-viewer/percurso-viewer';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal';
import { DadosBeloturComponent } from '../dados-belotur/dados-belotur';
import { DadosMymapsComponent } from '../dados-mymaps/dados-mymaps';

@Component({
  selector: 'app-blocos-list',
  imports: [CommonModule, FormsModule, NgIcon, BlocoDetalheComponent, KmlUploadComponent, PercursoViewerComponent, ConfirmModalComponent, DadosBeloturComponent, DadosMymapsComponent],
  viewProviders: [provideIcons({ heroEllipsisHorizontal, heroXMark, heroMagnifyingGlass, heroEye, heroMapPin, heroDocumentText, heroTrash, heroClipboardDocument, heroGlobeAmericas, heroDocumentDuplicate })],
  templateUrl: './blocos-list.html',
  styleUrl: './blocos-list.scss'
})
export class BlocosListComponent implements OnInit {
  blocos: any[] = [];
  blocosFiltrados: any[] = [];
  isLoading = true;
  errorMessage = '';

  // Filtros
  filtroNome = '';
  filtroRegional = '';
  filtroDataDesfile = '';
  filtroLivre = '';
  regionaisDisponiveis: string[] = [];
  datasDesfileDisponiveis: string[] = [];

  // Controle do tooltip
  activeTooltip: { rowIndex: number; field: string } | null = null;
  tooltipContent = '';

  // Controle do modal de detalhe
  blocoSelecionado: any = null;

  // Controle do modal de upload KML
  blocoParaUploadKml: any = null;

  // Controle do modal de visualização do percurso
  blocoParaVisualizarPercurso: any = null;

  // Controle do modal de confirmação de exclusão
  blocoParaRemover: any = null;

  // Controle do modal de documento Belotur
  blocoParaDocumento: any = null;

  // Controle do modal de documento My Maps
  blocoParaDocumentoMymaps: any = null;

  // Colunas a exibir (todas as colunas)
  displayColumns = [
    // Informações Básicas
    { key: 'nomeDoBloco', label: 'Nome do Bloco' },
    { key: 'dataDoDesfile', label: 'Data Desfile' },
    { key: 'regional', label: 'Regional' },
    { key: 'periodo', label: 'Período' },
    { key: 'publicoAnterior', label: 'Público Anterior' },
    { key: 'publicoDeclarado', label: 'Público Declarado' },
    { key: 'possuiDesfiles', label: 'Possui Desfiles' },
    { key: 'statusDoDesfile', label: 'Status' },
    { key: 'justificativaStatus', label: 'Justificativa' },
    { key: 'numeroInscricao', label: 'Nº Inscrição' },
    { key: 'categoriaDoBloco', label: 'Categoria' },
    { key: 'autorizaDivulgacao', label: 'Autoriza Divulgação' },
    { key: 'dataCadastroModificacao', label: 'Data Cadastro' },
    { key: 'primeiroCadastro', label: 'Primeiro Cadastro' },
    // Público
    { key: 'observacoesAnoAnterior', label: 'Obs. Ano Anterior' },
    // Características
    { key: 'perfil', label: 'Perfil' },
    { key: 'estiloDeMusica', label: 'Estilo Musical' },
    { key: 'descricaoDoBloco', label: 'Descrição' },
    // Data e Horário
    { key: 'horarioDeconcentracao', label: 'Concentração' },
    { key: 'inicioDoDesfile', label: 'Início' },
    { key: 'horarioEncerramento', label: 'Encerramento' },
    { key: 'duracaoDoDesfile', label: 'Duração' },
    { key: 'horarioDispersao', label: 'Dispersão' },
    // Equipamentos
    { key: 'equipamentosUtilizados', label: 'Equipamentos' },
    { key: 'larguraMetros', label: 'Largura (m)' },
    { key: 'comprimentoMetros', label: 'Comprimento (m)' },
    { key: 'alturaMetros', label: 'Altura (m)' },
    { key: 'potenciaWatts', label: 'Potência (W)' },
    { key: 'dimensaoDeVeiculos', label: 'Dimensão Veículos' },
    // Localização
    { key: 'percurso', label: 'Percurso' },
    { key: 'enderecoDeConcentracao', label: 'End. Concentração' },
    { key: 'bairroDeConcentracao', label: 'Bairro Concentração' },
    { key: 'enderecoDeDispersao', label: 'End. Dispersão' },
    { key: 'bairroDeDispersao', label: 'Bairro Dispersão' },
    { key: 'extensaoDoDesfileMetros', label: 'Extensão (m)' },
    { key: 'numeroDeQuadras', label: 'Nº Quadras' },
    { key: 'areaDoTrajetoM2', label: 'Área (m²)' },
    { key: 'capacidadePublicoDoTrajeto', label: 'Capacidade' },
    // Adicionais
    { key: 'informacoesAdicionais', label: 'Info. Adicionais' },
    // Responsável
    { key: 'responsavelLegal', label: 'Responsável' },
    { key: 'cnpj', label: 'CNPJ' },
    { key: 'cpf', label: 'CPF' },
    { key: 'email', label: 'E-mail' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'celular', label: 'Celular' },
    { key: 'nomeResponsavelSecundario', label: 'Resp. Secundário' },
    { key: 'celularContato2', label: 'Celular 2' }
  ];

  constructor(
    private blocosService: BlocosService,
    private ngZone: NgZone,
    private storage: Storage,
    private firestore: Firestore,
    private router: Router
  ) { }

  ngOnInit() {
    this.carregarBlocos();
  }

  async carregarBlocos() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      console.log('Iniciando carregamento dos blocos...');

      // Adiciona timeout de 15 segundos
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: A conexão com o Firestore demorou muito.')), 15000);
      });

      const blocos = await Promise.race([
        this.blocosService.getBlocos(),
        timeoutPromise
      ]);

      // Garante que o Angular detecte a mudança
      this.ngZone.run(() => {
        // Ordena por nome do bloco
        this.blocos = blocos.sort((a: any, b: any) => {
          const nomeA = (a.nomeDoBloco || '').toLowerCase();
          const nomeB = (b.nomeDoBloco || '').toLowerCase();
          return nomeA.localeCompare(nomeB, 'pt-BR');
        });
        this.blocosFiltrados = this.blocos;
        this.extrairRegionais();
        this.isLoading = false;
        console.log('Blocos carregados:', this.blocos.length);
      });
    } catch (error: any) {
      console.error('Erro ao carregar blocos:', error);
      this.ngZone.run(() => {
        this.errorMessage = error?.message || 'Erro ao carregar os blocos. Verifique sua conexão e tente novamente.';
        this.isLoading = false;
      });
    }
  }


  formatValue(value: any, key: string): string {
    if (value === null || value === undefined) return '-';

    // Formata booleanos
    if (typeof value === 'boolean') {
      return value ? 'Sim' : 'Não';
    }

    // Formata arrays
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : '-';
    }

    // Formata datas
    if (key.toLowerCase().includes('data') && value) {
      try {
        const date = value.toDate ? value.toDate() : new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('pt-BR');
        }
      } catch {
        return String(value);
      }
    }

    return String(value);
  }

  isTextLong(value: any): boolean {
    const text = String(value || '');
    return text.length > 30;
  }

  getTruncatedText(value: any): string {
    const text = String(value || '-');
    if (text.length > 30) {
      return text.substring(0, 30) + '...';
    }
    return text;
  }

  showTooltip(rowIndex: number, field: string, value: any) {
    this.activeTooltip = { rowIndex, field };
    this.tooltipContent = this.formatValue(value, field);
  }

  hideTooltip() {
    this.activeTooltip = null;
    this.tooltipContent = '';
  }

  isTooltipActive(rowIndex: number, field: string): boolean {
    return this.activeTooltip?.rowIndex === rowIndex && this.activeTooltip?.field === field;
  }

  abrirDetalhe(bloco: any) {
    this.blocoSelecionado = bloco;
  }

  fecharDetalhe() {
    this.blocoSelecionado = null;
  }

  abrirUploadKml(bloco: any) {
    this.blocoParaUploadKml = bloco;
  }

  fecharUploadKml() {
    this.blocoParaUploadKml = null;
  }

  onKmlUploadConcluido(url: string) {
    // Atualiza o bloco na lista local
    const index = this.blocos.findIndex(b => b.numeroInscricao === this.blocoParaUploadKml?.numeroInscricao);
    if (index !== -1) {
      this.blocos[index].percursoUrl = url;
      this.blocos[index].percursoDataUpload = new Date();
    }
  }

  abrirVisualizarPercurso(bloco: any) {
    this.blocoParaVisualizarPercurso = bloco;
  }

  fecharVisualizarPercurso() {
    this.blocoParaVisualizarPercurso = null;
  }

  abrirModalRemover(bloco: any) {
    this.blocoParaRemover = bloco;
  }

  fecharModalRemover() {
    this.blocoParaRemover = null;
  }

  abrirDocumentoBelotur(bloco: any) {
    this.blocoParaDocumento = bloco;
  }

  fecharDocumentoBelotur() {
    this.blocoParaDocumento = null;
  }

  abrirDocumentoMymaps(bloco: any) {
    this.blocoParaDocumentoMymaps = bloco;
  }

  fecharDocumentoMymaps() {
    this.blocoParaDocumentoMymaps = null;
  }

  abrirDocumentoCompleto(bloco: any) {
    this.router.navigate(['/documento', bloco.id]);
  }

  async confirmarRemocao() {
    if (!this.blocoParaRemover?.percursoUrl) return;

    const bloco = this.blocoParaRemover;

    try {
      // Extrai o path do Storage
      const match = bloco.percursoUrl.match(/\/o\/([^?]+)/);
      if (match) {
        const storagePath = decodeURIComponent(match[1]);
        const storageRef = ref(this.storage, storagePath);
        await deleteObject(storageRef);
      }

      // Remove a referência do Firestore
      const blocosCollection = collection(this.firestore, 'blocos');
      const q = query(blocosCollection, where('numeroInscricao', '==', bloco.numeroInscricao));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docId = querySnapshot.docs[0].id;
        const docRef = doc(this.firestore, 'blocos', docId);
        await updateDoc(docRef, {
          percursoUrl: deleteField(),
          percursoDataUpload: deleteField()
        });
      }

      // Atualiza a lista local
      this.ngZone.run(() => {
        const index = this.blocos.findIndex(b => b.numeroInscricao === bloco.numeroInscricao);
        if (index !== -1) {
          delete this.blocos[index].percursoUrl;
          delete this.blocos[index].percursoDataUpload;
        }
        this.blocoParaRemover = null;
      });

    } catch (error: any) {
      console.error('Erro ao remover arquivo:', error);
      alert(`Erro ao remover arquivo: ${error.message}`);
      this.blocoParaRemover = null;
    }
  }

  extrairRegionais() {
    const regionais = new Set<string>();
    const datas = new Set<string>();

    this.blocos.forEach(bloco => {
      if (bloco.regional && bloco.regional.trim()) {
        regionais.add(bloco.regional.trim());
      }
      if (bloco.dataDoDesfile) {
        const dataFormatada = this.formatarDataParaFiltro(bloco.dataDoDesfile);
        if (dataFormatada) {
          datas.add(dataFormatada);
        }
      }
    });

    this.regionaisDisponiveis = Array.from(regionais).sort();
    this.datasDesfileDisponiveis = Array.from(datas).sort((a, b) => {
      // Ordena por data (converte dd/mm/yyyy para comparação)
      const [diaA, mesA, anoA] = a.split('/');
      const [diaB, mesB, anoB] = b.split('/');
      return new Date(`${anoA}-${mesA}-${diaA}`).getTime() - new Date(`${anoB}-${mesB}-${diaB}`).getTime();
    });
  }

  private formatarDataParaFiltro(value: any): string | null {
    try {
      const date = value.toDate ? value.toDate() : new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR');
      }
    } catch {
      return null;
    }
    return null;
  }

  // Busca em todos os campos do bloco
  private buscaEmTodosCampos(bloco: any, termo: string): boolean {
    if (!termo) return true;
    const termoLower = termo.toLowerCase();

    return Object.values(bloco).some(valor => {
      if (valor === null || valor === undefined) return false;
      if (Array.isArray(valor)) {
        return valor.some(v => String(v).toLowerCase().includes(termoLower));
      }
      return String(valor).toLowerCase().includes(termoLower);
    });
  }

  aplicarFiltros() {
    this.blocosFiltrados = this.blocos.filter(bloco => {
      const nomeMatch = !this.filtroNome ||
        (bloco.nomeDoBloco || '').toLowerCase().includes(this.filtroNome.toLowerCase());

      const regionalMatch = !this.filtroRegional ||
        bloco.regional === this.filtroRegional;

      const dataMatch = !this.filtroDataDesfile ||
        this.formatarDataParaFiltro(bloco.dataDoDesfile) === this.filtroDataDesfile;

      const livreMatch = this.buscaEmTodosCampos(bloco, this.filtroLivre);

      return nomeMatch && regionalMatch && dataMatch && livreMatch;
    });
  }

  limparFiltros() {
    this.filtroNome = '';
    this.filtroRegional = '';
    this.filtroDataDesfile = '';
    this.filtroLivre = '';
    this.blocosFiltrados = this.blocos;
  }

  getDiaSemana(dataStr: string): string {
    if (!dataStr) return '';
    const [dia, mes, ano] = dataStr.split('/');
    const data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return diasSemana[data.getDay()];
  }
}
