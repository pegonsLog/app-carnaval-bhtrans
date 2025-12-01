import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroXMark, heroPlus, heroPencil, heroTrash } from '@ng-icons/heroicons/outline';
import { FaixaTecido } from '../../interfaces/faixa-tecido.interface';

@Component({
  selector: 'app-crud-faixa-tecido',
  imports: [CommonModule, FormsModule, NgIcon],
  viewProviders: [provideIcons({ heroXMark, heroPlus, heroPencil, heroTrash })],
  templateUrl: './crud-faixa-tecido.html',
  styleUrl: './crud-faixa-tecido.scss'
})
export class CrudFaixaTecidoComponent implements OnInit {
  @Input() bloco: any;
  @Output() fechar = new EventEmitter<void>();
  @Output() salvar = new EventEmitter<FaixaTecido[]>();

  itens: FaixaTecido[] = [];
  itemEditando: FaixaTecido | null = null;
  indiceEditando: number = -1;
  mostrarForm = false;

  formItem: FaixaTecido = this.novoItem();

  ngOnInit() {
    this.itens = this.bloco?.faixasTecido ? [...this.bloco.faixasTecido] : [];
  }

  novoItem(): FaixaTecido {
    return { faixa: '', local: '', sentido: '' };
  }

  abrirFormNovo() {
    this.formItem = this.novoItem();
    this.itemEditando = null;
    this.indiceEditando = -1;
    this.mostrarForm = true;
  }

  editarItem(item: FaixaTecido, index: number) {
    this.formItem = { ...item };
    this.itemEditando = item;
    this.indiceEditando = index;
    this.mostrarForm = true;
  }

  excluirItem(index: number) {
    this.itens.splice(index, 1);
  }

  salvarItem() {
    if (!this.formItem.faixa || !this.formItem.local) return;
    
    if (this.indiceEditando >= 0) {
      this.itens[this.indiceEditando] = { ...this.formItem };
    } else {
      this.itens.push({ ...this.formItem });
    }
    this.cancelarForm();
  }

  cancelarForm() {
    this.mostrarForm = false;
    this.formItem = this.novoItem();
    this.itemEditando = null;
    this.indiceEditando = -1;
  }

  onSalvar() {
    this.salvar.emit(this.itens);
  }

  onFechar() {
    this.fechar.emit();
  }
}
