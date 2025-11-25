import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { ExcelUploadComponent } from './components/excel-upload/excel-upload';

export const routes: Routes = [
    {
        path: '',
        component: HomeComponent
    },
    {
        path: 'importar',
        component: ExcelUploadComponent
    },
    {
        path: '**',
        redirectTo: ''
    }
];
