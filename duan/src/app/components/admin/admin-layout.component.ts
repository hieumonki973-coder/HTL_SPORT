import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-style.css'],
  imports: [RouterOutlet, RouterModule] // 👈 Thêm RouterModule vào đây
})
export class AdminLayoutComponent { }
