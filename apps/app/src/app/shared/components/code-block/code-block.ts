import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'jsl-code-block',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './code-block.html',
  styleUrl: './code-block.scss'
})
export class CodeBlockComponent {
  @Input() code = '';
  @Input() language = 'typescript';
  copied = false;

  copyCode() {
    navigator.clipboard.writeText(this.code);
    this.copied = true;
    setTimeout(() => this.copied = false, 2000);
  }
}
