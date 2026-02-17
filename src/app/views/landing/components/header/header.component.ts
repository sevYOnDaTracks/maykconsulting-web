import {
  Component,
  OnInit,
  HostListener,
  Inject
} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {WINDOW} from '../../helpers/window.helpers';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(WINDOW) private window: Window,
  ) {}

  isFixed = false;
  public isCollapsed = true;

  ngOnInit() {
    this.syncMenuState();
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.syncMenuState();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const offset =
      this.window.pageYOffset ||
      this.document.documentElement.scrollTop ||
      this.document.body.scrollTop ||
      0;
    if (offset > 10) {
      this.isFixed = true;
    } else {
      this.isFixed = false;
    }
  }

  hidemenu() {
    if (this.window.innerWidth < 992) {
      this.isCollapsed = true;
    }
  }

  private syncMenuState() {
    this.isCollapsed = this.window.innerWidth < 992;
  }

}
