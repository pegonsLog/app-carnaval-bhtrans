import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Storage, ref, deleteObject } from '@angular/fire/storage';
import { Firestore, collection, query, where, getDocs, updateDoc, doc, deleteField } from '@angular/fire/firestore';
import { BlocosService } from '../../services/blocos';
import { AuthService } from '../../services/auth.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroEllipsisHorizontal, heroXMark, heroMagnifyingGlass, heroEye, heroCog6Tooth, heroMapPin } from '@ng-icons/heroicons/outline';
import { BlocoDetalheComponent } from '../bloco-detalhe/bloco-detalhe';
import { KmlUploadComponent } from '../kml-upload/kml-upload';
import { PercursoViewerComponent } from '../percurso-viewer/percurso-viewer';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal';
import { DadosBeloturComponent } from '../dados-belotur/dados-belotur';
import { DadosMymapsComponent } from '../dados-mymaps/dados-mymaps';
import { BlocoAcoesModalComponent } from '../bloco-acoes-modal/bloco-acoes-modal';
import { CrudAgentesComponent } from '../crud-agentes/crud-agentes';
import { CrudDesviosComponent } from '../crud-desvios/crud-desvios';
import { CrudFaixaTecidoComponent } from '../crud-faixa-tecido/crud-faixa-tecido';
import { CrudFechamentosComponent } from '../crud-fechamentos/crud-fechamentos';
import { CrudReservaAreaComponent } from '../crud-reserva-area/crud-reserva-area';
import { CrudSinalizacaoComponent } from '../crud-sinalizacao/crud-sinalizacao';
import { MapaModalComponent } from '../mapa-modal/mapa-modal';
import { Agentes } from '../../interfaces/agentes.interface';
import { Desvios } from '../../interfaces/desvios.interface';
import { FaixaTecido } from '../../interfaces/faixa-tecido.interface';
import { Fechamentos } from '../../interfaces/fechamentos.interface';
import { ReservaDeArea } from '../../interfaces/reserva-de-area.interface';
import { Sinalizacao } from '../../interfaces/sinalizacao.interface';

@Component({
  selector: 'app-blocos-list',
  imports: [CommonModule, FormsModule, NgIcon, BlocoDetalheComponent, KmlUploadComponent, PercursoViewerComponent, ConfirmModalComponent, DadosBeloturComponent, DadosMymapsComponent, BlocoAcoesModalComponent, CrudAgentesComponent, CrudDesviosComponent, CrudFaixaTecidoComponent, CrudFechamentosComponent, CrudReservaAreaComponent, CrudSinalizacaoComponent, MapaModalComponent],
  viewProviders: [provideIcons({ heroEllipsisHorizontal, heroXMark, heroMagnifyingGlass, heroEye, heroCog6Tooth, heroMapPin })],
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

  // Controle do modal de ações
  blocoParaAcoes: any = null;

  // Guarda o bloco para reabrir o modal de ações após fechar modais secundários
  private blocoAcoesAtivo: any = null;

  // Controle dos modais de CRUD
  blocoParaCrudAgentes: any = null;
  blocoParaCrudDesvios: any = null;
  blocoParaCrudFaixasTecido: any = null;
  blocoParaCrudFechamentos: any = null;
  blocoParaCrudReservasArea: any = null;
  blocoParaCrudSinalizacoes: any = null;

  // Controle do modal de mapa
  mapaUrl: string = '';
  mapaTitulo: string = '';

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

  // ID do bloco para abrir modal de ações (vindo de query param)
  private blocoIdParaAbrirAcoes: string | null = null;

  constructor(
    private blocosService: BlocosService,
    private ngZone: NgZone,
    private storage: Storage,
    private firestore: Firestore,
    private router: Router,
    private route: ActivatedRoute,
    public authService: AuthService
  ) { }

  ngOnInit() {
    // Verifica se há parâmetro para abrir modal de ações
    this.route.queryParams.subscribe(params => {
      if (params['abrirAcoes']) {
        this.blocoIdParaAbrirAcoes = params['abrirAcoes'];
        // Limpa o parâmetro da URL
        this.router.navigate([], {
          queryParams: {},
          replaceUrl: true
        });
      }
    });
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
        // Filtra por área se for operador
        let blocosFiltradosPorPerfil = blocos;
        if (this.authService.isOperador && this.authService.filtraPorArea) {
          const regionaisPermitidas = this.authService.regionaisDaArea;
          blocosFiltradosPorPerfil = blocos.filter((b: any) =>
            regionaisPermitidas.some(r => r.toLowerCase() === (b.regional || '').toLowerCase())
          );
        }

        // Ordena por nome do bloco
        this.blocos = blocosFiltradosPorPerfil.sort((a: any, b: any) => {
          const nomeA = (a.nomeDoBloco || '').toLowerCase();
          const nomeB = (b.nomeDoBloco || '').toLowerCase();
          return nomeA.localeCompare(nomeB, 'pt-BR');
        });
        this.blocosFiltrados = this.blocos;
        this.extrairRegionais();
        this.isLoading = false;
        console.log('Blocos carregados:', this.blocos.length);

        // Abre modal de ações se veio de navegação com parâmetro
        if (this.blocoIdParaAbrirAcoes) {
          const bloco = this.blocos.find(b => b.id === this.blocoIdParaAbrirAcoes);
          if (bloco) {
            this.abrirAcoes(bloco);
          }
          this.blocoIdParaAbrirAcoes = null;
        }
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
    this.voltarParaModalAcoes();
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

  abrirMapaExterno(bloco: any) {
    if (bloco.myMapsEmbedUrl) {
      this.mapaUrl = bloco.myMapsEmbedUrl;
      this.mapaTitulo = `Mapa - ${bloco.nomeDoBloco || 'Percurso'}`;
    }
  }

  fecharMapa() {
    this.mapaUrl = '';
    this.mapaTitulo = '';
  }

  fecharVisualizarPercurso() {
    this.blocoParaVisualizarPercurso = null;
    this.voltarParaModalAcoes();
  }

  abrirModalRemover(bloco: any) {
    this.blocoParaRemover = bloco;
  }

  fecharModalRemover() {
    this.blocoParaRemover = null;
    this.voltarParaModalAcoes();
  }

  abrirDocumentoBelotur(bloco: any) {
    this.blocoParaDocumento = bloco;
  }

  fecharDocumentoBelotur() {
    this.blocoParaDocumento = null;
    this.voltarParaModalAcoes();
  }

  abrirDocumentoMymaps(bloco: any) {
    this.blocoParaDocumentoMymaps = bloco;
  }

  fecharDocumentoMymaps() {
    this.blocoParaDocumentoMymaps = null;
    this.voltarParaModalAcoes();
  }

  abrirDocumentoCompleto(bloco: any) {
    this.router.navigate(['/documento', bloco.id]);
  }

  abrirAcoes(bloco: any) {
    this.blocoParaAcoes = bloco;
  }

  fecharAcoes() {
    this.blocoParaAcoes = null;
  }

  onAcaoDocumentoBelotur(bloco: any) {
    this.blocoAcoesAtivo = bloco;
    this.blocoParaAcoes = null;
    this.abrirDocumentoBelotur(bloco);
  }

  onAcaoUploadKml(bloco: any) {
    this.blocoAcoesAtivo = bloco;
    this.blocoParaAcoes = null;
    this.abrirUploadKml(bloco);
  }

  onAcaoVisualizarPercurso(bloco: any) {
    this.blocoAcoesAtivo = bloco;
    this.blocoParaAcoes = null;
    this.abrirVisualizarPercurso(bloco);
  }

  onAcaoDocumentoMymaps(bloco: any) {
    this.blocoAcoesAtivo = bloco;
    this.blocoParaAcoes = null;
    this.abrirDocumentoMymaps(bloco);
  }

  onAcaoDocumentoCompleto(bloco: any) {
    this.blocoAcoesAtivo = bloco;
    this.blocoParaAcoes = null;
    this.abrirDocumentoCompleto(bloco);
  }

  onAcaoRemoverArquivo(bloco: any) {
    this.blocoAcoesAtivo = bloco;
    this.blocoParaAcoes = null;
    this.abrirModalRemover(bloco);
  }

  // Handlers dos CRUDs
  onAcaoGerenciarAgentes(bloco: any) {
    this.blocoAcoesAtivo = bloco;
    this.blocoParaAcoes = null;
    this.blocoParaCrudAgentes = bloco;
  }

  onAcaoGerenciarDesvios(bloco: any) {
    this.blocoAcoesAtivo = bloco;
    this.blocoParaAcoes = null;
    this.blocoParaCrudDesvios = bloco;
  }

  onAcaoGerenciarFaixasTecido(bloco: any) {
    this.blocoAcoesAtivo = bloco;
    this.blocoParaAcoes = null;
    this.blocoParaCrudFaixasTecido = bloco;
  }

  onAcaoGerenciarFechamentos(bloco: any) {
    this.blocoAcoesAtivo = bloco;
    this.blocoParaAcoes = null;
    this.blocoParaCrudFechamentos = bloco;
  }

  onAcaoGerenciarReservasArea(bloco: any) {
    this.blocoAcoesAtivo = bloco;
    this.blocoParaAcoes = null;
    this.blocoParaCrudReservasArea = bloco;
  }

  onAcaoGerenciarSinalizacoes(bloco: any) {
    this.blocoAcoesAtivo = bloco;
    this.blocoParaAcoes = null;
    this.blocoParaCrudSinalizacoes = bloco;
  }

  fecharCrudAgentes() {
    this.blocoParaCrudAgentes = null;
    this.voltarParaModalAcoes();
  }

  fecharCrudDesvios() {
    this.blocoParaCrudDesvios = null;
    this.voltarParaModalAcoes();
  }

  fecharCrudFaixasTecido() {
    this.blocoParaCrudFaixasTecido = null;
    this.voltarParaModalAcoes();
  }

  fecharCrudFechamentos() {
    this.blocoParaCrudFechamentos = null;
    this.voltarParaModalAcoes();
  }

  fecharCrudReservasArea() {
    this.blocoParaCrudReservasArea = null;
    this.voltarParaModalAcoes();
  }

  fecharCrudSinalizacoes() {
    this.blocoParaCrudSinalizacoes = null;
    this.voltarParaModalAcoes();
  }

  async salvarAgentes(agentes: Agentes[]) {
    await this.salvarDadosBloco(this.blocoParaCrudAgentes, { agentes });
    this.fecharCrudAgentes();
  }

  async salvarDesvios(desvios: Desvios[]) {
    await this.salvarDadosBloco(this.blocoParaCrudDesvios, { desvios });
    this.fecharCrudDesvios();
  }

  async salvarFaixasTecido(faixasTecido: FaixaTecido[]) {
    await this.salvarDadosBloco(this.blocoParaCrudFaixasTecido, { faixasTecido });
    this.fecharCrudFaixasTecido();
  }

  async salvarFechamentos(fechamentos: Fechamentos[]) {
    await this.salvarDadosBloco(this.blocoParaCrudFechamentos, { fechamentos });
    this.fecharCrudFechamentos();
  }

  async salvarReservasArea(reservasArea: ReservaDeArea[]) {
    await this.salvarDadosBloco(this.blocoParaCrudReservasArea, { reservasArea });
    this.fecharCrudReservasArea();
  }

  async salvarSinalizacoes(sinalizacoes: Sinalizacao[]) {
    await this.salvarDadosBloco(this.blocoParaCrudSinalizacoes, { sinalizacoes });
    this.fecharCrudSinalizacoes();
  }

  private async salvarDadosBloco(bloco: any, dados: any) {
    if (!bloco?.id) return;

    try {
      const docRef = doc(this.firestore, 'blocos', bloco.id);
      await updateDoc(docRef, dados);

      // Atualiza o bloco na lista local
      const index = this.blocos.findIndex(b => b.id === bloco.id);
      if (index !== -1) {
        this.blocos[index] = { ...this.blocos[index], ...dados };
      }
    } catch (error: any) {
      console.error('Erro ao salvar dados:', error);
      alert(`Erro ao salvar: ${error.message}`);
    }
  }

  private voltarParaModalAcoes() {
    if (this.blocoAcoesAtivo) {
      // Atualiza o bloco com dados mais recentes da lista
      const blocoAtualizado = this.blocos.find(b => b.numeroInscricao === this.blocoAcoesAtivo.numeroInscricao);
      this.blocoParaAcoes = blocoAtualizado || this.blocoAcoesAtivo;
      this.blocoAcoesAtivo = null;
    }
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
        this.voltarParaModalAcoes();
      });

    } catch (error: any) {
      console.error('Erro ao remover arquivo:', error);
      alert(`Erro ao remover arquivo: ${error.message}`);
      this.blocoParaRemover = null;
      this.voltarParaModalAcoes();
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
