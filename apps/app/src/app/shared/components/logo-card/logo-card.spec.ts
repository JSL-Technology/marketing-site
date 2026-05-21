import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogoCard } from './logo-card';

describe('LogoCard', () => {
  let component: LogoCard;
  let fixture: ComponentFixture<LogoCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogoCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogoCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
