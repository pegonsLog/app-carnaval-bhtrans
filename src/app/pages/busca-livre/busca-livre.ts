import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroMagnifyingGlass, heroXMark, heroEye, heroMapPin } from '@ng-icons/heroicons/outline';
import { BlocosService } from '../../services/blocos';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-busca-livre',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon],
  viewProviders: [provideIcons({ heroMagnifyingGlass, heroXMark, heroEye, heroMapPin })],
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

  constructor(
    private blocosService: BlocosService,
    private router: Router,
    public authService: AuthService
  ) {}

  async ngOnInit() {
    await this.carregarDados();
  }

  async carregarDados() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      console.log('Carregando dados para busca livre...');
      
      // Carrega todos os blocos
      const todosBlocos = await this.blocosService.getBlocos();
      
      // Filtra por perfil do usuário
      this.blocos = this.filtrarPorPerfil(todosBlocos);
      
      // Extrai regionais e datas disponíveis
      this.extrairFiltrosDisponiveis();
      
      console.log('Dados carregados:', this.blocos.length, 'blocos');
      
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      this.errorMessage = 'Erro ao carregar dados. Tente novamente.';
    } finally {
      this.isLoading = false;
    }
  }

  private filtrarPorPerfil(blocos: any[]): any[] {
    if (!this.authService.filtraPorArea) {
      return blocos;
    }

    const regionaisPermitidas = this.authService.regionaisDaArea;
    return blocos.filter(bloco => 
      regionaisPermitidas.includes(bloco.regional)
    );
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
    this.datasDesfileDisponiveis = Array.from(datasSet).sort();
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

    this.blocosEncontrados = this.blocos.filter(bloco => {
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
    });
  }

  private buscaEmTodosCampos(bloco: any, termo: string): boolean {
    const termoLower = termo.toLowerCase();
    
    const campos = [
      bloco.nomeDoBloco,
      bloco.regional,
      bloco.responsavel,
      bloco.telefone,
      bloco.email,
      bloco.concentracao,
      bloco.dispersao,
      bloco.observacoes,
      this.formatarDataParaFiltro(bloco.dataDoDesfile)
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
    this.router.navigate(['/documento', bloco.id]);
  }

  verNoMapa(bloco: any) {
    if (bloco.coordenadas && bloco.coordenadas.length > 0) {
      this.router.navigate(['/mapa'], { 
        queryParams: { 
          bloco: bloco.id,
          nome: bloco.nomeDoBloco 
        } 
      });
    }
  }

  getDiaSemana(data: string): string {
    try {
      const dataObj = new Date(data.split('/').reverse().join('-'));
      const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      return diasSemana[dataObj.getDay()];
    } catch {
      return '';
    }
  }
}