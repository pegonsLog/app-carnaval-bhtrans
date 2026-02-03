import { Injectable } from '@angular/core';
import { Storage, ref, getBytes } from '@angular/fire/storage';
import { jsPDF } from 'jspdf';
import { Capa } from '../interfaces/capa.interface';
import { CapasService } from './capas';

@Injectable({
    providedIn: 'root',
})
export class PdfExportService {
    private readonly PAGE_WIDTH = 210;
    private readonly PAGE_HEIGHT = 297;
    private readonly MARGIN = 15;
    private readonly CONTENT_WIDTH = 180;

    constructor(
        private storage: Storage,
        private capasService: CapasService
    ) { }

    async exportarPdf(bloco: any): Promise<void> {
        const doc = new jsPDF('p', 'mm', 'a4');

        // Carrega a capa baseada na regional
        const capa = await this.carregarCapa(bloco.regional);

        // Carrega a logo
        const logoBase64 = await this.carregarLogo();

        // Carrega dados do MyMaps se existir
        let parsedMymaps: any = { titulo: '', secoes: [] };
        if (bloco.percursoUrl) {
            parsedMymaps = await this.carregarMymaps(bloco.percursoUrl);
        }

        // PÁGINA 1: CAPA (página separada)
        if (capa) {
            this.criarCapa(doc, bloco, capa, logoBase64);
            doc.addPage();
        }

        // CONTEÚDO CONTÍNUO: Dados do Bloco + Mapa + Dados Operacionais
        let currentY = this.criarDadosBloco(doc, bloco);

        // Link do Mapa (continua na mesma página se couber)
        if (bloco.myMapsEmbedUrl) {
            currentY = this.adicionarSecaoMapa(doc, bloco, currentY);
        }

        // Dados Operacionais (continua na mesma página se couber)
        if (parsedMymaps?.secoes?.length > 0) {
            this.criarDadosOperacionais(doc, bloco, parsedMymaps, currentY);
        }

        // Salva o PDF
        const nomeArquivo = `${bloco.nomeDoBloco || 'documento'}.pdf`.replace(
            /[^a-zA-Z0-9áéíóúãõâêîôûàèìòùç\s\-_.]/gi,
            ''
        );
        doc.save(nomeArquivo);
    }

    private async carregarLogo(): Promise<string | null> {
        try {
            const response = await fetch('assets/logomarcas/logomarcas.png');
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Erro ao carregar logo:', error);
            return null;
        }
    }


    private async carregarCapa(regional: string): Promise<Capa | null> {
        try {
            const capas = await this.capasService.getCapas();
            const regionalBloco = regional?.trim().toLowerCase();

            if (regionalBloco) {
                return (
                    capas.find((c: Capa) =>
                        c.regionais?.some((r) => r.trim().toLowerCase() === regionalBloco)
                    ) || null
                );
            }
            return null;
        } catch (error) {
            console.error('Erro ao carregar capa:', error);
            return null;
        }
    }

    private async carregarMymaps(percursoUrl: string): Promise<any> {
        try {
            const storagePath = this.extrairPathDoStorage(percursoUrl);
            if (storagePath) {
                const storageRef = ref(this.storage, storagePath);
                const bytes = await getBytes(storageRef);
                const decoder = new TextDecoder('utf-8');
                const markdownContent = decoder.decode(bytes);
                return this.parseMarkdown(markdownContent);
            }
        } catch (error) {
            console.error('Erro ao carregar MyMaps:', error);
        }
        return { titulo: '', secoes: [] };
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

    private criarCapa(doc: jsPDF, bloco: any, capa: Capa, logoBase64: string | null): void {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);

        let y = 40;
        const centerX = this.PAGE_WIDTH / 2;

        // Cabeçalho institucional
        doc.text('Empresa de Transportes e Trânsito de Belo Horizonte S/A - BHTRANS', centerX, y, {
            align: 'center',
        });
        y += 6;
        doc.text('Diretoria de Ação Regional e Operação – DRO', centerX, y, { align: 'center' });
        y += 6;
        doc.text('Superintendência de Ação Regional – SARE', centerX, y, { align: 'center' });
        y += 6;
        doc.text(capa.gerencia || '', centerX, y, { align: 'center' });

        // Nome do bloco
        y = 100;
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        const nomeBloco = bloco.nomeDoBloco || 'NOME DO BLOCO';
        doc.text(nomeBloco, centerX, y, { align: 'center' });

        // Logo
        if (logoBase64) {
            try {
                const logoWidth = 120;
                const logoHeight = 40;
                const logoX = (this.PAGE_WIDTH - logoWidth) / 2;
                doc.addImage(logoBase64, 'PNG', logoX, 130, logoWidth, logoHeight);
            } catch (error) {
                console.error('Erro ao adicionar logo:', error);
            }
        }

        // Elaboração
        y = 220;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Elaboração: ${capa.elaboradoPor || ''}`, centerX, y, { align: 'center' });

        // Rodapé
        y = 260;
        doc.setFont('helvetica', 'bold');
        doc.text('BELO HORIZONTE', centerX, y, { align: 'center' });
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.text(this.formatarData(capa.dataElaboracao) || '', centerX, y, { align: 'center' });
    }


    private criarDadosBloco(doc: jsPDF, bloco: any): number {
        let y = this.MARGIN;
        const centerX = this.PAGE_WIDTH / 2;

        // Título
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 54, 93);
        doc.text('DADOS DO BLOCO', centerX, y, { align: 'center' });
        y += 3;
        doc.setDrawColor(26, 54, 93);
        doc.line(this.MARGIN, y, this.PAGE_WIDTH - this.MARGIN, y);
        y += 10;

        // 1. Informações Básicas
        y = this.criarSecao(doc, 'INFORMAÇÕES BÁSICAS', y);
        y = this.campoValor(doc, 'Período', bloco.periodo, y);
        y = this.campoValor(doc, 'Possui Desfiles', this.formatarBoolean(bloco.possuiDesfiles), y);
        y = this.campoValor(doc, 'Status do Desfile', bloco.statusDoDesfile, y);
        if (bloco.justificativaStatus) {
            y = this.campoValor(doc, 'Justificativa', bloco.justificativaStatus, y, true);
        }
        y = this.campoValor(doc, 'Nº Inscrição', bloco.numeroInscricao, y);
        y = this.campoValor(doc, 'Nome do Bloco', bloco.nomeDoBloco, y);
        y = this.campoValor(doc, 'Categoria', bloco.categoriaDoBloco, y);
        y = this.campoValor(doc, 'Autoriza Divulgação', this.formatarBoolean(bloco.autorizaDivulgacao), y);
        y = this.campoValor(doc, 'Data Cadastro', this.formatarDataFirestore(bloco.dataCadastroModificacao), y);
        y = this.campoValor(doc, 'Primeiro Cadastro', this.formatarBoolean(bloco.primeiroCadastro), y);
        y += 5;

        // 2. Público
        y = this.verificarNovaPagina(doc, y);
        y = this.criarSecao(doc, 'PÚBLICO', y);
        y = this.campoValor(doc, 'Público Anterior', this.formatarNumero(bloco.publicoAnterior), y);
        y = this.campoValor(doc, 'Público Declarado', this.formatarNumero(bloco.publicoDeclarado), y);
        if (bloco.observacoesAnoAnterior) {
            y = this.campoValor(doc, 'Observações Ano Anterior', bloco.observacoesAnoAnterior, y, true);
        }
        y += 5;

        // 3. Características do Bloco
        y = this.verificarNovaPagina(doc, y);
        y = this.criarSecao(doc, 'CARACTERÍSTICAS DO BLOCO', y);
        y = this.campoValor(doc, 'Perfil', bloco.perfil, y);
        y = this.campoValor(doc, 'Estilo Musical', bloco.estiloDeMusica, y);
        y = this.campoValor(doc, 'Descrição', bloco.descricaoDoBloco, y, true);
        y += 5;

        // 4. Data e Horário
        y = this.verificarNovaPagina(doc, y);
        y = this.criarSecao(doc, 'DATA E HORÁRIO', y);
        y = this.campoValor(doc, 'Data do Desfile', this.formatarDataFirestore(bloco.dataDoDesfile), y);
        y = this.campoValor(doc, 'Horário Concentração', bloco.horarioDeconcentracao, y);
        y = this.campoValor(doc, 'Início do Desfile', bloco.inicioDoDesfile, y);
        y = this.campoValor(doc, 'Horário Encerramento', bloco.horarioEncerramento, y);
        y = this.campoValor(doc, 'Duração', bloco.duracaoDoDesfile, y);
        y = this.campoValor(doc, 'Horário Dispersão', bloco.horarioDispersao, y);
        y += 5;

        // 5. Equipamentos e Dimensões
        y = this.verificarNovaPagina(doc, y);
        y = this.criarSecao(doc, 'EQUIPAMENTOS E DIMENSÕES', y);
        y = this.campoValor(doc, 'Equipamentos', this.formatarArray(bloco.equipamentosUtilizados), y, true);
        y = this.campoValor(doc, 'Largura (m)', bloco.larguraMetros || '-', y);
        y = this.campoValor(doc, 'Comprimento (m)', bloco.comprimentoMetros || '-', y);
        y = this.campoValor(doc, 'Altura (m)', bloco.alturaMetros || '-', y);
        y = this.campoValor(doc, 'Potência (W)', this.formatarNumero(bloco.potenciaWatts), y);
        if (bloco.dimensaoDeVeiculos) {
            y = this.campoValor(doc, 'Dimensão Veículos', bloco.dimensaoDeVeiculos, y);
        }
        y += 5;

        // 6. Localização e Percurso
        y = this.verificarNovaPagina(doc, y);
        y = this.criarSecao(doc, 'LOCALIZAÇÃO E PERCURSO', y);
        y = this.campoValor(doc, 'Percurso', bloco.percurso, y, true);
        y = this.campoValor(doc, 'Regional', bloco.regional, y);
        y = this.campoValor(doc, 'Endereço Concentração', bloco.enderecoDeConcentracao, y);
        y = this.campoValor(doc, 'Bairro Concentração', bloco.bairroDeConcentracao, y);
        y = this.campoValor(doc, 'Endereço Dispersão', bloco.enderecoDeDispersao, y);
        y = this.campoValor(doc, 'Bairro Dispersão', bloco.bairroDeDispersao, y);
        y = this.campoValor(doc, 'Extensão (m)', this.formatarNumero(bloco.extensaoDoDesfileMetros), y);
        y = this.campoValor(doc, 'Nº Quadras', bloco.numeroDeQuadras, y);
        y = this.campoValor(doc, 'Área (m²)', this.formatarNumero(bloco.areaDoTrajetoM2), y);
        y = this.campoValor(doc, 'Capacidade Público', this.formatarNumero(bloco.capacidadePublicoDoTrajeto), y);
        y += 5;

        // 7. Informações Adicionais
        if (bloco.informacoesAdicionais) {
            y = this.verificarNovaPagina(doc, y);
            y = this.criarSecao(doc, 'INFORMAÇÕES ADICIONAIS', y);
            y = this.campoValor(doc, 'Informações Adicionais', bloco.informacoesAdicionais, y, true);
            y += 5;
        }

        // 8. Responsável Legal
        y = this.verificarNovaPagina(doc, y);
        y = this.criarSecao(doc, 'RESPONSÁVEL LEGAL', y);
        y = this.campoValor(doc, 'Nome', bloco.responsavelLegal, y);
        y = this.campoValor(doc, 'CNPJ', bloco.cnpj, y);
        y = this.campoValor(doc, 'CPF', bloco.cpf, y);
        y = this.campoValor(doc, 'E-mail', bloco.email, y);
        y = this.campoValor(doc, 'Telefone', bloco.telefone, y);
        y = this.campoValor(doc, 'Celular', bloco.celular, y);
        if (bloco.nomeResponsavelSecundario) {
            y = this.campoValor(doc, 'Responsável Secundário', bloco.nomeResponsavelSecundario, y);
        }
        if (bloco.celularContato2) {
            y = this.campoValor(doc, 'Celular Contato 2', bloco.celularContato2, y);
        }
        y += 5;

        return y;
    }

    private verificarNovaPagina(doc: jsPDF, y: number): number {
        if (y > 250) {
            doc.addPage();
            return this.MARGIN;
        }
        return y;
    }

    private adicionarSecaoMapa(doc: jsPDF, bloco: any, startY: number): number {
        let y = startY + 10;

        // Verifica se precisa de nova página
        if (y > 250) {
            doc.addPage();
            y = this.MARGIN;
        }

        // Título da seção
        y = this.criarSecao(doc, 'MAPA DO PERCURSO', y);

        // Informação sobre o mapa
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text('O mapa interativo do percurso está disponível no link abaixo:', this.MARGIN, y);
        y += 8;

        // Link do mapa
        doc.setFontSize(9);
        doc.setTextColor(102, 126, 234);
        doc.setFont('helvetica', 'bold');

        const url = bloco.myMapsEmbedUrl || '';
        const urlDisplay = url.length > 90 ? url.substring(0, 90) + '...' : url;

        doc.textWithLink(urlDisplay, this.MARGIN, y, { url: url });
        y += 6;

        // Instrução
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'italic');
        doc.text('(Clique no link para abrir o mapa no Google My Maps)', this.MARGIN, y);
        y += 5;

        return y;
    }


    private criarDadosOperacionais(doc: jsPDF, bloco: any, parsedMymaps: any, startY: number = this.MARGIN): void {
        let y = startY + 10;

        // Verifica se precisa de nova página
        if (y > 250) {
            doc.addPage();
            y = this.MARGIN;
        }

        // Título da seção
        y = this.criarSecao(doc, 'DADOS OPERACIONAIS', y);
        y += 3;

        for (const secao of parsedMymaps.secoes) {
            // Verifica se precisa de nova página
            if (y > 260) {
                doc.addPage();
                y = this.MARGIN;
            }

            y = this.criarSecao(doc, secao.titulo?.toUpperCase() || '', y);

            if (secao.placemarks?.length > 0) {
                for (let i = 0; i < secao.placemarks.length; i++) {
                    const placemark = secao.placemarks[i];
                    const qtdText = placemark.quantidade > 1 ? ` (${placemark.quantidade})` : '';

                    // Verifica se precisa de nova página
                    if (y > 270) {
                        doc.addPage();
                        y = this.MARGIN;
                    }

                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(0, 0, 0);
                    doc.text(`${i + 1}. ${placemark.name}${qtdText}`, this.MARGIN, y);
                    y += 5;

                    // Descrições
                    if (placemark.descriptions?.length > 0) {
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(9);
                        for (const descGroup of placemark.descriptions) {
                            for (const linha of descGroup) {
                                const linhaLimpa = linha.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/^- /, '');
                                const lines = doc.splitTextToSize(`    ${linhaLimpa}`, this.CONTENT_WIDTH - 10);
                                for (const line of lines) {
                                    if (y > 280) {
                                        doc.addPage();
                                        y = this.MARGIN;
                                    }
                                    doc.text(line, this.MARGIN + 5, y);
                                    y += 4;
                                }
                            }
                        }
                    }
                    y += 2;
                }

                // Total da seção
                if (secao.totalItens > 0) {
                    doc.setFillColor(240, 244, 248);
                    doc.rect(this.MARGIN, y - 2, this.CONTENT_WIDTH, 7, 'F');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(10);
                    doc.text(`Total: ${secao.totalItens} item(ns)`, this.MARGIN + 2, y + 3);
                    y += 10;
                }
            } else {
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(10);
                doc.text('Nenhum item cadastrado nesta seção.', this.MARGIN, y);
                y += 8;
            }

            y += 5;
        }
    }

    private criarSecao(doc: jsPDF, titulo: string, y: number): number {
        doc.setFillColor(240, 244, 248);
        doc.rect(this.MARGIN, y - 4, this.CONTENT_WIDTH, 7, 'F');
        doc.setDrawColor(102, 126, 234);
        doc.line(this.MARGIN, y - 4, this.MARGIN, y + 3);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 54, 93);
        doc.text(titulo, this.MARGIN + 3, y);

        return y + 8;
    }

    private campoValor(doc: jsPDF, label: string, valor: any, y: number, multiline = false): number {
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        doc.setFont('helvetica', 'bold');
        doc.text(`${label}: `, this.MARGIN, y);

        const labelWidth = doc.getTextWidth(`${label}: `);
        doc.setFont('helvetica', 'normal');

        const valorStr = valor !== null && valor !== undefined ? String(valor) : '-';

        if (multiline && valorStr.length > 60) {
            const lines = doc.splitTextToSize(valorStr, this.CONTENT_WIDTH - labelWidth);
            doc.text(lines[0], this.MARGIN + labelWidth, y);
            for (let i = 1; i < lines.length; i++) {
                y += 5;
                doc.text(lines[i], this.MARGIN, y);
            }
        } else {
            doc.text(valorStr, this.MARGIN + labelWidth, y);
        }

        return y + 5;
    }


    private parseMarkdown(md: string): any {
        const data: any = { titulo: '', secoes: [], mapUrl: '' };
        const lines = md.split('\n');
        let currentSection: any = null;
        let currentPlacemark: any = null;
        let placemarks: any[] = [];

        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();

            if (trimmed.startsWith('# ') && !trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
                data.titulo = trimmed.substring(2).trim();
                continue;
            }

            if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
                if (currentPlacemark && currentSection) {
                    placemarks.push(currentPlacemark);
                }
                currentPlacemark = null;

                if (currentSection) {
                    currentSection.placemarks = this.agruparPlacemarks(placemarks);
                    currentSection.totalItens = placemarks.length;
                    data.secoes.push(currentSection);
                }

                const tituloSecao = trimmed.substring(3).trim();

                if (this.isPastaIgnorada(tituloSecao)) {
                    currentSection = null;
                    placemarks = [];
                    continue;
                }

                currentSection = {
                    titulo: tituloSecao,
                    placemarks: [],
                    totalItens: 0,
                };
                placemarks = [];
                continue;
            }

            if (trimmed.startsWith('### ') && currentSection) {
                if (currentPlacemark) {
                    placemarks.push(currentPlacemark);
                }

                const nomeItem = trimmed.substring(4).trim();
                currentPlacemark = {
                    name: nomeItem,
                    description: [],
                };
                continue;
            }

            if (currentPlacemark && trimmed) {
                if (trimmed.startsWith('- **')) {
                    currentPlacemark.description.push(trimmed);
                } else if (!trimmed.startsWith('#') && !trimmed.startsWith('[')) {
                    currentPlacemark.description.push(trimmed);
                }
            }
        }

        if (currentPlacemark && currentSection) {
            placemarks.push(currentPlacemark);
        }

        if (currentSection) {
            currentSection.placemarks = this.agruparPlacemarks(placemarks);
            currentSection.totalItens = placemarks.length;
            data.secoes.push(currentSection);
        }

        return data;
    }

    private agruparPlacemarks(placemarks: any[]): any[] {
        const grupos: { [key: string]: { name: string; quantidade: number; descriptions: string[][] } } =
            {};

        for (const p of placemarks) {
            const nomeNormalizado = p.name.trim();
            if (!grupos[nomeNormalizado]) {
                grupos[nomeNormalizado] = {
                    name: nomeNormalizado,
                    quantidade: 0,
                    descriptions: [],
                };
            }
            grupos[nomeNormalizado].quantidade++;
            if (p.description && p.description.length > 0) {
                grupos[nomeNormalizado].descriptions.push(p.description);
            }
        }

        return Object.values(grupos).sort((a, b) => b.quantidade - a.quantidade);
    }

    private isPastaIgnorada(titulo: string): boolean {
        const tituloLower = titulo
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        const pastasIgnoradas = ['icone', 'icones', 'icon', 'icons', 'evento', 'dados gerais'];
        return pastasIgnoradas.some((pasta) => tituloLower.includes(pasta));
    }

    // Helpers de formatação
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
