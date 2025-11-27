import { Component, Input, Output, EventEmitter, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Storage, ref, getBytes } from '@angular/fire/storage';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroXMark,
  heroDocumentText,
  heroArrowTopRightOnSquare,
} from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-percurso-viewer',
  standalone: true,
  imports: [CommonModule, NgIcon],
  viewProviders: [
    provideIcons({ heroXMark, heroDocumentText, heroArrowTopRightOnSquare }),
  ],
  templateUrl: './percurso-viewer.html',
  styleUrl: './percurso-viewer.scss',
})
export class PercursoViewerComponent implements OnInit {
  @Input() bloco: any = null;
  @Output() fechar = new EventEmitter<void>();

  markdownContent = '';
  htmlContent = '';
  isLoading = true;
  errorMessage = '';

  constructor(
    private storage: Storage,
    private ngZone: NgZone
  ) { }

  ngOnInit() {
    this.carregarMarkdown();
  }

  async carregarMarkdown() {
    if (!this.bloco?.percursoUrl) {
      this.errorMessage = 'Nenhum arquivo de descritivo disponível para este bloco.';
      this.isLoading = false;
      return;
    }

    try {
      // Extrai o path do Storage a partir da URL
      const storagePath = this.extrairPathDoStorage(this.bloco.percursoUrl);

      if (storagePath) {
        // Usa getBytes do Firebase Storage (não sofre com CORS)
        const storageRef = ref(this.storage, storagePath);
        const bytes = await getBytes(storageRef);
        const decoder = new TextDecoder('utf-8');
        this.markdownContent = decoder.decode(bytes);
      } else {
        throw new Error('Não foi possível extrair o caminho do arquivo');
      }

      this.ngZone.run(() => {
        this.htmlContent = this.parseMarkdownToHtml(this.markdownContent);
        this.isLoading = false;
      });
    } catch (error: any) {
      console.error('Erro ao carregar markdown:', error);
      this.ngZone.run(() => {
        this.errorMessage = 'Erro ao carregar o arquivo descritivo.';
        this.isLoading = false;
      });
    }
  }

  private extrairPathDoStorage(url: string): string | null {
    try {
      // URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?...
      const match = url.match(/\/o\/([^?]+)/);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    } catch {
      return null;
    }
    return null;
  }

  private parseMarkdownToHtml(md: string): string {
    let html = md
      // Headers
      .replace(/^### (.*$)/gim, '<h4>$1</h4>')
      .replace(/^## (.*$)/gim, '<h3>$1</h3>')
      .replace(/^# (.*$)/gim, '<h2>$1</h2>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Links
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener">$1</a>'
      )
      // Lists
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    // Wrap lists
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    // Clean up multiple ul tags
    html = html.replace(/<\/ul>\s*<ul>/g, '');

    return `<div class="markdown-body"><p>${html}</p></div>`;
  }

  onFechar() {
    this.fechar.emit();
  }

  abrirEmNovaAba() {
    if (this.bloco?.percursoUrl) {
      window.open(this.bloco.percursoUrl, '_blank');
    }
  }
}
