import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

import { HomeComponent } from './components/user/home/home.component';
import { ProductComponent } from './components/user/product/product.component';
import { ProductDetailComponent } from './components/user/product-detail/product-detail.component';
import { NewsComponent } from './components/user/news/news.component';
import { CartComponent } from './components/user/cart/cart.component';
import { UserLayoutComponent } from './components/user/user-layout.component';
import { LoginComponent } from './components/user/auth/login/login.component';
import { UserInfoComponent } from './components/user/UserInfor/UserInfor.component';



import { AdminLayoutComponent } from './components/admin/admin-layout.component';
import { DashboardComponent } from './components/admin/dasboard/dasboard.component';
import { UsersComponent } from './components/admin/users/users.component';
import { OrdersComponent } from './components/admin/order/order.component';
import { ProductCategoryComponent } from './components/admin/category/product-category.component';
import { ProductAdminComponent } from './components/admin/Products/Products.component';

import { FavoriteComponent } from './components/user/favorite/favorite.component';
import { ContactComponent } from './components/user/contact/contact.component';
import { NewsDetailComponent } from './components/user/newsDetail/news-detail.component';
import { CheckoutComponent } from './components/user/checkout/checkout.component';
import { AdminNewsComponent } from './components/admin/news/admin-news.component';
import { adminGuard } from './components/admin/auth-guard/auth-guard';

export const routes: Routes = [
  // Layout cho người dùng
  {
    path: '',
    component: UserLayoutComponent,
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'product', component: ProductComponent },
      { path: 'product-detail/:id', component: ProductDetailComponent },
      { path: 'news', component: NewsComponent },
      { path: 'news-detail/:id', component: NewsDetailComponent },
      { path: 'favorite', component: FavoriteComponent },
      { path: 'cart', component: CartComponent},
      { path: 'contact', component: ContactComponent },
      { path: 'checkout', component: CheckoutComponent },

      {
        path: 'user-info',
        component: UserInfoComponent,
        canActivate: [authGuard]
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ]
  },
  // app-routing.module.ts
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    canActivateChild: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'users', component: UsersComponent },
      { path: 'orders', component: OrdersComponent },
      { path: 'categories', component: ProductCategoryComponent },
      { path: 'products', component: ProductAdminComponent },
      { path: 'support', component: DashboardComponent },
      { path: 'news', component: AdminNewsComponent },
      { path: '**', redirectTo: 'dashboard' }
    ]
  },

  {
    path: 'login',
    component: LoginComponent,
  }
];
