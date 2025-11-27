import { Component, Input, Output, EventEmitter, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Storage, ref, getBytes } from '@angular/fire/storage';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroXMark, heroPrinter } from '@ng-icons/heroicons/outline';

@Component({
    selector: 'app-dados-mymaps',
    imports: [CommonModule, NgIcon],
    viewProviders: [provideIcons({ heroXMark, heroPrinter })],
    templateUrl: './dados-mymaps.html',
    styleUrl: './dados-mymaps.scss'
})
export class DadosMymapsComponent implements OnInit {
    @Input() bloco: any;
    @Output() fechar = new EventEmitter<void>();

    markdownContent = '';
    parsedData: any = {};
    isLoading = true;
    errorMessage = '';

    constructor(
        private storage: Storage,
        private ngZone: NgZone
    ) { }

    ngOnInit() {
        this.carregarDados();
    }

    async carregarDados() {
        if (!this.bloco?.percursoUrl) {
            this.errorMessage = 'Nenhum arquivo de descritivo disponível para este bloco.';
            this.isLoading = false;
            return;
        }

        try {
            const storagePath = this.extrairPathDoStorage(this.bloco.percursoUrl);

            if (storagePath) {
                const storageRef = ref(this.storage, storagePath);
                const bytes = await getBytes(storageRef);
                const decoder = new TextDecoder('utf-8');
                this.markdownContent = decoder.decode(bytes);
            } else {
                throw new Error('Não foi possível extrair o caminho do arquivo');
            }

            this.ngZone.run(() => {
                this.parsedData = this.parseMarkdown(this.markdownContent);
                this.isLoading = false;
            });
        } catch (error: any) {
            console.error('Erro ao carregar dados:', error);
            this.ngZone.run(() => {
                this.errorMessage = 'Erro ao carregar o arquivo descritivo.';
                this.isLoading = false;
            });
        }
    }

    private extrairPathDoStorage(url: string): string | null {
        try {
            const match = url.match(/\/o\/([^?]+)/);
            if (match) {
                return decodeURIComponent(match[1]);
            }
        } catch {
            return null;
        }
        return null;
    }

    private parseMarkdown(md: string): any {
        const data: any = {
            titulo: '',
            secoes: []
        };

        const lines = md.split('\n');
        let currentSection: any = null;

        for (const line of lines) {
            const trimmed = line.trim();

            // Título principal (# )
            if (trimmed.startsWith('# ')) {
                data.titulo = trimmed.substring(2).trim();
                continue;
            }

            // Seção (## )
            if (trimmed.startsWith('## ')) {
                if (currentSection) {
                    data.secoes.push(currentSection);
                }
                currentSection = {
                    titulo: trimmed.substring(3).trim(),
                    items: []
                };
                continue;
            }

            // Item de lista (- **campo:** valor)
            if (trimmed.startsWith('- ') && currentSection) {
                const itemText = trimmed.substring(2);
                const boldMatch = itemText.match(/\*\*([^*]+)\*\*:?\s*(.*)/);

                if (boldMatch) {
                    currentSection.items.push({
                        label: boldMatch[1].replace(':', ''),
                        value: boldMatch[2] || '-'
                    });
                } else {
                    currentSection.items.push({
                        label: '',
                        value: itemText
                    });
                }
                continue;
            }

            // Link do Google Maps
            if (trimmed.startsWith('[') && trimmed.includes('](')) {
                const linkMatch = trimmed.match(/\[([^\]]+)\]\(([^)]+)\)/);
                if (linkMatch && currentSection) {
                    currentSection.items.push({
                        label: 'Link',
                        value: linkMatch[1],
                        url: linkMatch[2]
                    });
                }
            }
        }

        if (currentSection) {
            data.secoes.push(currentSection);
        }

        return data;
    }

    fecharModal() {
        this.fechar.emit();
    }

    imprimir() {
        window.print();
    }

    formatDate(value: any): string {
        if (!value) return '-';
        try {
            const date = value.toDate ? value.toDate() : new Date(value);
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString('pt-BR');
            }
        } catch {
            return String(value);
        }
        return '-';
    }
}
