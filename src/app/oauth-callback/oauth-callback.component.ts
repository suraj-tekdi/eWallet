import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { GeneralService } from '../services/general/general.service';
import { TelemetryService } from '../services/telemetry/telemetry.service';
import { ToastMessageService } from '../services/toast-message/toast-message.service';
import { environment } from 'src/environments/environment';
import { IImpressionEventInput, IInteractEventInput } from '../services/telemetry/telemetry-interface';


@Component({
  selector: 'app-oauth-callback',
  templateUrl: './oauth-callback.component.html',
  styleUrls: ['./oauth-callback.component.scss']
})
export class OauthCallbackComponent implements OnInit {
  baseUrl: string;
  isError = false;
  errorCode: string;
  constructor(
    private activatedRoute: ActivatedRoute,
    private generalService: GeneralService,
    private toastMessage: ToastMessageService,
    private router: Router,
    private telemetryService: TelemetryService,
    private authService: AuthService
  ) {
    this.baseUrl = environment.baseUrl;

    console.log("in oauth11");
    this.activatedRoute.queryParams.subscribe((params: any) => {
      console.log("params-------->", params);
      if (params.code) {
        this.getUserData(params.code);
      }
      if (params.error) {
        this.isError = true;
        this.errorCode = params.error;
      }
    });
  }

  ngOnInit(): void {
    console.log("in oauth callback");
    const redirectUrl = this.activatedRoute.snapshot.queryParamMap.get('code');
    console.log("redirectUrl", redirectUrl);
  }

  getUserData(code: string) {
    const request = {
      digiacc: "ewallet",
      auth_code: code
    }
    this.generalService.postData(`${this.baseUrl}/v1/sso/digilocker/token`, request).subscribe((res: any) => {
      console.log("Result", res);

      if (res.success) {
        if (res?.needaadhaar === 'YES') {
          const navigationExtras: NavigationExtras = {
            state: res
          }
          this.router.navigate(['/ekyc'], navigationExtras);
        } else {
          if (res.user === 'FOUND') {
            if (res.token) {
              localStorage.setItem('accessToken', res.token);
            }

            if (res?.userData?.length) {
              localStorage.setItem('currentUser', JSON.stringify(res.userData[0]));
            }
            // telemery impression event
            this.telemetryService.updateActor();
            this.raiseInteractEvent('login-success')
            this.router.navigate(['/home']);
          } else {
            const navigationExtras: NavigationExtras = {
              state: res
            }
            this.router.navigate(['/ekyc'], navigationExtras);
          }

          // if (res.user === 'NO_FOUND' && res.result) {
          //   const navigationExtras: NavigationExtras = {
          //     state: res.result
          //   };
          //   this.router.navigate(['/register'], navigationExtras)
          // }
        }

        if (res?.digi?.access_token) {
          this.authService.digilockerAccessToken = res.digi.access_token;
        }
      } else {
        this.handleLoginError();
      }
    }, (error) => {
      console.error(error);
      this.handleLoginError();
    });
  }

  handleLoginError() {
    this.toastMessage.error('', this.generalService.translateString('ERROR_WHILE_LOGIN'));
    setTimeout(() => {
      this.router.navigate(['']);
    }, 100);
  }

  ngAfterViewInit(): void {
    this.raiseImpressionEvent();
  }


  raiseImpressionEvent() {
    const telemetryImpression: IImpressionEventInput = {
      context: {
        env: this.activatedRoute.snapshot?.data?.telemetry?.env,
        cdata: []
      },
      edata: {
        type: this.activatedRoute.snapshot?.data?.telemetry?.type,
        pageid: this.activatedRoute.snapshot?.data?.telemetry?.pageid,
        uri: this.router.url,
        subtype: this.activatedRoute.snapshot?.data?.telemetry?.subtype,
        // duration: this.navigationhelperService.getPageLoadTime() // Duration to load the page
      }
    };
    this.telemetryService.impression(telemetryImpression);
  }

  raiseInteractEvent(id: string, type: string = 'CLICK', subtype?: string) {
    const telemetryInteract: IInteractEventInput = {
      context: {
        env: this.activatedRoute.snapshot?.data?.telemetry?.env,
        cdata: []
      },
      edata: {
        id,
        type,
        subtype,
        pageid: this.activatedRoute.snapshot?.data?.telemetry?.pageid,
      }
    };
    this.telemetryService.interact(telemetryInteract);
  }
}
