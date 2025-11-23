import { SharedAnimations } from 'src/app/shared/animations/shared-animations';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-intro-ten',
  templateUrl: './intro-ten.component.html',
  styleUrls: ['./intro-ten.component.scss'],
  animations:[SharedAnimations]
})
export class IntroTenComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
