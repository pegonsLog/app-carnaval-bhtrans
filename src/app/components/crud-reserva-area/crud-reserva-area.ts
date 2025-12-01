import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroXMark, heroPlus, heroPencil, heroTrash } from '@ng-icons/heroicons/outline';
import { ReservaDeArea } from '../../interfaces/reserva-de-area.interface';

@Component({
  selector: 'app-crud-reserva-area',
  imports: [CommonModule, FormsModule, NgIcon],
  viewProviders: [provideIcons({ heroXMark, heroPlus, heroPencil, heroTrash })],
  templateUrl: './crud-reserva-area.html',
  styleUrl: './crud-reserva-area.scss'
})
export class CrudReservaAreaComponent implements OnInit {
  @Input() bloco: any;
  @Output() fechar = new EventEmitter<void>();
  @Output() salvar = new EventEmitter<ReservaDeArea[]>();

  itens: ReservaDeArea[] = [];
  itemEditando: ReservaDeArea | null = null;
  indiceEditando: number = -1;
  mostrarForm = false;

  formItem: ReservaDeArea = this.novoItem();

  ngOnInit() {
    this.itens = this.bloco?.reservasArea ? [...this.bloco.reservasArea] : [];
  }

  novoItem(): ReservaDeArea {
    return { endereco: '', sentido: '', sinalizacao: '', quantidade: 1 };
  }

  abrirFormNovo() {
    this.formItem = this.novoItem();
    this.itemEditando = null;
    this.indiceEditando = -1;
    this.mostrarForm = true;
  }

  editarItem(item: ReservaDeArea, index: number) {
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
