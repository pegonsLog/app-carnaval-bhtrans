import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, orderBy, limit as limitFn } from '@angular/fire/firestore';
import { LinhaTc } from '../interfaces/linha-tc.interface';

@Injectable({
  providedIn: 'root'
})
export class LinhaTcService {
  private collectionName = 'linhas-tc';

  constructor(private firestore: Firestore) { }

  async salvarLinhaTc(linhaTc: LinhaTc): Promise<void> {
    const linhasCollection = collection(this.firestore, this.collectionName);
    const q = query(linhasCollection, where('linhaDestino', '==', linhaTc.linhaDestino));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docId = querySnapshot.docs[0].id;
      const docRef = doc(this.firestore, this.collectionName, docId);
      await updateDoc(docRef, { ...linhaTc } as any);
    } else {
      await addDoc(linhasCollection, { ...linhaTc } as any);
    }
  }

  async salvarLinhasTc(
    linhas: LinhaTc[],
    onProgress?: (atual: number, total: number, novos: number, atualizados: number) => void
  ): Promise<{ total: number, novos: number, atualizados: number }> {
    let novos = 0;
    let atualizados = 0;
    const total = linhas.length;

    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      const linhasCollection = collection(this.firestore, this.collectionName);
      const q = query(linhasCollection, where('linhaDestino', '==', linha.linhaDestino));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docId = querySnapshot.docs[0].id;
        const docRef = doc(this.firestore, this.collectionName, docId);
        await updateDoc(docRef, { ...linha } as any);
        atualizados++;
      } else {
        await addDoc(linhasCollection, { ...linha } as any);
        novos++;
      }

      if (onProgress) {
        onProgress(i + 1, total, novos, atualizados);
      }
    }

    return { total, novos, atualizados };
  }

  async getLinhasTc(): Promise<any[]> {
    const linhasCollection = collection(this.firestore, this.collectionName);
    const querySnapshot = await getDocs(linhasCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getLinhasTcLimitadas(limite: number): Promise<any[]> {
    const linhasCollection = collection(this.firestore, this.collectionName);
    const q = query(linhasCollection, orderBy('linhaDestino'), limitFn(limite));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async excluirTodasLinhasTc(onProgress?: (atual: number, total: number) => void): Promise<number> {
    const linhasCollection = collection(this.firestore, this.collectionName);
    const querySnapshot = await getDocs(linhasCollection);
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
