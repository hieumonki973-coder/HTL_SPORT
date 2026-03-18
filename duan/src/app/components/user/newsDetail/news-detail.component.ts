import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NewsService } from '../../../services/news.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-news-detail',
  templateUrl: './news-detail.component.html',
  styleUrls: ['./news-detail.component.css'],
  imports: [CommonModule, RouterModule],
})
export class NewsDetailComponent implements OnInit {
  newsDetail: any;
  allNews: any[] = [];
relatedNews: any;

  constructor(
    private route: ActivatedRoute,
    private newsService: NewsService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadNewsDetail(id);
        this.loadOtherNews(id);
      }
    });
  }

  loadNewsDetail(id: string) {
    this.newsService.getNewsById(id).subscribe({
      next: (data) => this.newsDetail = data,
      error: (err) => console.error('Lỗi lấy chi tiết tin:', err)
    });
  }

  loadOtherNews(currentId: string) {
    this.newsService.getAllNews().subscribe({
      next: (data) => {
        this.allNews = data.filter(news => news._id !== currentId);
      },
      error: (err) => console.error('Lỗi lấy tin khác:', err)
    });
  }
}

