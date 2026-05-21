import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ProductDetail } from './product-detail';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { BASE_URL } from '@core/constants/tokens';

describe('ProductDetail', () => {
  let component: ProductDetail;
  let fixture: ComponentFixture<ProductDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProductDetail,
        TranslateModule.forRoot()
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: BASE_URL, useValue: 'https://www.jsl.technology' }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
