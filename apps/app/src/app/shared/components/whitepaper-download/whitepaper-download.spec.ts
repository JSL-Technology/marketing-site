import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WhitepaperDownloadComponent } from './whitepaper-download';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { ToastService } from '@core/services/toast.service';
import { provideZonelessChangeDetection } from '@angular/core';
import { ALL_ICONS } from '@core/constants/icons';

class MockToastService {
  show(message: string, type: string) {}
}

describe('WhitepaperDownloadComponent', () => {
  let component: WhitepaperDownloadComponent;
  let fixture: ComponentFixture<WhitepaperDownloadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        WhitepaperDownloadComponent,
        TranslateModule.forRoot(),
        LucideAngularModule.pick(ALL_ICONS)
      ],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ToastService, useClass: MockToastService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WhitepaperDownloadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
