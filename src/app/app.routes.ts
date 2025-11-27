import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { ExcelUploadComponent } from './components/excel-upload/excel-upload';
import { BlocosListComponent } from './components/blocos-list/blocos-list';
import { CapasComponent } from './components/capas/capas';
import { DocumentoBlocoComponent } from './pages/documento-bloco/documento-bloco';

export const routes: Routes = [
    {
        path: '',
        component: BlocosListComponent
    },
    {
        path: 'home',
        component: HomeComponent
    },
    {
        path: 'importar',
        component: ExcelUploadComponent
    },
    {
        path: 'blocos',
        redirectTo: '',
        pathMatch: 'full'
    },
    {
        path: 'capas',
        component: CapasComponent
    },
    {
        path: 'documento/:id',
        component: DocumentoBlocoComponent
    },
    {
        path: '**',
        redirectTo: ''
    }
];
