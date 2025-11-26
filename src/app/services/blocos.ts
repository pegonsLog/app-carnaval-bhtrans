import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where, updateDoc, doc, setDoc } from '@angular/fire/firestore';
import { Blocos } from '../interfaces/blocos.interface';

@Injectable({
  providedIn: 'root'
})
export class BlocosService {
  private collectionName = 'blocos';

  constructor(private firestore: Firestore) { }

  // Salva ou atualiza um bloco baseado no nome
  async salvarBloco(bloco: Blocos): Promise<void> {
    const blocosCollection = collection(this.firestore, this.collectionName);

    // Busca se já existe um bloco com esse nome
    const q = query(blocosCollection, where('nomeDoBloco', '==', bloco.nomeDoBloco));
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
  ): Promise<{ total: number, novos: number, atualizados: number }> {
    let novos = 0;
    let atualizados = 0;
    const total = blocos.length;

    for (let i = 0; i < blocos.length; i++) {
      const bloco = blocos[i];
      const blocosCollection = collection(this.firestore, this.collectionName);
      const q = query(blocosCollection, where('nomeDoBloco', '==', bloco.nomeDoBloco));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Atualiza documento existente
        const docId = querySnapshot.docs[0].id;
        const docRef = doc(this.firestore, this.collectionName, docId);
        await updateDoc(docRef, { ...bloco } as any);
        atualizados++;
      } else {
        // Cria novo documento
        await addDoc(blocosCollection, { ...bloco } as any);
        novos++;
      }

      // Chama callback de progresso
      if (onProgress) {
        onProgress(i + 1, total, novos, atualizados);
      }
    }

    return { total, novos, atualizados };
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
}
