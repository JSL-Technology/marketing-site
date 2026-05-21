import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Globe, ChevronDown, Headphones, User } from 'lucide-angular';
import { TopBar } from './top-bar';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('TopBar', () => {
  let component: TopBar;
  let fixture: ComponentFixture<TopBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({}),
            url: of([])
          }
        }
      ],
      imports: [
        TopBar,
        TranslateModule.forRoot(),
        LucideAngularModule.pick({ Globe, ChevronDown, Headphones, User })
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
