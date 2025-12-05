import { Component, Output, EventEmitter, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroXMark,
  heroDocumentArrowUp,
  heroDocumentText,
  heroTrash,
  heroArrowDownTray,
  heroExclamationCircle,
  heroMagnifyingGlass,
} from '@ng-icons/heroicons/outline';
import {
  DocumentosService,
  DocumentoInfo,
} from '../../services/documentos.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-documentos-list',
  imports: [CommonModule, FormsModule, NgIcon],
  viewProviders: [
    provideIcons({
      heroXMark,
      heroDocumentArrowUp,
      heroDocumentText,
      heroTrash,
      heroArrowDownTray,
      heroExclamationCircle,
      heroMagnifyingGlass,
    }),
  ],
  templateUrl: './documentos-list.html',
  styleUrl: './documentos-list.scss',
})
export class DocumentosListComponent implements OnInit {
  @Output() fechar = new EventEmitter<void>();

  documentos: DocumentoInfo[] = [];
  documentosFiltrados: DocumentoInfo[] = [];
  filtroNome = '';
  carregando = false;
  enviando = false;
  erro = '';

  constructor(
    private documentosService: DocumentosService,
    private ngZone: NgZone,
    public authService: AuthService
  ) { }

  ngOnInit() {
    this.carregarDocumentos();
  }

  async carregarDocumentos() {
    this.carregando = true;
    this.erro = '';

    try {
      const docs = await this.documentosService.listarDocumentos();
      this.ngZone.run(() => {
        this.documentos = docs;
        this.aplicarFiltro();
        this.carregando = false;
      });
    } catch (error) {
      this.ngZone.run(() => {
        this.erro = 'Erro ao carregar documentos';
        this.carregando = false;
      });
      console.error(error);
    }
  }

  aplicarFiltro() {
    if (!this.filtroNome.trim()) {
      this.documentosFiltrados = this.documentos;
    } else {
      const termo = this.filtroNome.toLowerCase();
      this.documentosFiltrados = this.documentos.filter((doc) =>
        doc.nome.toLowerCase().includes(termo)
      );
    }
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const arquivo = input.files[0];

    if (!arquivo.name.toLowerCase().endsWith('.docx')) {
      this.erro = 'Apenas arquivos .docx são permitidos';
      return;
    }

    this.enviando = true;
    this.erro = '';

    try {
      await this.documentosService.uploadDocumento(arquivo);
      await this.carregarDocumentos();
    } catch (error) {
      this.ngZone.run(() => {
        this.erro = 'Erro ao enviar documento';
      });
      console.error(error);
    } finally {
      this.ngZone.run(() => {
        this.enviando = false;
      });
      input.value = '';
    }
  }

  async removerDocumento(doc: DocumentoInfo) {
    if (!confirm(`Deseja remover o documento "${doc.nome}"?`)) return;

    try {
      await this.documentosService.removerDocumento(doc.path);
      await this.carregarDocumentos();
    } catch (error) {
      this.ngZone.run(() => {
        this.erro = 'Erro ao remover documento';
      });
      console.error(error);
    }
  }

  visualizarDocumento(doc: DocumentoInfo) {
    window.open(doc.url, '_blank');
  }

  formatarTamanho(bytes: number): string {
    return this.documentosService.formatarTamanho(bytes);
  }

  formatarData(data: Date): string {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  onFechar() {
    this.fechar.emit();
  }
}
