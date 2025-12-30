import { Injectable } from '@angular/core';
import {
  Storage,
  ref,
  uploadBytes,
  listAll,
  getDownloadURL,
  deleteObject,
  getMetadata,
} from '@angular/fire/storage';

export interface DocumentoInfo {
  nome: string;
  url: string;
  path: string;
  dataUpload: Date;
  tamanho: number;
}

@Injectable({
  providedIn: 'root',
})
export class DocumentosService {
  private basePath = 'documentos';

  constructor(private storage: Storage) { }

  // Upload de documento PDF
  async uploadDocumento(arquivo: File): Promise<DocumentoInfo> {
    if (!arquivo.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('Apenas arquivos .pdf são permitidos');
    }

    const timestamp = Date.now();
    const nomeArquivo = `${timestamp}_${arquivo.name}`;
    const path = `${this.basePath}/${nomeArquivo}`;
    const storageRef = ref(this.storage, path);

    await uploadBytes(storageRef, arquivo);
    const url = await getDownloadURL(storageRef);

    return {
      nome: arquivo.name,
      url,
      path,
      dataUpload: new Date(),
      tamanho: arquivo.size,
    };
  }

  // Lista todos os documentos
  async listarDocumentos(): Promise<DocumentoInfo[]> {
    const listRef = ref(this.storage, this.basePath);

    try {
      const result = await listAll(listRef);
      const documentos: DocumentoInfo[] = [];

      for (const itemRef of result.items) {
        if (itemRef.name.toLowerCase().endsWith('.pdf')) {
          const url = await getDownloadURL(itemRef);
          const metadata = await getMetadata(itemRef);

          // Remove o timestamp do nome para exibição
          const nomeOriginal = itemRef.name.replace(/^\d+_/, '');

          documentos.push({
            nome: nomeOriginal,
            url,
            path: itemRef.fullPath,
            dataUpload: new Date(metadata.timeCreated),
            tamanho: metadata.size || 0,
          });
        }
      }

      // Ordena por data de upload (mais recente primeiro)
      return documentos.sort(
        (a, b) => b.dataUpload.getTime() - a.dataUpload.getTime()
      );
    } catch (error) {
      console.error('Erro ao listar documentos:', error);
      return [];
    }
  }

  // Remove um documento
  async removerDocumento(path: string): Promise<void> {
    const storageRef = ref(this.storage, path);
    await deleteObject(storageRef);
  }

  // Formata o tamanho do arquivo para exibição
  formatarTamanho(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
