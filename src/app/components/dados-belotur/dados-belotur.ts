import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroXMark, heroPrinter } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-dados-belotur',
  imports: [CommonModule, NgIcon],
  viewProviders: [provideIcons({ heroXMark, heroPrinter })],
  templateUrl: './dados-belotur.html',
  styleUrl: './dados-belotur.scss'
})
export class DadosBeloturComponent {
  @Input() bloco: any;
  @Output() fechar = new EventEmitter<void>();

  fecharModal() {
    this.fechar.emit();
  }

  imprimir() {
    window.print();
  }

  formatDate(value: any): string {
    if (!value) return '-';
    try {
      const date = value.toDate ? value.toDate() : new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR');
      }
    } catch {
      return String(value);
    }
    return '-';
  }

  formatBoolean(value: boolean | undefined): string {
    if (value === undefined || value === null) return '-';
    return value ? 'Sim' : 'Não';
  }

  formatArray(value: any[]): string {
    if (!value || !Array.isArray(value) || value.length === 0) return '-';
    return value.join(', ');
  }

  formatNumber(value: number | undefined): string {
    if (value === undefined || value === null) return '-';
    return value.toLocaleString('pt-BR');
  }
}
