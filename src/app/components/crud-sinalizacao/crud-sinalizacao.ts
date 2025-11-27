import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroXMark, heroPlus, heroPencil, heroTrash } from '@ng-icons/heroicons/outline';
import { Sinalizacao } from '../../interfaces/sinalizacao.interface';

@Component({
  selector: 'app-crud-sinalizacao',
  imports: [CommonModule, FormsModule, NgIcon],
  viewProviders: [provideIcons({ heroXMark, heroPlus, heroPencil, heroTrash })],
  templateUrl: './crud-sinalizacao.html',
  styleUrl: './crud-sinalizacao.scss'
})
export class CrudSinalizacaoComponent implements OnInit {
  @Input() bloco: any;
  @Output() fechar = new EventEmitter<void>();
  @Output() salvar = new EventEmitter<Sinalizacao[]>();

  itens: Sinalizacao[] = [];
  itemEditando: Sinalizacao | null = null;
  indiceEditando: number = -1;
  mostrarForm = false;

  formItem: Sinalizacao = this.novoItem();

  ngOnInit() {
    this.itens = this.bloco?.sinalizacoes ? [...this.bloco.sinalizacoes] : [];
  }

  novoItem(): Sinalizacao {
    return { codigoPlaca: '', local: '', quantidade: 1 };
  }

  abrirFormNovo() {
    this.formItem = this.novoItem();
    this.itemEditando = null;
    this.indiceEditando = -1;
    this.mostrarForm = true;
  }

  editarItem(item: Sinalizacao, index: number) {
    this.formItem = { ...item };
    this.itemEditando = item;
    this.indiceEditando = index;
    this.mostrarForm = true;
  }

  excluirItem(index: number) {
    this.itens.splice(index, 1);
  }

  salvarItem() {
    if (!this.formItem.codigoPlaca || !this.formItem.local) return;
    
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
