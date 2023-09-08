import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { UserDataService } from 'src/app/services/util/user-data.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {

  public reportUrl: string = environment.customerSupportDashboardReportUrl;
  public trustedReportUrl: any = '';
  userId: any;
  loader: boolean = false;

  constructor(
    private userDataService: UserDataService,
    private _sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.userId = this.userDataService.getUserId();

    this.loader = true;
    var params = {
      "userId": this.userId
    };
    var encodedParams = encodeURIComponent(JSON.stringify(params));
    this.trustedReportUrl = this._sanitizer.bypassSecurityTrustResourceUrl(this.reportUrl + `?params=${encodedParams}`);

    setTimeout(() => {
      this.loader = false;
    }, 2000);
  }

}
