import { Component } from '@angular/core';

/**
 * Componente fantasma (vacío) que se utiliza únicamente para
 * satisfacer el validador estático del Router de Angular.
 * Las rutas que usan este componente tienen un guard 'canActivate'
 * que redirige la navegación, por lo que este componente
 * nunca se renderiza.
 */
@Component({
  selector: 'jsl-route-redirector',
  standalone: true,
  template: '', // No renderiza absolutamente nada
})
export class RouteRedirectorComponent {}