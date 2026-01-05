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
    returnUrl = '';
    navigationState: any = null;

    constructor(private router: Router, private route: ActivatedRoute) { }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            this.url = params['url'] || '';
            this.titulo = params['titulo'] ? `Mapa - ${params['titulo']}` : 'Mapa do Percurso';
            this.returnUrl = params['returnUrl'] || '';
        });
        
        // Captura o estado da navegação
        const navigation = this.router.getCurrentNavigation();
        this.navigationState = navigation?.extras?.state || history.state;
    }

    abrirNovaAba() {
        window.open(this.url, '_blank');
    }

    voltar() {
        if (this.returnUrl && this.navigationState) {
            // Volta para a página de origem com o estado preservado
            this.router.navigate([this.returnUrl], {
                state: {
                    ...this.navigationState,
                    fromMapa: true
                }
            });
        } else {
            window.history.back();
        }
    }
}
