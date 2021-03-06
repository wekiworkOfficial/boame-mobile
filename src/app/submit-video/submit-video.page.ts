import { Component, OnInit } from '@angular/core';
import { VideoService } from '../services/video.service';
import { NetworkService } from '../services/network.service';
import { RouterService } from '../services/router.service';
import { LoaderComponent } from '../components/loader/loader.component';
import { AlertComponent } from '../components/alert/alert.component';
import { ChatService } from '../services/chat.service';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { Diagnostic } from '@ionic-native/diagnostic/ngx';

@Component({
  selector: 'app-submit-video',
  templateUrl: './submit-video.page.html',
  styleUrls: ['./submit-video.page.scss'],
})
export class SubmitVideoPage implements OnInit {

  videoRecord : boolean = false;
  file : any = null;
  reportText : string = '';

  constructor(private video : VideoService, private network : NetworkService,
    private router : RouterService, private loader : LoaderComponent,
    private alert : AlertComponent, private chatService : ChatService,
    private transfer : FileTransfer, private diagnostic : Diagnostic) {
    
  }

  ngOnInit() {
    
  }

  ionViewDidEnter()
  {
    this.router.getData((data:any)=>{

      // can we continue
      if (data == null) return this.router.route('/send-a-video');

      // get the type
      switch (data.type)
      {
        case 'upload':
          this.videoRecord = false;
        break;

        case 'recorded':
          this.videoRecord = true;
        break;
      }
      
      // load file
      this.file = data.file;

    });
  }

  recordVideo()
  {
    this.video.captureVideo((video:any) => {

      // changed
      this.video.presentToast('Video record changed.');

      // update file
      this.file = video;
      
    });

  }

  pickVideo()
  {
    this.video.getVideo((video:any) => {
      this.file = video;
    });
  }

  submit()
  {
    // please select a video
    if (this.file == null && this.videoRecord == false) return this.alert.show('Please select a video to continue');

    // please record a video
    if (this.file == null && this.videoRecord == true) return this.alert.show('Please record a video to continue');

    // show loader
    this.loader.show(()=>{
      this.network.withAccount({
        report          : this.reportText,
        video           : this.file,
        REQUEST_METHOD  : 'PUT' 
      }, (data:any)=>{

        // process callback function
        const processor = (res:any)=>{

          if (res.data.status == 'error')
          {
            this.loader.hide(()=>{
              this.video.presentToast(res.data.message);
            });
          }
          else
          {
            this.chatService.caseSubmitted('video');
            this.alert.success(res.data.message, ()=>{

              // report case service requested
              this.chatService.serviceRequested('report-case-tag-video');

              // delete video locally
              if (this.videoRecord) this.video.deleteVideo(this.file);

              // route out
              this.router.route('/send-a-video');
              this.file = null;
              this.reportText = '';
              this.loader.hide();
            });
          }

        };

        // create form data
        const formData = new FormData();

        // delete video
        delete data['video'];

        // add others
        for (var key in data) formData.append(key, data[key]);

        // create transfer object
        const fileTransfer: FileTransferObject = this.transfer.create();

        // create file upload option
        let options: FileUploadOptions = {
          fileKey: 'video',
          fileName: this.file.name,
          chunkedMode: false,
          headers: {
            'REQUEST_METHOD' : 'PUT',
            'x-authorization-token' : this.network.apiToken
          }
        };

        fileTransfer.upload(this.file.fullPath, this.network.endpoint + 'cases/caseFile', options)
        .then((data) => {

          // get response
          let response = JSON.parse(data.response);

          // add video
          formData.append('video', response.name);

          // add video poster
          formData.append('poster', response.poster);

          // run post
          this.network.post('cases/report/video', formData, false).then(processor);

        }, () => {
          
          // error
          this.loader.hide(()=>{
            this.video.presentToast('Could not upload your video file at this time.');
          });

        });

      });
    });
  }

}
