import {
  Component,
  OnInit,
  HostListener,
  HostBinding,
  Inject,
  Input
} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {WINDOW_PROVIDERS, WINDOW} from '../../helpers/window.helpers';
import {MatSnackBar} from '@angular/material/snack-bar';

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

  isFixed;
  public isCollapsed = true;

  @HostBinding('class.menu-opened') menuOpened = false;

  ngOnInit() {}
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

  toggleMenu() {
    this.menuOpened = !this.menuOpened;
  }
  hidemenu() {
    this.isCollapsed = true;
  }


}
