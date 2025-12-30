import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirebaseTestService {

  constructor(private firestore: Firestore) {}

  async testarConexao(): Promise<{ sucesso: boolean; mensagem: string }> {
    try {
      console.log('Testando conexão com Firebase...');
      
      // Tenta listar a coleção de usuários
      const usuariosCollection = collection(this.firestore, 'usuarios');
      const snapshot = await getDocs(usuariosCollection);
      
      console.log('Conexão bem-sucedida! Documentos encontrados:', snapshot.size);
      
      return {
        sucesso: true,
        mensagem: `Conexão estabelecida. ${snapshot.size} usuários encontrados.`
      };
      
    } catch (error: any) {
      console.error('Erro na conexão:', error);
      
      let mensagem = 'Erro desconhecido';
      
      if (error.code === 'permission-denied') {
        mensagem = 'Permissões insuficientes. Verifique as regras do Firestore.';
      } else if (error.code === 'unavailable') {
        mensagem = 'Serviço indisponível. Verifique sua conexão com a internet.';
      } else if (error.code === 'unauthenticated') {
        mensagem = 'Não autenticado. Verifique as configurações do Firebase.';
      } else {
        mensagem = `Erro: ${error.message}`;
      }
      
      return {
        sucesso: false,
        mensagem
      };
    }
  }

  async criarUsuarioTeste(): Promise<{ sucesso: boolean; mensagem: string }> {
    try {
      const usuariosCollection = collection(this.firestore, 'usuarios');
      
      const usuarioTeste = {
        matricula: 'teste123',
        senha: 'teste123',
        nome: 'Usuário Teste',
        perfil: 'administrador',
        area: 'GEACE',
        ativo: true,
        criadoEm: new Date()
      };
      
      const docRef = await addDoc(usuariosCollection, usuarioTeste);
      
      return {
        sucesso: true,
        mensagem: `Usuário teste criado com ID: ${docRef.id}`
      };
      
    } catch (error: any) {
      console.error('Erro ao criar usuário teste:', error);
      
      return {
        sucesso: false,
        mensagem: `Erro ao criar usuário: ${error.message}`
      };
    }
  }
}