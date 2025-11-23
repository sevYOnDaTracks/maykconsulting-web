import { Component, OnInit } from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-features-two',
  templateUrl: './features-two.component.html',
  styleUrls: ['./features-two.component.scss']
})
export class FeaturesTwoComponent implements OnInit {

  constructor(private matSnackbar: MatSnackBar) { }

  ngOnInit() {
  }

  openPopUpAdmissionInfo() {
this.matSnackbar.open('Pas encore disponible' , 'ok');
  }
}
