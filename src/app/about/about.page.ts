import { Component, OnInit, ViewChild } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { RouterService } from '../services/router.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
})  
export class AboutPage implements OnInit {

  @ViewChild(IonContent) content: IonContent;

  // load constructor
  constructor(private router : RouterService) {

  }

  reportCase()
  {
    this.router.showReportSheet();
  }

  ngOnInit() {
  }

  scrollToTop() {
    this.content.scrollToPoint(0, -10, 400);
  }

  ionViewDidEnter(){
    this.scrollToTop();
  }
}
