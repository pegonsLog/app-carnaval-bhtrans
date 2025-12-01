import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroXMark } from '@ng-icons/heroicons/outline';
import { SafePipe } from '../../pipes/safe.pipe';

@Component({
    selector: 'app-mapa-modal',
    standalone: true,
    imports: [CommonModule, NgIcon, SafePipe],
    viewProviders: [provideIcons({ heroXMark })],
    templateUrl: './mapa-modal.html',
    styleUrl: './mapa-modal.scss'
})
export class MapaModalComponent {
    @Input() url: string = '';
    @Input() titulo: string = 'Mapa do Percurso';
    @Output() fechar = new EventEmitter<void>();

    onFechar() {
        this.fechar.emit();
    }

    abrirNovaAba() {
        window.open(this.url, '_blank');
    }
}
