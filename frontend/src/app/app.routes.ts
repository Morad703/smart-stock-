import { Routes } from '@angular/router';

import { FournisseurListComponent } from './modules/fournisseur/list/fournisseur-list.component';
import { FournisseurFormComponent } from './modules/fournisseur/form/fournisseur-form.component';
import { FournisseurDetailsComponent } from './modules/fournisseur/details/fournisseur-details.component';

import { ProduitListComponent } from './modules/produit/list/produit-list.component';
import { ProduitFormComponent } from './modules/produit/form/produit-form.component';
import { ProduitDetailsComponent } from './modules/produit/details/produit-details.component';

import { StockListComponent } from './modules/stock/list/stock-list.component';
import { StockFormComponent } from './modules/stock/form/stock-form.component';
import { StockDetailsComponent } from './modules/stock/details/stock-details.component';
import { StockSortieComponent } from './modules/stock/sortie/stock-sortie.component';
import { CommandeListComponent } from './modules/commande/list/commande-list.component';
import { CommandeFormComponent } from './modules/commande/form/commande-form.component';
import { CommandeDetailsComponent } from './modules/commande/details/commande-details.component';
import {NotificationsComponent} from './modules/notif/notifications.component';
import { HomeComponent } from './modules/home/home.component';
import { LoginComponent } from './modules/auth/login/login.component';
import { RegisterComponent } from './modules/auth/register/register.component';
import { AuthGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  /** Login - Public **/
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  /** Home **/
  { 
    path: 'home', 
    component: HomeComponent, 
    canActivate: [AuthGuard],
    runGuardsAndResolvers: 'always'
  },

  /** Fournisseurs **/
  { path: 'fournisseurs', component: FournisseurListComponent, canActivate: [AuthGuard] },
  { path: 'fournisseurs/nouveau', component: FournisseurFormComponent, canActivate: [AuthGuard] },
  { path: 'fournisseurs/details/:id', component: FournisseurDetailsComponent, canActivate: [AuthGuard] },

  /** Produits **/
  { path: 'produits', component: ProduitListComponent, canActivate: [AuthGuard] },
  { path: 'produits/nouveau', component: ProduitFormComponent, canActivate: [AuthGuard] },
  { path: 'produits/details/:id', component: ProduitDetailsComponent, canActivate: [AuthGuard] },

  /** Stocks **/
  { path: 'stocks', component: StockListComponent, canActivate: [AuthGuard] },
  { path: 'stocks/nouveau', component: StockFormComponent, canActivate: [AuthGuard] },
  { path: 'stocks/details/:id', component: StockDetailsComponent, canActivate: [AuthGuard] },
  { path: 'stocks/sortie', component: StockSortieComponent, canActivate: [AuthGuard] },

  /** Commandes **/
  { path: 'commandes', component: CommandeListComponent, canActivate: [AuthGuard] },
  { path: 'commandes/nouveau', component: CommandeFormComponent, canActivate: [AuthGuard] },
  { path: 'commandes/details/:id', component: CommandeDetailsComponent, canActivate: [AuthGuard] },

  {
    path: 'notifications',
    component: NotificationsComponent,
    canActivate: [AuthGuard]
  },
  /** Redirect par défaut **/
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
