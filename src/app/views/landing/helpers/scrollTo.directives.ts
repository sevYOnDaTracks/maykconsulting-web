import { Directive, Attribute, HostListener } from '@angular/core';

@Directive({ selector: '[scrollTo]' })
export class ScrollToDirective {
  constructor(@Attribute('scrollTo') public elmID: string) {}

  @HostListener('click', ['$event'])
  smoothScroll(event: Event) {
    event.preventDefault();
    if (!this.elmID) { return; }
    const target = document.getElementById(this.elmID);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
