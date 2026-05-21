import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Footer } from './footer';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

describe('Footer', () => {
  let component: Footer;
  let fixture: ComponentFixture<Footer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
      providers: [
        provideRouter([]), // Mock
        provideTranslateService() // Mock
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Footer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set currentYear correctly', () => {
    const currentYear = new Date().getFullYear();
    expect(component.currentYear).toBe(currentYear);
  });
});