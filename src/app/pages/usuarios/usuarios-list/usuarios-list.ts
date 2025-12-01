import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UsuariosService } from '../../../services/usuarios.service';
import { AuthService } from '../../../services/auth.service';
import { Usuario } from '../../../interfaces/usuario.interface';

@Component({
    selector: 'app-usuarios-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './usuarios-list.html',
    styleUrl: './usuarios-list.scss'
})
export class UsuariosListComponent implements OnInit, OnDestroy {
    usuarios: Usuario[] = [];
    carregando = true;
    private subscription?: Subscription;

    constructor(
        private usuariosService: UsuariosService,
        private authService: AuthService,
        private router: Router,
        private ngZone: NgZone
    ) { }

    ngOnInit() {
        if (!this.authService.isAdmin) {
            this.router.navigate(['/']);
            return;
        }
        this.carregarUsuarios();
    }

    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }

    carregarUsuarios() {
        this.subscription = this.usuariosService.listar().subscribe({
            next: (usuarios) => {
                this.ngZone.run(() => {
                    this.usuarios = usuarios;
                    this.carregando = false;
                });
            },
            error: (err) => {
                console.error('Erro ao carregar usuários:', err);
                this.ngZone.run(() => {
                    this.carregando = false;
                });
            }
        });
    }

    novoUsuario() {
        this.router.navigate(['/usuarios/novo']);
    }

    editarUsuario(id: string) {
        this.router.navigate(['/usuarios/editar', id]);
    }

    async excluirUsuario(usuario: Usuario) {
        if (!usuario.id) return;

        const confirmar = confirm(`Deseja realmente excluir o usuário ${usuario.matricula}?`);
        if (!confirmar) return;

        try {
            await this.usuariosService.excluir(usuario.id);
        } catch (err) {
            console.error('Erro ao excluir usuário:', err);
            alert('Erro ao excluir usuário. Tente novamente.');
        }
    }

    getPerfilLabel(perfil: string): string {
        const labels: Record<string, string> = {
            'admin': 'Administrador',
            'operador': 'Operador',
            'visualizador': 'Visualizador'
        };
        return labels[perfil] || perfil;
    }

    voltar() {
        this.router.navigate(['/']);
    }
}
