import { Component, OnInit } from '@angular/core';
import { NewsService } from '../../../services/news.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss'],
  imports: [CommonModule,RouterModule],
})
export class NewsComponent implements OnInit {
  newsList: any[] = [];

  constructor(private newsService: NewsService) {}

  ngOnInit(): void {
    this.newsService.getAllNews().subscribe(data => {
      this.newsList = data;
    });
  }
}
