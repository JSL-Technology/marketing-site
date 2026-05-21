import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '@core/services/toast.service';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ALL_ICONS } from '@core/constants/icons';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslateModule],
  templateUrl: './toast.html',
  styleUrls: ['./toast.scss']
})
export class ToastComponent {
  readonly icons = ALL_ICONS;

  constructor(public toastService: ToastService) {}

  remove(id: number): void {
    this.toastService.remove(id);
  }
}
