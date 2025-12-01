import { Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroUser, heroLockClosed, heroEye, heroEyeSlash } from '@ng-icons/heroicons/outline';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, NgIcon],
    viewProviders: [provideIcons({ heroUser, heroLockClosed, heroEye, heroEyeSlash })],
    templateUrl: './login.html',
    styleUrl: './login.scss'
})
export class LoginComponent {
    matricula = '';
    senha = '';
    mostrarSenha = false;
    isLoading = false;
    mensagemErro = '';

    constructor(
        private authService: AuthService,
        private router: Router,
        private ngZone: NgZone
    ) {
        // Se já está logado, redireciona
        if (this.authService.isLogado) {
            this.router.navigate(['/']);
        }
    }

    async onSubmit() {
        if (!this.matricula || !this.senha) {
            this.mensagemErro = 'Preencha todos os campos';
            return;
        }

        this.isLoading = true;
        this.mensagemErro = '';

        const resultado = await this.authService.login(this.matricula, this.senha);

        this.ngZone.run(() => {
            this.isLoading = false;

            if (resultado.sucesso) {
                this.router.navigate(['/']);
            } else {
                this.mensagemErro = resultado.mensagem;
            }
        });
    }

    toggleMostrarSenha() {
        this.mostrarSenha = !this.mostrarSenha;
    }
}
