import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroXMark, heroPlus, heroPencil, heroTrash } from '@ng-icons/heroicons/outline';
import { Fechamentos } from '../../interfaces/fechamentos.interface';

@Component({
  selector: 'app-crud-fechamentos',
  imports: [CommonModule, FormsModule, NgIcon],
  viewProviders: [provideIcons({ heroXMark, heroPlus, heroPencil, heroTrash })],
  templateUrl: './crud-fechamentos.html',
  styleUrl: './crud-fechamentos.scss'
})
export class CrudFechamentosComponent implements OnInit {
  @Input() bloco: any;
  @Output() fechar = new EventEmitter<void>();
  @Output() salvar = new EventEmitter<Fechamentos[]>();

  itens: Fechamentos[] = [];
  itemEditando: Fechamentos | null = null;
  indiceEditando: number = -1;
  mostrarForm = false;

  formItem: Fechamentos = this.novoItem();

  ngOnInit() {
    this.itens = this.bloco?.fechamentos ? [...this.bloco.fechamentos] : [];
  }

  novoItem(): Fechamentos {
    return { endereco: '', sinalizacao: '', quantidade: 1 };
  }

  abrirFormNovo() {
    this.formItem = this.novoItem();
    this.itemEditando = null;
    this.indiceEditando = -1;
    this.mostrarForm = true;
  }

  editarItem(item: Fechamentos, index: number) {
    this.formItem = { ...item };
    this.itemEditando = item;
    this.indiceEditando = index;
    this.mostrarForm = true;
  }

  excluirItem(index: number) {
    this.itens.splice(index, 1);
  }

  salvarItem() {
    if (!this.formItem.endereco) return;
    
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
