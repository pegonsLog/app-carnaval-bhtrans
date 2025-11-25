import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { BlocosService } from '../../services/blocos';
import { Blocos } from '../../interfaces/blocos.interface';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroFolder, heroCloudArrowUp, heroClock, heroTrash, heroChartBar } from '@ng-icons/heroicons/outline';


@Component({
  selector: 'app-excel-upload',
  imports: [CommonModule, NgIcon],
  viewProviders: [provideIcons({ heroFolder, heroCloudArrowUp, heroClock, heroTrash, heroChartBar })],
  templateUrl: './excel-upload.html',
  styleUrl: './excel-upload.scss'
})
export class ExcelUploadComponent {
  excelData: any[] = [];
  fileName = '';
  headers: string[] = [];
  isSaving = false;
  saveMessage = '';
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
    const bloco: any = {
      periodo: excelRow['Periodo'] || '',
      possuiDesfiles: excelRow['Possui Desfiles?']?.toLowerCase() === 'sim',
      statusDoDesfile: excelRow['Status do Desfile'] || '',
      numeroInscricao: excelRow['Nº de Inscrição'] || '',
      nomeDoBloco: excelRow['Nome Do Bloco'] || '',
      categoriaDoBloco: excelRow['Categoria Do Bloco'] || '',
      autorizaDivulgacao: excelRow['Autoriza Divulgação']?.toLowerCase() === 'sim',
      dataCadastroModificacao: excelRow['Data de Cadastro ou Modificação'] ? new Date(excelRow['Data de Cadastro ou Modificação']) : new Date(),
      primeiroCadastro: excelRow['Primeiro Cadastro?']?.toLowerCase() === 'sim',

      publicoDeclarado: parseInt(excelRow['Público Declarado']) || 0,

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

      responsavelLegal: excelRow['Responsável Legal'] || '',
      email: excelRow['E Mail'] || '',
      celular: excelRow['Celular'] || ''
    };

    // Adiciona campos opcionais apenas se tiverem valor
    if (excelRow['Justificativa Status']) {
      bloco.justificativaStatus = excelRow['Justificativa Status'];
    }

    if (excelRow['Público Anterior']) {
      const publicoAnterior = parseInt(excelRow['Público Anterior']);
      if (!isNaN(publicoAnterior)) {
        bloco.publicoAnterior = publicoAnterior;
      }
    }

    if (excelRow['Observações Ano Anterior']) {
      bloco.observacoesAnoAnterior = excelRow['Observações Ano Anterior'];
    }

    if (excelRow['Dimensão De Veículos']) {
      bloco.dimensaoDeVeiculos = excelRow['Dimensão De Veículos'];
    }

    if (excelRow['Informações Adicionais']) {
      bloco.informacoesAdicionais = excelRow['Informações Adicionais'];
    }

    if (excelRow['CNPJ']) {
      bloco.cnpj = excelRow['CNPJ'];
    }

    if (excelRow['CPF']) {
      bloco.cpf = excelRow['CPF'];
    }

    if (excelRow['Telefone']) {
      bloco.telefone = excelRow['Telefone'];
    }

    if (excelRow['Nome Responsável Secundário']) {
      bloco.nomeResponsavelSecundario = excelRow['Nome Responsável Secundário'];
    }

    if (excelRow['Celular Contato 2']) {
      bloco.celularContato2 = excelRow['Celular Contato 2'];
    }

    return bloco as Blocos;
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
