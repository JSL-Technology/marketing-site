import { Component, Input, ViewChild, ElementRef, HostListener, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { DirectionService } from '@core/services/direction.service';

@Component({
  selector: 'jsl-image-comparison',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './image-comparison.html',
  styleUrls: ['./image-comparison.scss']
})
export class ImageComparisonComponent implements AfterViewInit {
  private directionService = inject(DirectionService);
  @Input() beforeImage = '';
  @Input() afterImage = '';
  @Input() beforeLabel = 'Before';
  @Input() afterLabel = 'After';
  @Input() alt = 'Image comparison';

  @ViewChild('container') containerRef!: ElementRef<HTMLElement>;

  public sliderPosition = 50;
  private isDragging = false;

  ngAfterViewInit() {
    // Initial setup if needed
  }

  onMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.handleMove(event.clientX);
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    this.isDragging = false;
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      this.handleMove(event.clientX);
    }
  }

  onTouchStart(event: TouchEvent) {
    this.isDragging = true;
    this.handleMove(event.touches[0].clientX);
  }

  @HostListener('window:touchend')
  onTouchEnd() {
    this.isDragging = false;
  }

  @HostListener('window:touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    if (this.isDragging) {
      this.handleMove(event.touches[0].clientX);
    }
  }

  private handleMove(clientX: number) {
    if (!this.containerRef) return;

    const rect = this.containerRef.nativeElement.getBoundingClientRect();
    const x = clientX - rect.left;
    let position = (x / rect.width) * 100;

    if (this.directionService.isRtl()) {
      position = 100 - position;
    }

    // Clamp between 0 and 100
    position = Math.max(0, Math.min(100, position));

    this.sliderPosition = position;
  }

  onKeyDown(event: KeyboardEvent) {
    const isRtl = this.directionService.isRtl();
    const step = 5;

    if (event.key === 'ArrowLeft') {
      this.sliderPosition = isRtl
        ? Math.min(100, this.sliderPosition + step)
        : Math.max(0, this.sliderPosition - step);
    } else if (event.key === 'ArrowRight') {
      this.sliderPosition = isRtl
        ? Math.max(0, this.sliderPosition - step)
        : Math.min(100, this.sliderPosition + step);
    }
  }
}
