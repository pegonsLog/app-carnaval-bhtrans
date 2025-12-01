import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroXMark, heroPlus, heroPencil, heroTrash } from '@ng-icons/heroicons/outline';
import { Desvios } from '../../interfaces/desvios.interface';

@Component({
  selector: 'app-crud-desvios',
  imports: [CommonModule, FormsModule, NgIcon],
  viewProviders: [provideIcons({ heroXMark, heroPlus, heroPencil, heroTrash })],
  templateUrl: './crud-desvios.html',
  styleUrl: './crud-desvios.scss'
})
export class CrudDesviosComponent implements OnInit {
  @Input() bloco: any;
  @Output() fechar = new EventEmitter<void>();
  @Output() salvar = new EventEmitter<Desvios[]>();

  itens: Desvios[] = [];
  itemEditando: Desvios | null = null;
  indiceEditando: number = -1;
  mostrarForm = false;

  formItem: Desvios = this.novoItem();

  ngOnInit() {
    this.itens = this.bloco?.desvios ? [...this.bloco.desvios] : [];
  }

  novoItem(): Desvios {
    return { 
      tipo: '', 
      linha: '', 
      data: new Date(), 
      hora: '', 
      sentidoHorario: '', 
      trajetoSentHorario: '', 
      sentidoAntiHorario: '', 
      trajetoSentAntiHorario: '' 
    };
  }

  abrirFormNovo() {
    this.formItem = this.novoItem();
    this.itemEditando = null;
    this.indiceEditando = -1;
    this.mostrarForm = true;
  }

  editarItem(item: Desvios, index: number) {
    this.formItem = { ...item };
    this.itemEditando = item;
    this.indiceEditando = index;
    this.mostrarForm = true;
  }

  excluirItem(index: number) {
    this.itens.splice(index, 1);
  }

  salvarItem() {
    if (!this.formItem.tipo || !this.formItem.linha) return;
    
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
