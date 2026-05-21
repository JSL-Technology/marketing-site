import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'jsl-terms',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './terms.html',
  styleUrl: '../legal-page.scss' // Usamos el SCSS compartido
})
export class Terms {}