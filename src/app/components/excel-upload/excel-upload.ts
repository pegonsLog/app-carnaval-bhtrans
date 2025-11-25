import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { BlocosService } from '../../services/blocos';
import { Blocos } from '../../interfaces/blocos.interface';


@Component({
  selector: 'app-excel-upload',
  imports: [CommonModule],
  templateUrl: './excel-upload.html',
  styleUrl: './excel-upload.scss'
})
export class ExcelUploadComponent {
  excelData: any[] = [];
  fileName: string = '';
  headers: string[] = [];
  isSaving: boolean = false;
  saveMessage: string = '';
  saveMessageType: 'success' | 'error' | '' = '';

  constructor(private blocosService: BlocosService) { }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.fileName = file.name;
      this.saveMessage = '';
      const reader = new FileReader();

      reader.onload = (e: any) => {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Pega a primeira planilha
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Converte para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        this.excelData = jsonData;

        // Extrai os headers (nomes das colunas)
        if (this.excelData.length > 0) {
          this.headers = Object.keys(this.excelData[0]);
        }
      };

      reader.readAsBinaryString(file);
    }
  }

  // Mapeia os dados do Excel para a interface Blocos
  mapExcelDataToBlocos(excelRow: any): Blocos {
    return {
      periodo: excelRow['Periodo'] || '',
      possuiDesfiles: excelRow['Possui Desfiles?']?.toLowerCase() === 'sim',
      statusDoDesfile: excelRow['Status do Desfile'] || '',
      justificativaStatus: excelRow['Justificativa Status'],
      numeroInscricao: excelRow['Nº de Inscrição'] || '',
      nomeDoBloco: excelRow['Nome Do Bloco'] || '',
      categoriaDoBloco: excelRow['Categoria Do Bloco'] || '',
      autorizaDivulgacao: excelRow['Autoriza Divulgação']?.toLowerCase() === 'sim',
      dataCadastroModificacao: excelRow['Data de Cadastro ou Modificação'] ? new Date(excelRow['Data de Cadastro ou Modificação']) : new Date(),
      primeiroCadastro: excelRow['Primeiro Cadastro?']?.toLowerCase() === 'sim',

      publicoAnterior: excelRow['Público Anterior'] ? parseInt(excelRow['Público Anterior']) : undefined,
      publicoDeclarado: parseInt(excelRow['Público Declarado']) || 0,
      observacoesAnoAnterior: excelRow['Observações Ano Anterior'],

      perfil: excelRow['Perfil'] || '',
      estiloDeMusica: excelRow['Estilo de Música'] || '',
      descricaoDoBloco: excelRow['Descrição Do Bloco'] || '',

      dataDoDesfile: excelRow['Data Do Desfile'] ? new Date(excelRow['Data Do Desfile']) : new Date(),
      horarioDeconcentracao: excelRow['Horário Deconcentração'] || '',
      inicioDoDesfile: excelRow['Início Do Desfile'] || '',
      horarioEncerramento: excelRow['Horário Encerramento'] || '',
      duracaoDoDesfile: excelRow['Duração Do Desfile'] || '',
      horarioDispersao: excelRow['Horário Dispersão'] || '',

      equipamentosUtilizados: excelRow['Equipamentos Utilizados'] ? excelRow['Equipamentos Utilizados'].split(',').map((e: string) => e.trim()) : [],
      larguraMetros: parseFloat(excelRow['Largura Metros']) || 0,
      comprimentoMetros: parseFloat(excelRow['Comprimento Metros']) || 0,
      alturaMetros: parseFloat(excelRow['Altura Metros']) || 0,
      potenciaWatts: parseFloat(excelRow['Potência Watts']) || 0,
      dimensaoDeVeiculos: excelRow['Dimensão De Veículos'],

      percurso: excelRow['Percurso'] || '',
      regional: excelRow['Regional'] || '',
      enderecoDeConcentracao: excelRow['Endereço De Concentração'] || '',
      bairroDeConcentracao: excelRow['Bairro De Concentração'] || '',
      enderecoDeDispersao: excelRow['Endereço De Dispersão'] || '',
      bairroDeDispersao: excelRow['Bairro De Dispersão'] || '',
      extensaoDoDesfileMetros: parseFloat(excelRow['Extensão Do Desfile Metros']) || 0,
      numeroDeQuadras: parseInt(excelRow['Número De Quadras']) || 0,
      areaDoTrajetoM2: parseFloat(excelRow['Área Do Trajeto M²']) || 0,
      capacidadePublicoDoTrajeto: parseInt(excelRow['Capacidade Público Do Trajeto']) || 0,

      informacoesAdicionais: excelRow['Informações Adicionais'],

      responsavelLegal: excelRow['Responsável Legal'] || '',
      cnpj: excelRow['CNPJ'],
      cpf: excelRow['CPF'],
      email: excelRow['E Mail'] || '',
      telefone: excelRow['Telefone'],
      celular: excelRow['Celular'] || '',

      nomeResponsavelSecundario: excelRow['Nome Responsável Secundário'],
      celularContato2: excelRow['Celular Contato 2']
    };
  }

  async salvarNoFirestore() {
    if (this.excelData.length === 0) {
      this.saveMessage = 'Nenhum dado para salvar. Por favor, carregue um arquivo Excel primeiro.';
      this.saveMessageType = 'error';
      return;
    }

    this.isSaving = true;
    this.saveMessage = '';

    try {
      // Mapear os dados do Excel para a interface Blocos
      const blocos: Blocos[] = this.excelData.map(row => this.mapExcelDataToBlocos(row));

      // Salvar no Firestore
      const resultado = await this.blocosService.salvarBlocos(blocos);

      this.saveMessage = `✓ Sucesso! ${resultado.total} registro(s) processado(s): ${resultado.novos} novo(s), ${resultado.atualizados} atualizado(s).`;
      this.saveMessageType = 'success';
    } catch (error) {
      console.error('Erro ao salvar no Firestore:', error);
      this.saveMessage = `✗ Erro ao salvar no Firestore: ${error}`;
      this.saveMessageType = 'error';
    } finally {
      this.isSaving = false;
    }
  }

  clearData() {
    this.excelData = [];
    this.fileName = '';
    this.headers = [];
    this.saveMessage = '';
    this.saveMessageType = '';
  }
}
