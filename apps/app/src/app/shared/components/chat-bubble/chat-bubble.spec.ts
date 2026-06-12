import { LucideAngularModule } from 'lucide-angular';
import { ALL_ICONS } from '../../../core/constants/icons';
import { importProvidersFrom } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatBubbleComponent } from './chat-bubble';

describe('ChatBubbleComponent', () => {
  let component: ChatBubbleComponent;
  let fixture: ComponentFixture<ChatBubbleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        importProvidersFrom(LucideAngularModule.pick(ALL_ICONS)),
        provideTranslateService(),provideZonelessChangeDetection()],
      imports: [ChatBubbleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatBubbleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
