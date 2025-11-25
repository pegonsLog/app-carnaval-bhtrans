import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroFolder, heroSparkles, heroChartBar, heroArrowPath, heroCloud, heroDevicePhoneMobile } from '@ng-icons/heroicons/outline';


@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, NgIcon],
  viewProviders: [provideIcons({ heroFolder, heroSparkles, heroChartBar, heroArrowPath, heroCloud, heroDevicePhoneMobile })],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent {
  features = [
    {
      icon: 'heroChartBar',
      title: 'Importação de Dados',
      description: 'Importe arquivos Excel com informações dos blocos de carnaval de forma rápida e fácil.'
    },
    {
      icon: 'heroArrowPath',
      title: 'Atualização Automática',
      description: 'Sistema inteligente que atualiza registros existentes ou cria novos automaticamente.'
    },
    {
      icon: 'heroCloud',
      title: 'Armazenamento em Nuvem',
      description: 'Todos os dados são armazenados de forma segura no Firebase Firestore.'
    },
    {
      icon: 'heroDevicePhoneMobile',
      title: 'Interface Responsiva',
      description: 'Acesse de qualquer dispositivo com design adaptado para mobile e desktop.'
    }
  ];
}
