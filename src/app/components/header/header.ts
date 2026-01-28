import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroTicket, heroHome, heroArrowUpTray, heroXMark, heroBars3, heroListBullet, heroDocumentText, heroArrowRightOnRectangle, heroUsers, heroFolderOpen, heroMagnifyingGlass, heroMapPin } from '@ng-icons/heroicons/outline';
import { AuthService } from '../../services/auth.service';
import { DocumentosListComponent } from '../documentos-list/documentos-list';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, RouterLinkActive, NgIcon, DocumentosListComponent],
  viewProviders: [provideIcons({ heroTicket, heroHome, heroArrowUpTray, heroXMark, heroBars3, heroListBullet, heroDocumentText, heroArrowRightOnRectangle, heroUsers, heroFolderOpen, heroMagnifyingGlass, heroMapPin })],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent {
  isMenuOpen = false;
  mostrarDocumentos = false;

  constructor(public authService: AuthService) { }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  abrirDocumentos() {
    this.mostrarDocumentos = true;
  }

  fecharDocumentos() {
    this.mostrarDocumentos = false;
  }

  logout() {
    this.authService.logout();
  }
}
