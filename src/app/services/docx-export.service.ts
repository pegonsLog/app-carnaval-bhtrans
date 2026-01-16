import { Injectable } from '@angular/core';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';
import { Capa } from '../interfaces/capa.interface';

@Injectable({
  providedIn: 'root',
})
export class DocxExportService {
  async exportarDocumento(bloco: any, capa: Capa | null, parsedMymaps: any): Promise<void> {
    const sections: Paragraph[] = [];

    // PÁGINA 1: CAPA
    if (capa) {
      sections.push(...this.criarCapa(bloco, capa));
    }

    // PÁGINA 2: DADOS DO BLOCO
    sections.push(...this.criarDadosBloco(bloco));

    // PÁGINA 3: DADOS OPERACIONAIS
    if (parsedMymaps?.secoes?.length > 0) {
      sections.push(...this.criarDadosOperacionais(bloco, parsedMymaps));
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: { width: 11906, height: 16838 }, // A4
              margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 },
            },
          },
          children: sections,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const nomeArquivo = `${bloco.nomeDoBloco || 'documento'}.docx`.replace(/[^a-zA-Z0-9áéíóúãõâêîôûàèìòùç\s\-_.]/gi, '');
    saveAs(blob, nomeArquivo);
  }

  private criarCapa(bloco: any, capa: Capa): Paragraph[] {
    return [
      this.paragrafoCentralizado('Empresa de Transportes e Trânsito de Belo Horizonte S/A - BHTRANS', 11),
      this.paragrafoCentralizado('Diretoria de Ação Regional e Operação – DRO', 11),
      this.paragrafoCentralizado('Superintendência de Ação Regional – SARE', 11),
      this.paragrafoCentralizado(capa.gerencia || '', 11),
      new Paragraph({ spacing: { after: 1200 } }),
      this.paragrafoCentralizado(bloco.nomeDoBloco || 'NOME DO BLOCO', 18, true),
      new Paragraph({ spacing: { after: 2400 } }),
      this.paragrafoCentralizado(`Elaboração: ${capa.elaboradoPor || ''}`, 11),
      new Paragraph({ spacing: { after: 1200 } }),
      this.paragrafoCentralizado('BELO HORIZONTE', 11, true),
      this.paragrafoCentralizado(this.formatarData(capa.dataElaboracao) || '', 11),
      new Paragraph({ children: [new PageBreak()] }),
    ];
  }


  private criarDadosBloco(bloco: any): Paragraph[] {
    const paragraphs: Paragraph[] = [
      this.tituloSecao('DADOS DO BLOCO'),
      new Paragraph({ spacing: { after: 200 } }),

      // Identificação
      this.subtituloSecao('IDENTIFICAÇÃO DO BLOCO'),
      this.campoValor('Nome do Bloco', bloco.nomeDoBloco),
      this.campoValor('Nº Inscrição', bloco.numeroInscricao),
      this.campoValor('Categoria', bloco.categoriaDoBloco),
      this.campoValor('Período', bloco.periodo),
      this.campoValor('Regional', bloco.regional),
      new Paragraph({ spacing: { after: 200 } }),

      // Responsável
      this.subtituloSecao('RESPONSÁVEL LEGAL'),
      this.campoValor('Nome', bloco.responsavelLegal),
      this.campoValor('CPF', bloco.cpf),
      this.campoValor('CNPJ', bloco.cnpj),
      this.campoValor('E-mail', bloco.email),
      this.campoValor('Telefone', bloco.telefone),
      this.campoValor('Celular', bloco.celular),
      new Paragraph({ spacing: { after: 200 } }),

      // Data e Horários
      this.subtituloSecao('DATA E HORÁRIOS DO DESFILE'),
      this.campoValor('Data do Desfile', this.formatarDataFirestore(bloco.dataDoDesfile)),
      this.campoValor('Concentração', bloco.horarioDeconcentracao),
      this.campoValor('Início', bloco.inicioDoDesfile),
      this.campoValor('Encerramento', bloco.horarioEncerramento),
      this.campoValor('Duração', bloco.duracaoDoDesfile),
      this.campoValor('Dispersão', bloco.horarioDispersao),
      new Paragraph({ spacing: { after: 200 } }),

      // Público
      this.subtituloSecao('PÚBLICO ESTIMADO'),
      this.campoValor('Público Anterior', this.formatarNumero(bloco.publicoAnterior)),
      this.campoValor('Público Declarado', this.formatarNumero(bloco.publicoDeclarado)),
      this.campoValor('Área do Trajeto', `${this.formatarNumero(bloco.areaDoTrajetoM2)} m²`),
      this.campoValor('Capacidade', `${this.formatarNumero(bloco.capacidadePublicoDoTrajeto)} pessoas`),
      ...(bloco.observacoesAnoAnterior ? [this.campoValor('Observações Ano Anterior', bloco.observacoesAnoAnterior)] : []),
      new Paragraph({ spacing: { after: 200 } }),

      // Percurso
      this.subtituloSecao('PERCURSO E LOCALIZAÇÃO'),
      this.campoValor('Percurso', bloco.percurso),
      this.campoValor('End. Concentração', bloco.enderecoDeConcentracao),
      this.campoValor('Bairro Concentração', bloco.bairroDeConcentracao),
      this.campoValor('End. Dispersão', bloco.enderecoDeDispersao),
      this.campoValor('Bairro Dispersão', bloco.bairroDeDispersao),
      this.campoValor('Extensão', `${this.formatarNumero(bloco.extensaoDoDesfileMetros)} m`),
      this.campoValor('Nº de Quadras', bloco.numeroDeQuadras),
      new Paragraph({ spacing: { after: 200 } }),

      // Características
      this.subtituloSecao('CARACTERÍSTICAS'),
      this.campoValor('Perfil', bloco.perfil),
      this.campoValor('Estilo Musical', bloco.estiloDeMusica),
      this.campoValor('Descrição', bloco.descricaoDoBloco),
      new Paragraph({ spacing: { after: 200 } }),

      // Status
      this.subtituloSecao('STATUS'),
      this.campoValor('Possui Desfiles', this.formatarBoolean(bloco.possuiDesfiles)),
      this.campoValor('Status do Desfile', bloco.statusDoDesfile),
      ...(bloco.justificativaStatus ? [this.campoValor('Justificativa', bloco.justificativaStatus)] : []),
      this.campoValor('Autoriza Divulgação', this.formatarBoolean(bloco.autorizaDivulgacao)),
      this.campoValor('Primeiro Cadastro', this.formatarBoolean(bloco.primeiroCadastro)),
      new Paragraph({ spacing: { after: 200 } }),

      // Equipamentos
      this.subtituloSecao('EQUIPAMENTOS E DIMENSÕES'),
      this.campoValor('Equipamentos', this.formatarArray(bloco.equipamentosUtilizados)),
      this.campoValor('Largura', `${bloco.larguraMetros || '-'} m`),
      this.campoValor('Comprimento', `${bloco.comprimentoMetros || '-'} m`),
      this.campoValor('Altura', `${bloco.alturaMetros || '-'} m`),
      this.campoValor('Potência', `${this.formatarNumero(bloco.potenciaWatts)} W`),
      ...(bloco.dimensaoDeVeiculos ? [this.campoValor('Dimensão de Veículos', bloco.dimensaoDeVeiculos)] : []),
      new Paragraph({ spacing: { after: 200 } }),

      // Informações Adicionais
      ...(bloco.informacoesAdicionais ? [
        this.subtituloSecao('INFORMAÇÕES ADICIONAIS'),
        this.campoValor('', bloco.informacoesAdicionais),
        new Paragraph({ spacing: { after: 200 } }),
      ] : []),

      // Responsável Secundário
      ...(bloco.nomeResponsavelSecundario || bloco.celularContato2 ? [
        this.subtituloSecao('RESPONSÁVEL SECUNDÁRIO'),
        this.campoValor('Nome', bloco.nomeResponsavelSecundario),
        this.campoValor('Celular', bloco.celularContato2),
        new Paragraph({ spacing: { after: 200 } }),
      ] : []),

      new Paragraph({ children: [new PageBreak()] }),
    ];

    return paragraphs;
  }


  private criarDadosOperacionais(bloco: any, parsedMymaps: any): Paragraph[] {
    const paragraphs: Paragraph[] = [
      this.tituloSecao('DADOS OPERACIONAIS'),
      this.paragrafoCentralizado(bloco.nomeDoBloco || '', 11, false, true),
      new Paragraph({ spacing: { after: 300 } }),
    ];

    for (const secao of parsedMymaps.secoes) {
      paragraphs.push(this.subtituloSecao(secao.titulo?.toUpperCase() || ''));

      if (secao.placemarks?.length > 0) {
        for (let i = 0; i < secao.placemarks.length; i++) {
          const placemark = secao.placemarks[i];
          const qtdText = placemark.quantidade > 1 ? ` (${placemark.quantidade})` : '';

          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${i + 1}. `, bold: true, size: 20 }),
                new TextRun({ text: placemark.name, bold: true, size: 20 }),
                new TextRun({ text: qtdText, bold: true, color: '667eea', size: 20 }),
              ],
              spacing: { after: 100 },
            })
          );

          // Descrições
          if (placemark.descriptions?.length > 0) {
            for (const descGroup of placemark.descriptions) {
              for (const linha of descGroup) {
                const linhaLimpa = linha.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/^- /, '');
                paragraphs.push(
                  new Paragraph({
                    children: [new TextRun({ text: `    ${linhaLimpa}`, size: 18 })],
                    spacing: { after: 50 },
                  })
                );
              }
            }
          }
        }

        // Total da seção
        if (secao.totalItens > 0) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Total: ', bold: true, size: 20 }),
                new TextRun({ text: `${secao.totalItens} item(ns)`, size: 20 }),
              ],
              spacing: { before: 150, after: 200 },
              shading: { fill: 'f0f4f8' },
            })
          );
        }
      } else {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: 'Nenhum item cadastrado nesta seção.', italics: true, size: 20 })],
            spacing: { after: 200 },
          })
        );
      }

      paragraphs.push(new Paragraph({ spacing: { after: 200 } }));
    }

    return paragraphs;
  }

  // Helpers
  private paragrafoCentralizado(texto: string, tamanho: number, negrito = false, italico = false): Paragraph {
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: texto, size: tamanho * 2, bold: negrito, italics: italico })],
      spacing: { after: 100 },
    });
  }

  private tituloSecao(texto: string): Paragraph {
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: texto, bold: true, size: 28, color: '1a365d' })],
      spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: '1a365d' } },
    });
  }

  private subtituloSecao(texto: string): Paragraph {
    return new Paragraph({
      children: [new TextRun({ text: texto, bold: true, size: 22, color: '1a365d' })],
      spacing: { before: 150, after: 100 },
      shading: { fill: 'f0f4f8' },
      border: { left: { style: BorderStyle.SINGLE, size: 18, color: '667eea' } },
    });
  }

  private campoValor(label: string, valor: any): Paragraph {
    return new Paragraph({
      children: [
        new TextRun({ text: `${label}: `, bold: true, size: 20 }),
        new TextRun({ text: valor || '-', size: 20 }),
      ],
      spacing: { after: 80 },
    });
  }

  private formatarData(data: any): string {
    if (!data) return '';
    if (typeof data === 'string') return data;
    if (data.toDate) {
      const d = data.toDate();
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }
    if (data instanceof Date) {
      return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
    }
    return String(data);
  }

  private formatarDataFirestore(value: any): string {
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

  private formatarBoolean(value: boolean | undefined): string {
    if (value === undefined || value === null) return '-';
    return value ? 'Sim' : 'Não';
  }

  private formatarArray(value: any[]): string {
    if (!value || !Array.isArray(value) || value.length === 0) return '-';
    return value.join(', ');
  }

  private formatarNumero(value: number | undefined): string {
    if (value === undefined || value === null) return '-';
    return value.toLocaleString('pt-BR');
  }
}
