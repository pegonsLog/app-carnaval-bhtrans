import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, getDoc } from '@angular/fire/firestore';
import { Blocos } from '../interfaces/blocos.interface';

@Injectable({
  providedIn: 'root'
})
export class BlocosService {
  private collectionName = 'blocos';
  private mapasCollectionName = 'blocos-mapas';

  constructor(private firestore: Firestore) { }

  // Converte data para string YYYY-MM-DD para comparação consistente
  private formatDateForComparison(date: any): string {
    if (!date) return '';
    // Se for Timestamp do Firestore
    if (date?.toDate) {
      date = date.toDate();
    }
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Busca dados do mapa salvos na coleção separada
  async getDadosMapa(numeroInscricao: string): Promise<any | null> {
    try {
      const mapaDocRef = doc(this.firestore, this.mapasCollectionName, numeroInscricao);
      const mapaDoc = await getDoc(mapaDocRef);

      if (mapaDoc.exists()) {
        return mapaDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar dados do mapa:', error);
      return null;
    }
  }

  // Vincula dados do mapa ao bloco (usado após importação)
  async vincularDadosMapa(numeroInscricao: string, blocoDocId: string): Promise<boolean> {
    try {
      const dadosMapa = await this.getDadosMapa(numeroInscricao);

      if (dadosMapa && (dadosMapa.percursoUrl || dadosMapa.myMapsEmbedUrl)) {
        const docRef = doc(this.firestore, this.collectionName, blocoDocId);
        const updateData: any = {};

        if (dadosMapa.percursoUrl) {
          updateData.percursoUrl = dadosMapa.percursoUrl;
        }
        if (dadosMapa.myMapsEmbedUrl) {
          updateData.myMapsEmbedUrl = dadosMapa.myMapsEmbedUrl;
        }
        if (dadosMapa.percursoDataUpload) {
          updateData.percursoDataUpload = dadosMapa.percursoDataUpload;
        }

        await updateDoc(docRef, updateData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao vincular dados do mapa:', error);
      return false;
    }
  }

  // Salva ou atualiza um bloco baseado no número de inscrição e data do desfile
  async salvarBloco(bloco: Blocos): Promise<void> {
    const blocosCollection = collection(this.firestore, this.collectionName);
    const dataDesfileNova = this.formatDateForComparison(bloco.dataDoDesfile);

    // Busca todos os blocos com o mesmo número de inscrição
    const q = query(
      blocosCollection,
      where('numeroInscricao', '==', bloco.numeroInscricao)
    );
    const querySnapshot = await getDocs(q);

    // Procura documento para atualizar
    // Se existe apenas 1 registro, atualiza ele (mesmo com data diferente)
    // Se existem múltiplos, procura pela mesma data de desfile
    let docExistente: any = null;
    
    if (querySnapshot.size === 1) {
      docExistente = querySnapshot.docs[0];
    } else if (querySnapshot.size > 1) {
      for (const docSnapshot of querySnapshot.docs) {
        const dados = docSnapshot.data();
        const dataExistente = this.formatDateForComparison(dados['dataDoDesfile']);
        if (dataExistente === dataDesfileNova) {
          docExistente = docSnapshot;
          break;
        }
      }
    }

    if (docExistente) {
      const docRef = doc(this.firestore, this.collectionName, docExistente.id);
      await updateDoc(docRef, { ...bloco } as any);
    } else {
      await addDoc(blocosCollection, { ...bloco } as any);
    }
  }

  // Salva múltiplos blocos com callback de progresso
  async salvarBlocos(
    blocos: Blocos[],
    onProgress?: (atual: number, total: number, novos: number, atualizados: number) => void
  ): Promise<{ total: number, novos: number, atualizados: number, mapasVinculados: number }> {
    let novos = 0;
    let atualizados = 0;
    let mapasVinculados = 0;
    const total = blocos.length;

    for (let i = 0; i < blocos.length; i++) {
      const bloco = blocos[i];
      const blocosCollection = collection(this.firestore, this.collectionName);
      const dataDesfileNova = this.formatDateForComparison(bloco.dataDoDesfile);

      // Busca todos os blocos com o mesmo número de inscrição
      const q = query(
        blocosCollection,
        where('numeroInscricao', '==', bloco.numeroInscricao)
      );
      const querySnapshot = await getDocs(q);

      // Procura documento para atualizar
      // Se existe apenas 1 registro com esse numeroInscricao, atualiza ele (mesmo com data diferente)
      // Se existem múltiplos, procura pela mesma data de desfile
      let docExistente: any = null;
      
      if (querySnapshot.size === 1) {
        // Apenas 1 registro: atualiza independente da data (caso a data tenha sido alterada)
        docExistente = querySnapshot.docs[0];
      } else if (querySnapshot.size > 1) {
        // Múltiplos registros: procura pela mesma data de desfile
        for (const docSnapshot of querySnapshot.docs) {
          const dados = docSnapshot.data();
          const dataExistente = this.formatDateForComparison(dados['dataDoDesfile']);
          if (dataExistente === dataDesfileNova) {
            docExistente = docSnapshot;
            break;
          }
        }
      }

      let blocoDocId: string;

      if (docExistente) {
        // Atualiza documento existente
        blocoDocId = docExistente.id;
        const docRef = doc(this.firestore, this.collectionName, blocoDocId);
        await updateDoc(docRef, { ...bloco } as any);
        atualizados++;
      } else {
        // Cria novo documento
        const docRef = await addDoc(blocosCollection, { ...bloco } as any);
        blocoDocId = docRef.id;
        novos++;
      }

      // Tenta vincular dados do mapa salvos anteriormente
      if (bloco.numeroInscricao) {
        const vinculado = await this.vincularDadosMapa(bloco.numeroInscricao, blocoDocId);
        if (vinculado) {
          mapasVinculados++;
        }
      }

      // Chama callback de progresso
      if (onProgress) {
        onProgress(i + 1, total, novos, atualizados);
      }
    }

    return { total, novos, atualizados, mapasVinculados };
  }

  // Busca todos os blocos
  async getBlocos(): Promise<any[]> {
    const blocosCollection = collection(this.firestore, this.collectionName);
    const querySnapshot = await getDocs(blocosCollection);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  // Busca apenas blocos aprovados e alterados (para acesso público)
  async getBlocosPublicos(): Promise<any[]> {
    const blocos = await this.getBlocos();
    return blocos.filter(bloco => {
      const status = (bloco.statusDoDesfile || '').toString().toUpperCase().trim();
      return status === 'APROVADO' || status === 'ALTERADO';
    });
  }

  // Busca blocos com limite (para carregamento inicial rápido)
  async getBlocosLimitados(limite: number): Promise<any[]> {
    const { limit: limitFn, orderBy } = await import('@angular/fire/firestore');
    const blocosCollection = collection(this.firestore, this.collectionName);
    const q = query(blocosCollection, orderBy('nomeDoBloco'), limitFn(limite));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  // Exclui todos os blocos
  async excluirTodosBlocos(onProgress?: (atual: number, total: number) => void): Promise<number> {
    const blocosCollection = collection(this.firestore, this.collectionName);
    const querySnapshot = await getDocs(blocosCollection);
    const total = querySnapshot.docs.length;

    for (let i = 0; i < querySnapshot.docs.length; i++) {
      const docSnapshot = querySnapshot.docs[i];
      await deleteDoc(doc(this.firestore, this.collectionName, docSnapshot.id));
      if (onProgress) {
        onProgress(i + 1, total);
      }
    }

    return total;
  }

  // Exclui um bloco pelo ID
  async excluirBloco(id: string): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    await deleteDoc(docRef);
  }
}
