import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Usuario } from '../interfaces/usuario.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usuarioLogadoSubject = new BehaviorSubject<Usuario | null>(null);
  public usuarioLogado$ = this.usuarioLogadoSubject.asObservable();

  private storageKey = 'usuario_logado';

  constructor(
    private firestore: Firestore,
    private router: Router
  ) {
    this.carregarUsuarioDoStorage();
  }

  private carregarUsuarioDoStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const usuario = JSON.parse(stored);
        this.usuarioLogadoSubject.next(usuario);
      }
    } catch (e) {
      console.warn('Erro ao carregar usuário do storage:', e);
    }
  }

  async login(matricula: string, senha: string): Promise<{ sucesso: boolean; mensagem: string }> {
    try {
      const usuariosCollection = collection(this.firestore, 'usuarios');
      const q = query(
        usuariosCollection,
        where('matricula', '==', matricula)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { sucesso: false, mensagem: 'Matrícula ou senha inválidos' };
      }

      const doc = querySnapshot.docs[0];
      const dadosUsuario = doc.data() as Omit<Usuario, 'id'>;

      if (dadosUsuario.senha !== senha) {
        return { sucesso: false, mensagem: 'Matrícula ou senha inválidos' };
      }

      const usuario: Usuario = {
        id: doc.id,
        ...dadosUsuario
      };

      const usuarioParaSalvar = { ...usuario, senha: '' };
      localStorage.setItem(this.storageKey, JSON.stringify(usuarioParaSalvar));
      this.usuarioLogadoSubject.next(usuario);

      return { sucesso: true, mensagem: 'Login realizado com sucesso' };
    } catch (error: any) {
      console.error('Erro no login:', error);
      return { sucesso: false, mensagem: 'Erro ao conectar. Tente novamente.' };
    }
  }

  logout() {
    localStorage.removeItem(this.storageKey);
    this.usuarioLogadoSubject.next(null);
    this.router.navigate(['/login']);
  }

  get usuarioLogado(): Usuario | null {
    return this.usuarioLogadoSubject.value;
  }

  get isLogado(): boolean {
    return this.usuarioLogadoSubject.value !== null;
  }

  get isAdmin(): boolean {
    return this.usuarioLogadoSubject.value?.perfil === 'admin';
  }

  get isOperador(): boolean {
    return this.usuarioLogadoSubject.value?.perfil === 'operador';
  }

  get isVisualizador(): boolean {
    return this.usuarioLogadoSubject.value?.perfil === 'visualizador';
  }

  get podeEditar(): boolean {
    const perfil = this.usuarioLogadoSubject.value?.perfil;
    return perfil === 'admin' || perfil === 'operador';
  }

  get areaUsuario(): string {
    return this.usuarioLogadoSubject.value?.area || '';
  }

  // Mapeamento de área do usuário para regionais dos blocos
  private readonly mapaAreaRegionais: Record<string, string[]> = {
    'GARBO': ['Oeste', 'Barreiro'],
    'GARNP': ['Noroeste', 'Pampulha'],
    'GARNE': ['Nordeste', 'Norte'],
    'GARVN': ['Norte', 'Venda Nova'],
    'GEACE': ['Centro-Sul', 'Hipercentro'],
    'OUTRAS': []
  };

  get regionaisDaArea(): string[] {
    const area = this.areaUsuario.toUpperCase();
    return this.mapaAreaRegionais[area] || [];
  }

  get filtraPorArea(): boolean {
    const area = this.areaUsuario.toUpperCase();
    return area !== 'OUTRAS' && area !== '' && (this.mapaAreaRegionais[area]?.length || 0) > 0;
  }
}
