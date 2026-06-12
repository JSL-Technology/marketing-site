import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Terms } from './terms';

describe('Terms', () => {
  let component: Terms;
  let fixture: ComponentFixture<Terms>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [Terms]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Terms);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
