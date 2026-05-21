import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServerError } from './server-error';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { LucideAngularModule, Server, Home } from 'lucide-angular';

describe('ServerError', () => {
  let component: ServerError;
  let fixture: ComponentFixture<ServerError>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ServerError,
        TranslateModule.forRoot(),
        RouterModule.forRoot([]),
        LucideAngularModule.pick({ Server, Home })
      ],
      providers: [
        provideZonelessChangeDetection()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServerError);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
