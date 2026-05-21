import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectDetail } from './project-detail';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BASE_URL } from '@core/constants/tokens';

describe('ProjectDetail', () => {
  let component: ProjectDetail;
  let fixture: ComponentFixture<ProjectDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectDetail, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BASE_URL, useValue: 'https://www.jsl.technology' }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});