import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-gallery.component.html',
  styleUrls: ['./product-gallery.component.css']
})
export class ProductGalleryComponent implements OnChanges {

  @Input() images: any[] = [];
  @Input() selectedVariantId?: string;

  @Output() imageChange = new EventEmitter<string>();

  selectedImage = '';

  ngOnChanges(): void {
    if (this.images?.length) {
      const img = this.selectedVariantId
        ? this.images.find(i => i.id_bienthe === this.selectedVariantId)
        : this.images[0];

      if (img) {
        this.selectedImage = img.url;
        this.imageChange.emit(img.url);
      }
    }
  }

  changeImage(url: string) {
    this.selectedImage = url;
    this.imageChange.emit(url);
  }
}
