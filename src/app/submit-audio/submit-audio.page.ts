import { Component, OnInit } from '@angular/core';
import { AudioService } from '../services/audio.service';
import { RouterService } from '../services/router.service';
import { AlertComponent } from '../components/alert/alert.component';
import { LoaderComponent } from '../components/loader/loader.component';
import { NetworkService } from '../services/network.service';

@Component({
  selector: 'app-submit-audio',
  templateUrl: './submit-audio.page.html',
  styleUrls: ['./submit-audio.page.scss'],
})
export class SubmitAudioPage implements OnInit {

  audioRecord : boolean = false;
  formats : string = '';
  file : any = null;
  reportText : string = '';

  constructor(private audio : AudioService, private router : RouterService,
    private alert : AlertComponent, private loader : LoaderComponent,
    private network : NetworkService)
  {
    this.formats = this.audio.formats;
  }

  ngOnInit() {

    this.router.getData((data:any)=>{

      // can we continue
      if (data == null) return this.router.route('/send-an-audio');

      // get the type
      switch (data.type)
      {
        case 'upload':
          this.audioRecord = false;
        break;

        case 'recorded':
          this.audioRecord = true;
        break;
      }
      
      // load file
      this.file = data.file;

    });

  }

  ionViewDidEnter()
  {
    // process audio
    this.processAudio();
  }

  processAudio()
  {
    this.audio.getAudio('.submituploadedaudio #audio_file2').then((file:any)=>{
      if (file.type == 'video/mp4') return this.alert.show('Invalid Audio file. Please close this modal and try again.');

      // changed
      this.alert.success('Audio file changed, please close this modal to continue.');

      // update file
      this.file = file;

      // listen again
      this.processAudio();
    });
  }

  submit()
  {
    // please select an audio
    if (this.file == null && this.audioRecord == false) return this.alert.show('Please select an audio to continue');

    // please record your voice
    if (this.file == null && this.audioRecord == true) return this.alert.show('Please record your voice to continue');

    // show loader
    this.loader.show(()=>{
      this.network.withAccount({
        report          : this.reportText,
        audio           : this.file,
        REQUEST_METHOD  : 'PUT' 
      }, (data:any)=>{

        this.network.post('cases/report/audio', data).then((res:any)=>{

          if (res.data.status == 'error')
          {
            this.alert.show(res.data.message);
            this.loader.hide();
          }
          else
          {
            this.alert.success(res.data.message, ()=>{
              this.router.route('/send-an-audio');
              this.file = null;
              this.reportText = '';
              this.loader.hide();
            });
          }

        });

      });
    });
  }

}
