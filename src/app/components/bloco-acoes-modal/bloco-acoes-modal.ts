import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { 
  heroXMark, 
  heroClipboardDocument, 
  heroMapPin, 
  heroDocumentText, 
  heroGlobeAmericas, 
  heroDocumentDuplicate, 
  heroTrash,
  heroUserGroup,
  heroArrowsRightLeft,
  heroFlag,
  heroNoSymbol,
  heroSquare3Stack3d,
  heroExclamationTriangle
} from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-bloco-acoes-modal',
  imports: [CommonModule, NgIcon],
  viewProviders: [provideIcons({ 
    heroXMark, 
    heroClipboardDocument, 
    heroMapPin, 
    heroDocumentText, 
    heroGlobeAmericas, 
    heroDocumentDuplicate, 
    heroTrash,
    heroUserGroup,
    heroArrowsRightLeft,
    heroFlag,
    heroNoSymbol,
    heroSquare3Stack3d,
    heroExclamationTriangle
  })],
  templateUrl: './bloco-acoes-modal.html',
  styleUrl: './bloco-acoes-modal.scss'
})
export class BlocoAcoesModalComponent {
  @Input() bloco: any;
  @Output() fechar = new EventEmitter<void>();
  @Output() documentoBelotur = new EventEmitter<any>();
  @Output() uploadKml = new EventEmitter<any>();
  @Output() visualizarPercurso = new EventEmitter<any>();
  @Output() documentoMymaps = new EventEmitter<any>();
  @Output() documentoCompleto = new EventEmitter<any>();
  @Output() removerArquivo = new EventEmitter<any>();
  @Output() gerenciarAgentes = new EventEmitter<any>();
  @Output() gerenciarDesvios = new EventEmitter<any>();
  @Output() gerenciarFaixasTecido = new EventEmitter<any>();
  @Output() gerenciarFechamentos = new EventEmitter<any>();
  @Output() gerenciarReservasArea = new EventEmitter<any>();
  @Output() gerenciarSinalizacoes = new EventEmitter<any>();

  get numeroInscricao(): string {
    return this.bloco?.numeroInscricao || '-';
  }

  get nomeDoBloco(): string {
    return this.bloco?.nomeDoBloco || '-';
  }

  get dataDoDesfile(): string {
    if (!this.bloco?.dataDoDesfile) return '-';
    try {
      const date = this.bloco.dataDoDesfile.toDate 
        ? this.bloco.dataDoDesfile.toDate() 
        : new Date(this.bloco.dataDoDesfile);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR');
      }
    } catch {
      return String(this.bloco.dataDoDesfile);
    }
    return '-';
  }

  onFechar() {
    this.fechar.emit();
  }

  onDocumentoBelotur() {
    this.documentoBelotur.emit(this.bloco);
  }

  onUploadKml() {
    this.uploadKml.emit(this.bloco);
  }

  onVisualizarPercurso() {
    this.visualizarPercurso.emit(this.bloco);
  }

  onDocumentoMymaps() {
    this.documentoMymaps.emit(this.bloco);
  }

  onDocumentoCompleto() {
    this.documentoCompleto.emit(this.bloco);
  }

  onRemoverArquivo() {
    this.removerArquivo.emit(this.bloco);
  }

  onGerenciarAgentes() {
    this.gerenciarAgentes.emit(this.bloco);
  }

  onGerenciarDesvios() {
    this.gerenciarDesvios.emit(this.bloco);
  }

  onGerenciarFaixasTecido() {
    this.gerenciarFaixasTecido.emit(this.bloco);
  }

  onGerenciarFechamentos() {
    this.gerenciarFechamentos.emit(this.bloco);
  }

  onGerenciarReservasArea() {
    this.gerenciarReservasArea.emit(this.bloco);
  }

  onGerenciarSinalizacoes() {
    this.gerenciarSinalizacoes.emit(this.bloco);
  }
}
