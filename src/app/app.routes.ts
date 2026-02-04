import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { ExcelUploadComponent } from './components/excel-upload/excel-upload';
import { BlocosListComponent } from './components/blocos-list/blocos-list';
import { BlocosAdminComponent } from './components/blocos-admin/blocos-admin';
import { CapasComponent } from './components/capas/capas';
import { DocumentoBlocoComponent } from './pages/documento-bloco/documento-bloco';
import { LoginComponent } from './pages/login/login';
import { AcessoPublicoComponent } from './pages/acesso-publico/acesso-publico';
import { UsuariosListComponent } from './pages/usuarios/usuarios-list/usuarios-list';
import { UsuarioFormComponent } from './pages/usuarios/usuario-form/usuario-form';
import { MenuComponent } from './components/menu/menu';
import { BuscaBlocoComponent } from './pages/busca-bloco/busca-bloco';
import { BuscaRegionalComponent } from './pages/busca-regional/busca-regional';
import { BuscaDataComponent } from './pages/busca-data/busca-data';
import { BuscaLivreComponent } from './pages/busca-livre/busca-livre';
import { BuscaLinhaComponent } from './pages/busca-linha/busca-linha';
import { MapaComponent } from './pages/mapa/mapa';
import { LinhaTcUploadComponent } from './components/linha-tc-upload/linha-tc-upload';
import { LinhaTcListComponent } from './components/linha-tc-list/linha-tc-list';
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
        path: 'admin/blocos',
        component: BlocosAdminComponent,
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
        path: 'busca-bloco',
        component: BuscaBlocoComponent
    },
    {
        path: 'busca-regional',
        component: BuscaRegionalComponent
    },
    {
        path: 'busca-data',
        component: BuscaDataComponent
    },
    {
        path: 'busca-livre',
        component: BuscaLivreComponent
    },
    {
        path: 'busca-linha',
        component: BuscaLinhaComponent
    },
    {
        path: 'mapa',
        component: MapaComponent
    },
    {
        path: 'linhas-tc',
        component: LinhaTcListComponent,
        canActivate: [authGuard]
    },
    {
        path: 'linhas-tc/importar',
        component: LinhaTcUploadComponent,
        canActivate: [authGuard]
    },
    {
        path: '**',
        redirectTo: ''
    }
];
