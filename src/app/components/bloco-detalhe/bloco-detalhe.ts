import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroXMark, heroEllipsisHorizontal } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-bloco-detalhe',
  imports: [CommonModule, NgIcon],
  viewProviders: [provideIcons({ heroXMark, heroEllipsisHorizontal })],
  templateUrl: './bloco-detalhe.html',
  styleUrl: './bloco-detalhe.scss'
})
export class BlocoDetalheComponent {
  @Input() bloco: any = null;
  @Output() fechar = new EventEmitter<void>();

  activeTooltip: string | null = null;
  tooltipContent = '';

  // Grupos de campos para organizar a exibição
  grupos = [
    {
      titulo: 'Informações Básicas',
      campos: [
        { key: 'periodo', label: 'Período' },
        { key: 'possuiDesfiles', label: 'Possui Desfiles' },
        { key: 'statusDoDesfile', label: 'Status do Desfile' },
        { key: 'justificativaStatus', label: 'Justificativa' },
        { key: 'numeroInscricao', label: 'Nº Inscrição' },
        { key: 'nomeDoBloco', label: 'Nome do Bloco' },
        { key: 'categoriaDoBloco', label: 'Categoria' },
        { key: 'autorizaDivulgacao', label: 'Autoriza Divulgação' },
        { key: 'dataCadastroModificacao', label: 'Data Cadastro' },
        { key: 'primeiroCadastro', label: 'Primeiro Cadastro' }
      ]
    },
    {
      titulo: 'Público',
      campos: [
        { key: 'publicoAnterior', label: 'Público Anterior' },
        { key: 'publicoDeclarado', label: 'Público Declarado' },
        { key: 'observacoesAnoAnterior', label: 'Observações Ano Anterior' }
      ]
    },
    {
      titulo: 'Características do Bloco',
      campos: [
        { key: 'perfil', label: 'Perfil' },
        { key: 'estiloDeMusica', label: 'Estilo Musical' },
        { key: 'descricaoDoBloco', label: 'Descrição' }
      ]
    },
    {
      titulo: 'Data e Horário',
      campos: [
        { key: 'dataDoDesfile', label: 'Data do Desfile' },
        { key: 'horarioDeconcentracao', label: 'Horário Concentração' },
        { key: 'inicioDoDesfile', label: 'Início do Desfile' },
        { key: 'horarioEncerramento', label: 'Horário Encerramento' },
        { key: 'duracaoDoDesfile', label: 'Duração' },
        { key: 'horarioDispersao', label: 'Horário Dispersão' }
      ]
    },
    {
      titulo: 'Equipamentos e Dimensões',
      campos: [
        { key: 'equipamentosUtilizados', label: 'Equipamentos' },
        { key: 'larguraMetros', label: 'Largura (m)' },
        { key: 'comprimentoMetros', label: 'Comprimento (m)' },
        { key: 'alturaMetros', label: 'Altura (m)' },
        { key: 'potenciaWatts', label: 'Potência (W)' },
        { key: 'dimensaoDeVeiculos', label: 'Dimensão Veículos' }
      ]
    },
    {
      titulo: 'Localização e Percurso',
      campos: [
        { key: 'percurso', label: 'Percurso' },
        { key: 'regional', label: 'Regional' },
        { key: 'enderecoDeConcentracao', label: 'Endereço Concentração' },
        { key: 'bairroDeConcentracao', label: 'Bairro Concentração' },
        { key: 'enderecoDeDispersao', label: 'Endereço Dispersão' },
        { key: 'bairroDeDispersao', label: 'Bairro Dispersão' },
        { key: 'extensaoDoDesfileMetros', label: 'Extensão (m)' },
        { key: 'numeroDeQuadras', label: 'Nº Quadras' },
        { key: 'areaDoTrajetoM2', label: 'Área (m²)' },
        { key: 'capacidadePublicoDoTrajeto', label: 'Capacidade Público' }
      ]
    },
    {
      titulo: 'Informações Adicionais',
      campos: [
        { key: 'informacoesAdicionais', label: 'Informações Adicionais' }
      ]
    },
    {
      titulo: 'Responsável Legal',
      campos: [
        { key: 'responsavelLegal', label: 'Nome' },
        { key: 'cnpj', label: 'CNPJ' },
        { key: 'cpf', label: 'CPF' },
        { key: 'email', label: 'E-mail' },
        { key: 'telefone', label: 'Telefone' },
        { key: 'celular', label: 'Celular' },
        { key: 'nomeResponsavelSecundario', label: 'Responsável Secundário' },
        { key: 'celularContato2', label: 'Celular Contato 2' }
      ]
    }
  ];

  formatValue(value: any, key: string): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '-';
    
    if (key.toLowerCase().includes('data') && value) {
      try {
        const date = value.toDate ? value.toDate() : new Date(value);
        if (!isNaN(date.getTime())) return date.toLocaleDateString('pt-BR');
      } catch { return String(value); }
    }
    return String(value);
  }

  isTextLong(value: any): boolean {
    return String(value || '').length > 40;
  }

  getTruncatedText(value: any): string {
    const text = String(value || '-');
    return text.length > 40 ? text.substring(0, 40) + '...' : text;
  }

  showTooltip(key: string, value: any) {
    this.activeTooltip = key;
    this.tooltipContent = this.formatValue(value, key);
  }

  hideTooltip() {
    this.activeTooltip = null;
    this.tooltipContent = '';
  }

  onFechar() {
    this.fechar.emit();
  }
}
