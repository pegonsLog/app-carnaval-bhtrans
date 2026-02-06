import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroMagnifyingGlass, heroXMark, heroEye, heroMapPin, heroArrowLeft } from '@ng-icons/heroicons/outline';
import { BlocosService } from '../../services/blocos';

@Component({
  selector: 'app-busca-livre',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon],
  viewProviders: [provideIcons({ heroMagnifyingGlass, heroXMark, heroEye, heroMapPin, heroArrowLeft })],
  templateUrl: './busca-livre.html',
  styleUrl: './busca-livre.scss'
})
export class BuscaLivreComponent implements OnInit {
  termoBusca = '';
  filtroRegional = '';
  filtroDataDesfile = '';
  
  blocos: any[] = [];
  blocosEncontrados: any[] = [];
  isLoading = false;
  errorMessage = '';
  
  regionaisDisponiveis: string[] = [];
  datasDesfileDisponiveis: string[] = [];
  
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
      this.termoBusca = state['termoBusca'] || '';
      this.filtroRegional = state['filtroRegional'] || '';
      this.filtroDataDesfile = state['filtroDataDesfile'] || '';
      this.blocoDestacadoId = state['blocoId'] || null;
    }
  }

  async ngOnInit() {
    await this.carregarDados();
    
    // Se voltou do mapa, executa a busca para restaurar os resultados
    if (this.termoBusca || this.filtroRegional || this.filtroDataDesfile) {
      this.buscar();
      
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

  async carregarDados() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      // Carrega apenas blocos aprovados e alterados (acesso público)
      this.blocos = await this.blocosService.getBlocosPublicos();
      
      // Extrai regionais e datas disponíveis
      this.extrairFiltrosDisponiveis();
      
      this.cdr.detectChanges();
      
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      this.errorMessage = 'Erro ao carregar dados. Tente novamente.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private extrairFiltrosDisponiveis() {
    // Extrai regionais únicas
    const regionaisSet = new Set<string>();
    const datasSet = new Set<string>();

    this.blocos.forEach(bloco => {
      if (bloco.regional) {
        regionaisSet.add(bloco.regional);
      }
      if (bloco.dataDoDesfile) {
        const dataFormatada = this.formatarDataParaFiltro(bloco.dataDoDesfile);
        if (dataFormatada) {
          datasSet.add(dataFormatada);
        }
      }
    });

    this.regionaisDisponiveis = Array.from(regionaisSet).sort();
    this.datasDesfileDisponiveis = Array.from(datasSet).sort((a, b) => {
      const [diaA, mesA, anoA] = a.split('/').map(Number);
      const [diaB, mesB, anoB] = b.split('/').map(Number);
      return new Date(anoA, mesA - 1, diaA).getTime() - new Date(anoB, mesB - 1, diaB).getTime();
    });
  }

  formatarDataParaFiltro(data: any): string {
    if (!data) return '';
    
    try {
      let dataObj: Date;
      
      if (data.toDate && typeof data.toDate === 'function') {
        dataObj = data.toDate();
      } else if (data instanceof Date) {
        dataObj = data;
      } else if (typeof data === 'string') {
        dataObj = new Date(data);
      } else {
        return '';
      }

      return dataObj.toLocaleDateString('pt-BR');
    } catch (error) {
      console.warn('Erro ao formatar data:', error);
      return '';
    }
  }

  buscar() {
    if (!this.termoBusca.trim() && !this.filtroRegional && !this.filtroDataDesfile) {
      this.blocosEncontrados = [];
      return;
    }

    this.blocosEncontrados = this.blocos
      .filter(bloco => {
        // Filtro de busca livre
        const buscaMatch = !this.termoBusca.trim() || 
          this.buscaEmTodosCampos(bloco, this.termoBusca);

        // Filtro de regional
        const regionalMatch = !this.filtroRegional || 
          bloco.regional === this.filtroRegional;

        // Filtro de data
        const dataMatch = !this.filtroDataDesfile || 
          this.formatarDataParaFiltro(bloco.dataDoDesfile) === this.filtroDataDesfile;

        return buscaMatch && regionalMatch && dataMatch;
      })
      .sort((a, b) => (a.nomeDoBloco || '').localeCompare(b.nomeDoBloco || '', 'pt-BR'));
  }

  private buscaEmTodosCampos(bloco: any, termo: string): boolean {
    const termoLower = termo.toLowerCase();
    
    const campos = [
      // Informações Básicas
      bloco.periodo,
      bloco.statusDoDesfile,
      bloco.justificativaStatus,
      bloco.numeroInscricao,
      bloco.nomeDoBloco,
      bloco.categoriaDoBloco,
      
      // Informações de Público
      bloco.publicoAnterior?.toString(),
      bloco.publicoDeclarado?.toString(),
      bloco.observacoesAnoAnterior,
      
      // Características do Bloco
      bloco.perfil,
      bloco.estiloDeMusica,
      bloco.descricaoDoBloco,
      
      // Informações de Data e Horário
      this.formatarDataParaFiltro(bloco.dataDoDesfile),
      bloco.horarioDeconcentracao,
      bloco.inicioDoDesfile,
      bloco.horarioEncerramento,
      bloco.duracaoDoDesfile,
      bloco.horarioDispersao,
      
      // Equipamentos e Dimensões
      bloco.equipamentosUtilizados?.join(' '),
      bloco.larguraMetros?.toString(),
      bloco.comprimentoMetros?.toString(),
      bloco.alturaMetros?.toString(),
      bloco.potenciaWatts?.toString(),
      bloco.dimensaoDeVeiculos,
      
      // Localização e Percurso
      bloco.percurso,
      bloco.regional,
      bloco.enderecoDeConcentracao,
      bloco.bairroDeConcentracao,
      bloco.enderecoDeDispersao,
      bloco.bairroDeDispersao,
      bloco.extensaoDoDesfileMetros?.toString(),
      bloco.numeroDeQuadras?.toString(),
      bloco.areaDoTrajetoM2?.toString(),
      bloco.capacidadePublicoDoTrajeto?.toString(),
      
      // Informações Adicionais
      bloco.informacoesAdicionais,
      
      // Responsável Legal
      bloco.responsavelLegal,
      bloco.cnpj,
      bloco.cpf,
      bloco.email,
      bloco.telefone,
      bloco.celular,
      
      // Responsável Secundário
      bloco.nomeResponsavelSecundario,
      bloco.celularContato2
    ];

    return campos.some(campo => 
      campo && campo.toString().toLowerCase().includes(termoLower)
    );
  }

  limparFiltros() {
    this.termoBusca = '';
    this.filtroRegional = '';
    this.filtroDataDesfile = '';
    this.blocosEncontrados = [];
  }

  verDetalhes(bloco: any) {
    this.router.navigate(['/documento', bloco.id], {
      state: {
        returnUrl: '/busca-livre',
        termoBusca: this.termoBusca,
        filtroRegional: this.filtroRegional,
        filtroDataDesfile: this.filtroDataDesfile,
        blocoId: bloco.id
      }
    });
  }

  verNoMapa(bloco: any) {
    const url = bloco.myMapsEmbedUrl || bloco.percursoUrl;
    if (url) {
      this.router.navigate(['/mapa'], {
        queryParams: { 
          url, 
          titulo: bloco.nomeDoBloco,
          returnUrl: '/busca-livre'
        },
        state: {
          termoBusca: this.termoBusca,
          filtroRegional: this.filtroRegional,
          filtroDataDesfile: this.filtroDataDesfile,
          blocoId: bloco.id
        }
      });
    }
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

  temMapa(bloco: any): boolean {
    return !!(bloco.myMapsEmbedUrl || bloco.percursoUrl);
  }

  voltar() {
    this.router.navigate(['/']);
  }
}