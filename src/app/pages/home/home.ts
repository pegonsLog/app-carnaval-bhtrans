import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent {
  features = [
    {
      icon: '📊',
      title: 'Importação de Dados',
      description: 'Importe arquivos Excel com informações dos blocos de carnaval de forma rápida e fácil.'
    },
    {
      icon: '🔄',
      title: 'Atualização Automática',
      description: 'Sistema inteligente que atualiza registros existentes ou cria novos automaticamente.'
    },
    {
      icon: '💾',
      title: 'Armazenamento em Nuvem',
      description: 'Todos os dados são armazenados de forma segura no Firebase Firestore.'
    },
    {
      icon: '📱',
      title: 'Interface Responsiva',
      description: 'Acesse de qualquer dispositivo com design adaptado para mobile e desktop.'
    }
  ];
}
