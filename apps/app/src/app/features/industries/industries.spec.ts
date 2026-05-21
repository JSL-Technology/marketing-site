import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Industries } from './industries';

describe('Industries', () => {
  let component: Industries;
  let fixture: ComponentFixture<Industries>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [Industries]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Industries);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
