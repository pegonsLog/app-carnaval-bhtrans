import { Component, NgZone } from '@angular/core';
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

  // Progresso do salvamento
  progressoAtual = 0;
  progressoTotal = 0;
  progressoNovos = 0;
  progressoAtualizados = 0;

  constructor(
    private blocosService: BlocosService,
    private ngZone: NgZone
  ) { }

  // Função auxiliar para parsear datas do Excel
  private parseExcelDate(dateValue: any): Date {
    if (!dateValue) {
      return new Date();
    }

    // Se já for um objeto Date válido
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return dateValue;
    }

    // Se for um número (serial do Excel)
    if (typeof dateValue === 'number') {
      // Excel usa 1/1/1900 como base (com bug do ano bissexto)
      const excelEpoch = new Date(1899, 11, 30);
      return new Date(excelEpoch.getTime() + dateValue * 86400000);
    }

    // Se for string, tenta diferentes formatos
    if (typeof dateValue === 'string') {
      const trimmed = dateValue.trim();

      // Formato dd/mm/yyyy ou dd-mm-yyyy
      const brMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (brMatch) {
        const [, day, month, year] = brMatch;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }

      // Formato yyyy-mm-dd ou yyyy/mm/dd
      const isoMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
      if (isoMatch) {
        const [, year, month, day] = isoMatch;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }

      // Tenta o parse padrão do JavaScript
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    // Se nada funcionar, retorna a data atual
    console.warn('Não foi possível parsear a data:', dateValue);
    return new Date();
  }

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
      dataCadastroModificacao: this.parseExcelDate(excelRow['Data de Cadastro ou Modificação']),
      primeiroCadastro: excelRow['Primeiro Cadastro?']?.toLowerCase() === 'sim',

      publicoDeclarado: parseInt(excelRow['Público Declarado']) || 0,

      perfil: excelRow['Perfil'] || '',
      estiloDeMusica: excelRow['Estilo de Música'] || '',
      descricaoDoBloco: excelRow['Descrição Do Bloco'] || '',

      dataDoDesfile: this.parseExcelDate(excelRow['Data Do Desfile']),
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
    this.progressoAtual = 0;
    this.progressoTotal = this.excelData.length;
    this.progressoNovos = 0;
    this.progressoAtualizados = 0;

    try {
      // Mapear os dados do Excel para a interface Blocos
      const blocos: Blocos[] = this.excelData.map(row => this.mapExcelDataToBlocos(row));

      // Salvar no Firestore com callback de progresso
      const resultado = await this.blocosService.salvarBlocos(blocos, (atual, total, novos, atualizados) => {
        this.ngZone.run(() => {
          this.progressoAtual = atual;
          this.progressoTotal = total;
          this.progressoNovos = novos;
          this.progressoAtualizados = atualizados;
        });
      });

      this.ngZone.run(() => {
        this.saveMessage = `✓ Sucesso! ${resultado.total} registro(s) processado(s): ${resultado.novos} novo(s), ${resultado.atualizados} atualizado(s).`;
        this.saveMessageType = 'success';
        this.isSaving = false;
      });
    } catch (error) {
      console.error('Erro ao salvar no Firestore:', error);
      this.ngZone.run(() => {
        this.saveMessage = `✗ Erro ao salvar no Firestore: ${error}`;
        this.saveMessageType = 'error';
        this.isSaving = false;
      });
    }
  }

  get progressoPorcentagem(): number {
    if (this.progressoTotal === 0) return 0;
    return Math.round((this.progressoAtual / this.progressoTotal) * 100);
  }

  clearData() {
    this.excelData = [];
    this.fileName = '';
    this.headers = [];
    this.saveMessage = '';
    this.saveMessageType = '';
  }
}
