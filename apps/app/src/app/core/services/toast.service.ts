import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();
  private counter = 0;
  private timers = new Map<number, ReturnType<typeof setTimeout>>();

  constructor() {}

  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration = 3000): void {
    const id = this.counter++;
    const toast: Toast = { id, message, type, duration };
    this.toastsSubject.next([...this.toastsSubject.getValue(), toast]);

    if (duration > 0) {
      const timer = setTimeout(() => {
        this.timers.delete(id);
        this.remove(id);
      }, duration);
      this.timers.set(id, timer);
    }
  }

  remove(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.toastsSubject.next(this.toastsSubject.getValue().filter(t => t.id !== id));
  }
}
