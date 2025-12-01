import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  getDocs
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Usuario } from '../interfaces/usuario.interface';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private collectionName = 'usuarios';

  constructor(private firestore: Firestore) { }

  listar(): Observable<Usuario[]> {
    const usuariosRef = collection(this.firestore, this.collectionName);
    return collectionData(usuariosRef, { idField: 'id' }) as Observable<Usuario[]>;
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const docRef = doc(this.firestore, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Usuario;
    }
    return null;
  }

  async matriculaExiste(matricula: string, idExcluir?: string): Promise<boolean> {
    const usuariosRef = collection(this.firestore, this.collectionName);
    const q = query(usuariosRef, where('matricula', '==', matricula));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return false;
    if (idExcluir) {
      return snapshot.docs.some(doc => doc.id !== idExcluir);
    }
    return true;
  }

  async criar(usuario: Omit<Usuario, 'id'>): Promise<string> {
    const usuariosRef = collection(this.firestore, this.collectionName);
    const docRef = await addDoc(usuariosRef, usuario);
    return docRef.id;
  }

  async atualizar(id: string, usuario: Partial<Usuario>): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    await updateDoc(docRef, usuario);
  }

  async excluir(id: string): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    await deleteDoc(docRef);
  }
}
