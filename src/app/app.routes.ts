import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { ExcelUploadComponent } from './components/excel-upload/excel-upload';
import { BlocosListComponent } from './components/blocos-list/blocos-list';
import { CapasComponent } from './components/capas/capas';
import { DocumentoBlocoComponent } from './pages/documento-bloco/documento-bloco';
import { LoginComponent } from './pages/login/login';
import { UsuariosListComponent } from './pages/usuarios/usuarios-list/usuarios-list';
import { UsuarioFormComponent } from './pages/usuarios/usuario-form/usuario-form';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: '',
        component: BlocosListComponent,
        canActivate: [authGuard]
    },
    {
        path: 'home',
        component: HomeComponent,
        canActivate: [authGuard]
    },
    {
        path: 'importar',
        component: ExcelUploadComponent,
        canActivate: [authGuard]
    },
    {
        path: 'blocos',
        redirectTo: '',
        pathMatch: 'full'
    },
    {
        path: 'capas',
        component: CapasComponent,
        canActivate: [authGuard]
    },
    {
        path: 'documento/:id',
        component: DocumentoBlocoComponent,
        canActivate: [authGuard]
    },
    {
        path: 'usuarios',
        component: UsuariosListComponent,
        canActivate: [authGuard]
    },
    {
        path: 'usuarios/novo',
        component: UsuarioFormComponent,
        canActivate: [authGuard]
    },
    {
        path: 'usuarios/editar/:id',
        component: UsuarioFormComponent,
        canActivate: [authGuard]
    },
    {
        path: '**',
        redirectTo: ''
    }
];
