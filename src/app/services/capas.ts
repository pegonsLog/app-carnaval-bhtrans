import { Injectable } from '@angular/core';
import {
    Firestore,
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
} from '@angular/fire/firestore';
import { Capa } from '../interfaces/capa.interface';

@Injectable({
    providedIn: 'root',
})
export class CapasService {
    private collectionName = 'capas';

    constructor(private firestore: Firestore) { }

    async getCapas(): Promise<Capa[]> {
        const capasCollection = collection(this.firestore, this.collectionName);
        const querySnapshot = await getDocs(capasCollection);

        return querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Capa[];
    }

    async salvarCapa(capa: Capa): Promise<string> {
        const capasCollection = collection(this.firestore, this.collectionName);
        const docRef = await addDoc(capasCollection, {
            ...capa,
            dataCriacao: new Date(),
            dataAtualizacao: new Date(),
        });
        return docRef.id;
    }

    async atualizarCapa(id: string, capa: Partial<Capa>): Promise<void> {
        const docRef = doc(this.firestore, this.collectionName, id);
        await updateDoc(docRef, {
            ...capa,
            dataAtualizacao: new Date(),
        });
    }

    async excluirCapa(id: string): Promise<void> {
        const docRef = doc(this.firestore, this.collectionName, id);
        await deleteDoc(docRef);
    }
}
