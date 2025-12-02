import { Component, Input, Output, EventEmitter, NgZone, OnInit } from '@angular/core';
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
  setDoc,
  getDoc,
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
export class KmlUploadComponent implements OnInit {
  @Input() bloco: any;
  @Output() fechar = new EventEmitter<void>();
  @Output() uploadConcluido = new EventEmitter<{ percursoUrl: string; myMapsEmbedUrl: string }>();

  myMapsUrl = '';
  kmlContent = '';
  kmlCarregado = false;
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

  async ngOnInit() {
    // Carrega dados do mapa salvos anteriormente (se existirem)
    if (this.bloco?.numeroInscricao) {
      await this.carregarDadosMapaSalvos();
    }
  }

  private async carregarDadosMapaSalvos() {
    try {
      const mapaDocRef = doc(this.firestore, 'blocos-mapas', this.bloco.numeroInscricao);
      const mapaDoc = await getDoc(mapaDocRef);

      if (mapaDoc.exists()) {
        const dados = mapaDoc.data();
        if (dados['myMapsUrl']) {
          this.ngZone.run(() => {
            this.myMapsUrl = dados['myMapsUrl'];
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do mapa:', error);
    }
  }

  validarUrlMyMaps(): boolean {
    if (!this.myMapsUrl.trim()) return false;

    const input = this.myMapsUrl.trim();

    // Aceita URLs do Google My Maps
    const urlPatterns = [
      /^https?:\/\/(www\.)?google\.(com|com\.br)\/maps\/d\/.+/i,
      /^https?:\/\/maps\.google\.(com|com\.br)\/maps\/d\/.+/i,
    ];

    return urlPatterns.some(pattern => pattern.test(input));
  }

  extrairMidDaUrl(url: string): string | null {
    const patterns = [
      /mid=([^&\/]+)/,
      /\/maps\/d\/(?:u\/\d+\/)?(?:edit|viewer|embed)\?mid=([^&]+)/,
      /\/maps\/d\/([^\/\?]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  montarUrlKml(mid: string): string {
    return `https://www.google.com/maps/d/kml?mid=${mid}&forcekml=1`;
  }

  async buscarEValidarKml() {
    if (!this.myMapsUrl || !this.validarUrlMyMaps()) return;

    this.isValidando = true;
    this.mensagem = '';
    this.tipoMensagem = '';
    this.kmlValidado = false;
    this.kmlCarregado = false;
    this.kmlContent = '';
    this.foldersEncontradas = [];

    try {
      const mid = this.extrairMidDaUrl(this.myMapsUrl);

      if (!mid) {
        throw new Error('Não foi possível extrair o ID do mapa da URL fornecida.');
      }

      const kmlUrl = this.montarUrlKml(mid);
      const response = await fetch(kmlUrl);

      if (!response.ok) {
        throw new Error(`Erro ao buscar o mapa: ${response.status} ${response.statusText}`);
      }

      const kmlText = await response.text();

      if (!kmlText.includes('<kml') && !kmlText.includes('<Document')) {
        throw new Error('O conteúdo retornado não é um KML válido. Verifique se o mapa está público.');
      }

      this.kmlContent = kmlText;
      this.kmlCarregado = true;

      await this.validarKml(kmlText);

    } catch (error: any) {
      console.error('Erro ao buscar KML:', error);
      this.ngZone.run(() => {
        this.kmlValidado = false;
        this.kmlCarregado = false;
        this.foldersEncontradas = [];

        let mensagemErro = error.message;
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          mensagemErro = 'Não foi possível acessar o mapa. Verifique se ele está configurado como público.';
        }

        this.mostrarMensagem(`❌ ${mensagemErro}`, 'erro');
        this.isValidando = false;
      });
    }
  }

  async validarKml(kmlContent: string) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(kmlContent, 'text/xml');

      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('Erro ao processar o KML. O arquivo pode estar corrompido.');
      }

      const folders = xmlDoc.querySelectorAll('Folder');
      const foldersTemp: string[] = [];

      folders.forEach((folder) => {
        const folderName = folder.querySelector(':scope > name')?.textContent?.trim().toUpperCase();
        if (folderName) {
          foldersTemp.push(folderName);
        }
      });

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
    if (!this.kmlContent || !this.bloco || !this.kmlValidado) return;

    this.isUploading = true;
    this.uploadProgress = 0;

    try {
      this.uploadProgress = 25;

      const markdownContent = this.converterKmlParaMarkdown(this.kmlContent);
      this.uploadProgress = 50;

      const numeroInscricao = this.bloco.numeroInscricao;
      const nomeBloco = this.bloco.nomeDoBloco || 'bloco';
      const nomeBlocoSlug = this.slugify(nomeBloco);
      const nomeArquivo = `blocos/${numeroInscricao}_${nomeBlocoSlug}.md`;

      const storageRef = ref(this.storage, nomeArquivo);
      await uploadString(storageRef, markdownContent, 'raw', {
        contentType: 'text/markdown',
      });
      this.uploadProgress = 75;

      const downloadURL = await getDownloadURL(storageRef);

      // Salva na coleção separada (blocos-mapas) para persistência
      await this.salvarDadosMapa(numeroInscricao, downloadURL);

      // Atualiza o bloco atual
      await this.atualizarBlocoComPercurso(numeroInscricao, downloadURL);

      this.ngZone.run(() => {
        this.uploadProgress = 100;
        this.isUploading = false;
        this.mostrarMensagem('Arquivo convertido e enviado com sucesso!', 'sucesso');
        this.uploadConcluido.emit({
          percursoUrl: downloadURL,
          myMapsEmbedUrl: this.converterParaEmbedUrl(this.myMapsUrl)
        });
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

  // Salva os dados do mapa em coleção separada para não perder ao deletar blocos
  private async salvarDadosMapa(numeroInscricao: string, percursoUrl: string) {
    const mapaDocRef = doc(this.firestore, 'blocos-mapas', numeroInscricao);

    const dadosMapa = {
      numeroInscricao: numeroInscricao,
      nomeDoBloco: this.bloco.nomeDoBloco || '',
      myMapsUrl: this.myMapsUrl.trim(),
      myMapsEmbedUrl: this.converterParaEmbedUrl(this.myMapsUrl),
      percursoUrl: percursoUrl,
      percursoDataUpload: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(mapaDocRef, dadosMapa, { merge: true });
  }

  private converterKmlParaMarkdown(kmlContent: string): string {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(kmlContent, 'text/xml');

    const nomeBloco = this.bloco?.nomeDoBloco || 'Bloco';
    let md = `# ${nomeBloco} - Informações do Percurso\n\n`;

    const docDesc = xmlDoc.querySelector('Document > description')?.textContent;

    if (docDesc) {
      const dadosGerais = this.parseDescricaoHtml(docDesc);
      if (dadosGerais.trim()) {
        md += `## 📋 Dados Gerais\n\n`;
        md += dadosGerais;
      }
    }

    const folders = xmlDoc.querySelectorAll('Folder');
    folders.forEach((folder) => {
      const folderName = folder.querySelector(':scope > name')?.textContent;
      const placemarks = folder.querySelectorAll(':scope > Placemark');

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

    md = md.replace(/\n{3,}/g, '\n\n');

    return md;
  }

  private processarPlacemark(placemark: Element): string {
    const name = placemark.querySelector('name')?.textContent?.trim();
    const description = placemark.querySelector('description')?.textContent;

    if (!name && !description) {
      return '';
    }

    const nomeLower = name?.toLowerCase() || '';
    const marcadoresIgnorar = ['início', 'inicio', 'término', 'termino', 'fim'];
    const ehMarcadorSimples = marcadoresIgnorar.some(m => nomeLower.includes(m));

    let descContent = '';
    if (description) {
      descContent = this.parseDescricaoHtml(description);
    }

    if (ehMarcadorSimples && !descContent.trim()) {
      return '';
    }

    let md = '';

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

    if (!text) {
      return '';
    }

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

      if (this.myMapsUrl.trim()) {
        updateData.myMapsEmbedUrl = this.converterParaEmbedUrl(this.myMapsUrl);
      }

      await updateDoc(docRef, updateData);
    }
  }

  private converterParaEmbedUrl(url: string): string {
    const mid = this.extrairMidDaUrl(url);
    if (mid) {
      return `https://www.google.com/maps/d/embed?mid=${mid}`;
    }
    return url;
  }

  private mostrarMensagem(msg: string, tipo: 'sucesso' | 'erro') {
    this.mensagem = msg;
    this.tipoMensagem = tipo;
  }

  fecharModal() {
    this.fechar.emit();
  }

  limparKml() {
    this.kmlContent = '';
    this.kmlCarregado = false;
    this.kmlValidado = false;
    this.mensagem = '';
    this.tipoMensagem = '';
    this.foldersEncontradas = [];
  }

  isFolderObrigatoria(folder: string): boolean {
    return this.foldersObrigatorias.some(f => f.toUpperCase() === folder.toUpperCase());
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 50);
  }
}
