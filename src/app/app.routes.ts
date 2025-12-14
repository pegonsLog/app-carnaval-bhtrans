import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { ExcelUploadComponent } from './components/excel-upload/excel-upload';
import { BlocosListComponent } from './components/blocos-list/blocos-list';
import { CapasComponent } from './components/capas/capas';
import { DocumentoBlocoComponent } from './pages/documento-bloco/documento-bloco';
import { LoginComponent } from './pages/login/login';
import { AcessoPublicoComponent } from './pages/acesso-publico/acesso-publico';
import { UsuariosListComponent } from './pages/usuarios/usuarios-list/usuarios-list';
import { UsuarioFormComponent } from './pages/usuarios/usuario-form/usuario-form';
import { MenuComponent } from './components/menu/menu';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        component: AcessoPublicoComponent
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'admin',
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
        component: DocumentoBlocoComponent
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
        path: 'menu',
        component: MenuComponent,
        canActivate: [authGuard]
    },
    {
        path: '**',
        redirectTo: ''
    }
];
