import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UsuariosService } from '../../../services/usuarios.service';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-usuario-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './usuario-form.html',
    styleUrl: './usuario-form.scss'
})
export class UsuarioFormComponent implements OnInit {
    form!: FormGroup;
    editando = false;
    carregando = false;
    salvando = false;
    mensagemErro = '';
    private usuarioId?: string;

    constructor(
        private fb: FormBuilder,
        private usuariosService: UsuariosService,
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute,
        private ngZone: NgZone
    ) { }

    ngOnInit() {
        if (!this.authService.isAdmin) {
            this.router.navigate(['/']);
            return;
        }

        this.initForm();

        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.editando = true;
            this.usuarioId = id;
            this.carregarUsuario(id);
        }
    }

    private initForm() {
        this.form = this.fb.group({
            matricula: ['', Validators.required],
            senha: ['', this.editando ? [] : Validators.required],
            area: ['', Validators.required],
            perfil: ['', Validators.required]
        });
    }

    private async carregarUsuario(id: string) {
        this.carregando = true;
        try {
            const usuario = await this.usuariosService.buscarPorId(id);
            this.ngZone.run(() => {
                if (usuario) {
                    this.form.patchValue({
                        matricula: usuario.matricula,
                        area: usuario.area,
                        perfil: usuario.perfil
                    });
                    // Remove validação obrigatória da senha ao editar
                    this.form.get('senha')?.clearValidators();
                    this.form.get('senha')?.updateValueAndValidity();
                } else {
                    this.mensagemErro = 'Usuário não encontrado';
                }
                this.carregando = false;
            });
        } catch (err) {
            console.error('Erro ao carregar usuário:', err);
            this.ngZone.run(() => {
                this.mensagemErro = 'Erro ao carregar usuário';
                this.carregando = false;
            });
        }
    }

    async salvar() {
        if (this.form.invalid) return;

        this.salvando = true;
        this.mensagemErro = '';

        try {
            const { matricula, senha, area, perfil } = this.form.value;

            // Verifica se matrícula já existe
            const matriculaExiste = await this.usuariosService.matriculaExiste(matricula, this.usuarioId);
            if (matriculaExiste) {
                this.ngZone.run(() => {
                    this.mensagemErro = 'Esta matrícula já está cadastrada';
                    this.salvando = false;
                });
                return;
            }

            if (this.editando && this.usuarioId) {
                const dadosAtualizar: any = { matricula, area, perfil };
                if (senha) {
                    dadosAtualizar.senha = senha;
                }
                await this.usuariosService.atualizar(this.usuarioId, dadosAtualizar);
            } else {
                await this.usuariosService.criar({ matricula, senha, area, perfil });
            }

            this.ngZone.run(() => {
                this.router.navigate(['/usuarios']);
            });
        } catch (err) {
            console.error('Erro ao salvar usuário:', err);
            this.ngZone.run(() => {
                this.mensagemErro = 'Erro ao salvar usuário. Tente novamente.';
                this.salvando = false;
            });
        }
    }

    voltar() {
        this.router.navigate(['/usuarios']);
    }
}
