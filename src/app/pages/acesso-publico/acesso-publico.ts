import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroArrowRightOnRectangle } from '@ng-icons/heroicons/outline';
import { MenuComponent } from '../../components/menu/menu';

@Component({
  selector: 'app-acesso-publico',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon, MenuComponent],
  viewProviders: [provideIcons({ heroArrowRightOnRectangle })],
  templateUrl: './acesso-publico.html',
  styleUrl: './acesso-publico.scss'
})
export class AcessoPublicoComponent {}
