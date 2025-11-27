import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroXMark, heroExclamationTriangle } from '@ng-icons/heroicons/outline';

@Component({
    selector: 'app-confirm-modal',
    standalone: true,
    imports: [CommonModule, NgIcon],
    viewProviders: [provideIcons({ heroXMark, heroExclamationTriangle })],
    templateUrl: './confirm-modal.html',
    styleUrl: './confirm-modal.scss',
})
export class ConfirmModalComponent {
    @Input() titulo = 'Confirmar';
    @Input() mensagem = 'Deseja continuar?';
    @Input() textoBotaoConfirmar = 'Confirmar';
    @Input() textoBotaoCancelar = 'Cancelar';
    @Input() tipo: 'danger' | 'warning' | 'info' = 'danger';
    @Output() confirmar = new EventEmitter<void>();
    @Output() cancelar = new EventEmitter<void>();

    onConfirmar() {
        this.confirmar.emit();
    }

    onCancelar() {
        this.cancelar.emit();
    }
}
