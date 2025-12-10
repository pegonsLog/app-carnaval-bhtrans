import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where, updateDoc, doc, setDoc, deleteDoc, getDoc } from '@angular/fire/firestore';
import { Blocos } from '../interfaces/blocos.interface';

@Injectable({
  providedIn: 'root'
})
export class BlocosService {
  private collectionName = 'blocos';
  private mapasCollectionName = 'blocos-mapas';

  constructor(private firestore: Firestore) { }

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

  // Salva ou atualiza um bloco baseado no número de inscrição, nome do bloco e data do desfile
  async salvarBloco(bloco: Blocos): Promise<void> {
    const blocosCollection = collection(this.firestore, this.collectionName);

    // Busca se já existe um bloco com os mesmos campos identificadores
    const q = query(
      blocosCollection,
      where('numeroInscricao', '==', bloco.numeroInscricao),
      where('nomeDoBloco', '==', bloco.nomeDoBloco),
      where('dataDoDesfile', '==', bloco.dataDoDesfile)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Se existe, atualiza o documento existente
      const docId = querySnapshot.docs[0].id;
      const docRef = doc(this.firestore, this.collectionName, docId);
      await updateDoc(docRef, { ...bloco } as any);
    } else {
      // Se não existe, cria um novo documento
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

      // Busca usando os três campos identificadores: número de inscrição, nome do bloco e data do desfile
      const q = query(
        blocosCollection,
        where('numeroInscricao', '==', bloco.numeroInscricao),
        where('nomeDoBloco', '==', bloco.nomeDoBloco),
        where('dataDoDesfile', '==', bloco.dataDoDesfile)
      );
      const querySnapshot = await getDocs(q);

      let blocoDocId: string;

      if (!querySnapshot.empty) {
        // Atualiza documento existente
        blocoDocId = querySnapshot.docs[0].id;
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
}
