import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroArrowLeft, heroArrowTopRightOnSquare } from '@ng-icons/heroicons/outline';
import { SafePipe } from '../../pipes/safe.pipe';

@Component({
    selector: 'app-mapa',
    standalone: true,
    imports: [CommonModule, NgIcon, SafePipe],
    viewProviders: [provideIcons({ heroArrowLeft, heroArrowTopRightOnSquare })],
    templateUrl: './mapa.html',
    styleUrl: './mapa.scss'
})
export class MapaComponent implements OnInit {
    url = '';
    titulo = 'Mapa do Percurso';

    constructor(private router: Router, private route: ActivatedRoute) { }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            this.url = params['url'] || '';
            this.titulo = params['titulo'] ? `Mapa - ${params['titulo']}` : 'Mapa do Percurso';
        });
    }

    abrirNovaAba() {
        window.open(this.url, '_blank');
    }

    voltar() {
        window.history.back();
    }
}
