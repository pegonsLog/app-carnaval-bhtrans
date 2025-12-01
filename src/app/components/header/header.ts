import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroTicket, heroHome, heroArrowUpTray, heroXMark, heroBars3, heroListBullet, heroDocumentText, heroArrowRightOnRectangle, heroUsers } from '@ng-icons/heroicons/outline';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, RouterLinkActive, NgIcon],
  viewProviders: [provideIcons({ heroTicket, heroHome, heroArrowUpTray, heroXMark, heroBars3, heroListBullet, heroDocumentText, heroArrowRightOnRectangle, heroUsers })],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent {
  isMenuOpen = false;

  constructor(public authService: AuthService) { }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
    this.authService.logout();
  }
}
