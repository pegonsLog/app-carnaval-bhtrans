import { Component, Input, Output, EventEmitter, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Storage, ref, uploadString, getDownloadURL } from '@angular/fire/storage';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from '@angular/fire/firestore';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroXMark,
  heroCloudArrowUp,
  heroDocumentText,
  heroCheckCircle,
  heroExclamationCircle,
} from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-kml-upload',
  standalone: true,
  imports: [CommonModule, NgIcon, FormsModule],
  viewProviders: [
    provideIcons({
      heroXMark,
      heroCloudArrowUp,
      heroDocumentText,
      heroCheckCircle,
      heroExclamationCircle,
    }),
  ],
  templateUrl: './kml-upload.html',
  styleUrl: './kml-upload.scss',
})
export class KmlUploadComponent {
  @Input() bloco: any;
  @Output() fechar = new EventEmitter<void>();
  @Output() uploadConcluido = new EventEmitter<string>();

  arquivoSelecionado: File | null = null;
  myMapsUrl = '';
  isUploading = false;
  uploadProgress = 0;
  mensagem = '';
  tipoMensagem: 'sucesso' | 'erro' | '' = '';
  kmlValidado = false;
  isValidando = false;
  foldersEncontradas: string[] = [];
  foldersObrigatorias = ['RESERVA DE ÁREA', 'DESVIOS', 'SINALIZAÇÃO', 'AGENTES', 'FAIXA DE TECIDO'];

  constructor(
    private storage: Storage,
    private firestore: Firestore,
    private ngZone: NgZone
  ) { }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (!file.name.toLowerCase().endsWith('.kml')) {
        this.mostrarMensagem('Por favor, selecione um arquivo KML válido.', 'erro');
        return;
      }

      this.arquivoSelecionado = file;
      this.mensagem = '';
      this.tipoMensagem = '';
      this.kmlValidado = false;
      this.foldersEncontradas = [];
    }
  }

  async validarKml() {
    if (!this.arquivoSelecionado) return;

    this.isValidando = true;
    this.mensagem = '';
    this.tipoMensagem = '';

    try {
      const kmlContent = await this.lerArquivo(this.arquivoSelecionado);
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(kmlContent, 'text/xml');

      // Extrai os nomes das folders do KML
      const folders = xmlDoc.querySelectorAll('Folder');
      const foldersTemp: string[] = [];

      folders.forEach((folder) => {
        const folderName = folder.querySelector(':scope > name')?.textContent?.trim().toUpperCase();
        if (folderName) {
          foldersTemp.push(folderName);
        }
      });

      // Verifica se todas as folders obrigatórias estão presentes
      const foldersFaltando = this.foldersObrigatorias.filter(
        (obrigatoria) => !foldersTemp.some(
          (encontrada) => encontrada === obrigatoria.toUpperCase()
        )
      );

      this.ngZone.run(() => {
        this.foldersEncontradas = foldersTemp;

        if (foldersFaltando.length === 0) {
          this.kmlValidado = true;
          this.mostrarMensagem('✅ KML validado com sucesso! Todas as pastas obrigatórias foram encontradas.', 'sucesso');
        } else {
          this.kmlValidado = false;
          this.mostrarMensagem(
            `❌ Pastas obrigatórias não encontradas: ${foldersFaltando.join(', ')}`,
            'erro'
          );
        }
        this.isValidando = false;
      });
    } catch (error: any) {
      console.error('Erro ao validar KML:', error);
      this.ngZone.run(() => {
        this.kmlValidado = false;
        this.foldersEncontradas = [];
        this.mostrarMensagem(`Erro ao validar arquivo: ${error.message}`, 'erro');
        this.isValidando = false;
      });
    }
  }

  async enviarArquivo() {
    if (!this.arquivoSelecionado || !this.bloco) return;

    this.isUploading = true;
    this.uploadProgress = 0;

    try {
      // Lê o conteúdo do arquivo KML
      const kmlContent = await this.lerArquivo(this.arquivoSelecionado);
      this.uploadProgress = 25;

      // Converte KML para Markdown
      const markdownContent = this.converterKmlParaMarkdown(kmlContent);
      this.uploadProgress = 50;

      const numeroInscricao = this.bloco.numeroInscricao;
      const nomeBloco = this.bloco.nomeDoBloco || 'bloco';
      const nomeBlocoSlug = this.slugify(nomeBloco);
      const nomeArquivo = `blocos/${numeroInscricao}_${nomeBlocoSlug}.md`;

      // Cria referência no Storage e faz upload do Markdown
      const storageRef = ref(this.storage, nomeArquivo);
      await uploadString(storageRef, markdownContent, 'raw', {
        contentType: 'text/markdown',
      });
      this.uploadProgress = 75;

      // Obtém URL de download
      const downloadURL = await getDownloadURL(storageRef);

      // Atualiza o documento do bloco no Firestore
      await this.atualizarBlocoComPercurso(numeroInscricao, downloadURL);
      this.ngZone.run(() => {
        this.uploadProgress = 100;
        this.isUploading = false;
        this.mostrarMensagem('Arquivo convertido e enviado com sucesso!', 'sucesso');
        this.uploadConcluido.emit(downloadURL);
      });

      setTimeout(() => {
        this.ngZone.run(() => this.fechar.emit());
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao enviar arquivo:', error);
      this.ngZone.run(() => {
        this.mostrarMensagem(`Erro ao enviar arquivo: ${error.message}`, 'erro');
        this.isUploading = false;
      });
    }
  }

  private lerArquivo(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file);
    });
  }

  private converterKmlParaMarkdown(kmlContent: string): string {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(kmlContent, 'text/xml');

    const nomeBloco = this.bloco?.nomeDoBloco || 'Bloco';
    let md = `# ${nomeBloco} - Informações do Percurso\n\n`;

    // Extrai informações do Document
    const docDesc = xmlDoc.querySelector('Document > description')?.textContent;

    if (docDesc) {
      const dadosGerais = this.parseDescricaoHtml(docDesc);
      if (dadosGerais.trim()) {
        md += `## 📋 Dados Gerais\n\n`;
        md += dadosGerais;
      }
    }

    // Processa as pastas (Folders)
    const folders = xmlDoc.querySelectorAll('Folder');
    folders.forEach((folder) => {
      const folderName = folder.querySelector(':scope > name')?.textContent;
      const placemarks = folder.querySelectorAll(':scope > Placemark');

      // Só adiciona a pasta se tiver placemarks com conteúdo
      let folderContent = '';
      placemarks.forEach((placemark) => {
        const placemarkContent = this.processarPlacemark(placemark);
        if (placemarkContent.trim()) {
          folderContent += placemarkContent;
        }
      });

      if (folderContent.trim() && folderName) {
        md += `\n## ${folderName}\n\n`;
        md += folderContent;
      }
    });

    // Processa Placemarks fora de pastas
    const rootPlacemarks = xmlDoc.querySelectorAll('Document > Placemark');
    if (rootPlacemarks.length > 0) {
      let rootContent = '';
      rootPlacemarks.forEach((placemark) => {
        const placemarkContent = this.processarPlacemark(placemark);
        if (placemarkContent.trim()) {
          rootContent += placemarkContent;
        }
      });

      if (rootContent.trim()) {
        md += `\n## Pontos de Interesse\n\n`;
        md += rootContent;
      }
    }

    // Remove linhas em branco extras
    md = md.replace(/\n{3,}/g, '\n\n');

    return md;
  }

  private processarPlacemark(placemark: Element): string {
    const name = placemark.querySelector('name')?.textContent?.trim();
    const description = placemark.querySelector('description')?.textContent;

    // Se não tem nome nem descrição, retorna vazio
    if (!name && !description) {
      return '';
    }

    // Ignora marcadores de início/término sem descrição
    const nomeLower = name?.toLowerCase() || '';
    const marcadoresIgnorar = ['início', 'inicio', 'término', 'termino', 'fim'];
    const ehMarcadorSimples = marcadoresIgnorar.some(m => nomeLower.includes(m));

    // Processa descrição primeiro para verificar se tem conteúdo
    let descContent = '';
    if (description) {
      descContent = this.parseDescricaoHtml(description);
    }

    // Se é marcador de início/término sem descrição, ignora
    if (ehMarcadorSimples && !descContent.trim()) {
      return '';
    }

    let md = '';

    // Verifica o tipo de geometria
    const point = placemark.querySelector('Point');
    const lineString = placemark.querySelector('LineString');

    // Só adiciona o marcador se tiver nome ou descrição com conteúdo
    if (name || descContent.trim()) {
      if (name) {
        md += `### ${name}\n\n`;
      }

      if (descContent.trim()) {
        md += descContent;
      }
    }

    return md;
  }

  private parseDescricaoHtml(html: string): string {
    let text = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .trim();

    // Se não tem texto, retorna vazio
    if (!text) {
      return '';
    }

    // Converte campos conhecidos para formato de lista
    const campos = [
      { regex: /Bloco:\s*(.+)/i, label: 'Bloco' },
      { regex: /Dia:\s*(.+)/i, label: 'Data' },
      { regex: /Público Estimado:\s*(.+)/i, label: 'Público Estimado' },
      { regex: /Horário Concentração:\s*(.+)/i, label: 'Horário Concentração' },
      { regex: /Horário Desfile:\s*(.+)/i, label: 'Horário Desfile' },
      { regex: /Horário Dispersão:\s*(.+)/i, label: 'Horário Dispersão' },
      { regex: /Nome resp\. 1:\s*(.+)/i, label: 'Responsável 1' },
      { regex: /Telefone resp\. 1:\s*(.+)/i, label: 'Telefone 1' },
      { regex: /E-mail resp\. 1:\s*(.+)/i, label: 'E-mail 1' },
      { regex: /Nome resp\. 2:\s*(.+)/i, label: 'Responsável 2' },
      { regex: /Telefone resp\. 2:\s*(.+)/i, label: 'Telefone 2' },
    ];

    let resultado = '';
    let textoRestante = text;

    campos.forEach(({ regex, label }) => {
      const match = textoRestante.match(regex);
      if (match && match[1].trim()) {
        resultado += `- **${label}:** ${match[1].trim()}\n`;
        textoRestante = textoRestante.replace(match[0], '');
      }
    });

    // Adiciona texto restante se houver conteúdo significativo
    textoRestante = textoRestante.replace(/\n+/g, ' ').trim();
    if (textoRestante && textoRestante.length > 2 && !resultado) {
      resultado = textoRestante + '\n';
    }

    return resultado ? resultado + '\n' : '';
  }

  private async atualizarBlocoComPercurso(numeroInscricao: string, percursoUrl: string) {
    const blocosCollection = collection(this.firestore, 'blocos');
    const q = query(blocosCollection, where('numeroInscricao', '==', numeroInscricao));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docId = querySnapshot.docs[0].id;
      const docRef = doc(this.firestore, 'blocos', docId);
      const updateData: any = {
        percursoUrl: percursoUrl,
        percursoDataUpload: new Date(),
      };

      // Adiciona URL de embed do My Maps se informada
      if (this.myMapsUrl.trim()) {
        updateData.myMapsEmbedUrl = this.converterParaEmbedUrl(this.myMapsUrl);
      }

      await updateDoc(docRef, updateData);
    }
  }

  private mostrarMensagem(msg: string, tipo: 'sucesso' | 'erro') {
    this.mensagem = msg;
    this.tipoMensagem = tipo;
  }

  fecharModal() {
    this.fechar.emit();
  }

  removerArquivo() {
    this.arquivoSelecionado = null;
    this.mensagem = '';
    this.tipoMensagem = '';
    this.kmlValidado = false;
    this.foldersEncontradas = [];
  }

  isFolderObrigatoria(folder: string): boolean {
    return this.foldersObrigatorias.some(f => f.toUpperCase() === folder.toUpperCase());
  }

  validarUrlMyMaps(): boolean {
    if (!this.myMapsUrl.trim()) return true; // Campo opcional

    const input = this.myMapsUrl.trim();

    // Aceita iframe completo com src do Google Maps
    if (input.includes('<iframe') && input.includes('google.com/maps')) {
      return true;
    }

    // Aceita URL direta do Google Maps
    const urlPattern = /^https?:\/\/(www\.)?google\.(com|com\.br)\/maps\/.+/i;
    return urlPattern.test(input);
  }

  private converterParaEmbedUrl(input: string): string {
    let embedUrl = input.trim();

    // Se o usuário colou o iframe completo, extrai a URL do src
    // Exemplo: <iframe src="https://www.google.com/maps/d/u/2/embed?mid=xxx" width="640" height="480"></iframe>
    if (embedUrl.includes('<iframe') && embedUrl.includes('src=')) {
      const srcMatch = embedUrl.match(/src=["']([^"']+)["']/);
      if (srcMatch && srcMatch[1]) {
        embedUrl = srcMatch[1];
      }
    }

    // Se já é uma URL de embed, retorna como está
    if (embedUrl.includes('/embed?')) {
      return embedUrl;
    }

    // Converte /viewer? para /embed?
    if (embedUrl.includes('/viewer?')) {
      return embedUrl.replace('/viewer?', '/embed?');
    }

    // Converte /edit? para /embed?
    if (embedUrl.includes('/edit?')) {
      return embedUrl.replace('/edit?', '/embed?');
    }

    // Se tem mid= mas não tem embed, tenta converter
    if (embedUrl.includes('mid=') && embedUrl.includes('/maps/d/')) {
      const midMatch = embedUrl.match(/mid=([^&]+)/);
      if (midMatch) {
        return `https://www.google.com/maps/d/embed?mid=${midMatch[1]}`;
      }
    }

    return embedUrl;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]+/g, '_') // Substitui caracteres especiais por _
      .replace(/^_+|_+$/g, '') // Remove _ do início e fim
      .substring(0, 50); // Limita tamanho
  }
}
