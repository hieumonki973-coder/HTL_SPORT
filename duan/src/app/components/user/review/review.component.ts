import { Review } from './../../../models/review';
import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../../services/review.service';
@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.scss']
})
export class ReviewComponent implements OnChanges {

  @Input() productId!: string;

  reviews: any[] = [];
  avgRating = 0;
  totalReview = 0;

  rating = 0;
  comment = '';
  showForm = false;
  constructor(private reviewService: ReviewService) { }

  ngOnChanges(): void {
    console.log('Review Input productId = ', this.productId);

    if (this.productId) {
      this.loadReviews();
    }
  }

  loadReviews(): void {
    console.log('CALL API GET REVIEW WITH ID:', this.productId);
console.log('AVG:', this.avgRating);
console.log('TOTAL REVIEW:', this.totalReview);

    this.reviewService.getByProduct(this.productId).subscribe({
      next: res => {
        console.log('REVIEW API RESPONSE:', res);

        this.reviews = res.reviews;
        this.avgRating = res.avgRating;
        this.totalReview = res.total;
      },
      error: err => {
        console.error('REVIEW API ERROR:', err);
      }
    });
  }

  submitReview(): void {
    if (!this.rating) {
      alert('Vui lòng chọn số sao');
      return;
    }

    this.reviewService
      .add(this.productId, {
        rating: this.rating,
        comment: this.comment
      })
      .subscribe({
        next: () => {
          this.showForm = false;
          this.rating = 0;
          this.comment = '';
          this.loadReviews();
        },
        error: () => alert('Bạn cần đăng nhập để đánh giá')
      });
        console.log('TOKEN:', localStorage.getItem('token'));
  console.log('RATING:', this.rating);
  }
}
