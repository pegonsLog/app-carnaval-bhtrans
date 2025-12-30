import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroMagnifyingGlass, heroCalendarDays, heroBuildingOffice2 } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, NgIcon],
  viewProviders: [provideIcons({ heroMagnifyingGlass, heroCalendarDays, heroBuildingOffice2 })],
  templateUrl: './menu.html',
  styleUrl: './menu.scss'
})
export class MenuComponent {
  constructor(private router: Router) { }

  navegarPorBloco() {
    this.router.navigate(['/busca-bloco']);
  }

  navegarPorRegional() {
    this.router.navigate(['/busca-regional']);
  }

  navegarPorData() {
    this.router.navigate(['/busca-data']);
  }

  navegarBuscaLivre() {
    this.router.navigate(['/busca-livre']);
  }
}
