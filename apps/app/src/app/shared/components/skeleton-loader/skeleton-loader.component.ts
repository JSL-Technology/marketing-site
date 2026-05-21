import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton-loader.component.html',
  styleUrls: ['./skeleton-loader.component.scss']
})
export class SkeletonLoaderComponent {
  @Input() width = '100%';
  @Input() height = '20px';
  @Input() shape: 'rectangle' | 'circle' = 'rectangle';
  @Input() count = 1;
}
