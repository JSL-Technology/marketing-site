import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'jsl-privacy',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './privacy.html',
  styleUrl: '../legal-page.scss'
})
export class Privacy {}
