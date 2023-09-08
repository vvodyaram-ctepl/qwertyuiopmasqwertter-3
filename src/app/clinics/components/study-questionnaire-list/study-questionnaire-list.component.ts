import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ClinicService } from '../clinic.service';
import { ToastrService } from 'ngx-toastr';
import { CustomDateFormatPipe } from 'src/app/pipes/custom-date-format.pipe';

@Component({
  selector: 'app-study-questionnaire-list',
  templateUrl: './study-questionnaire-list.component.html',
  styleUrls: ['./study-questionnaire-list.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StudyQuestionnaireListComponent implements OnInit {

  RWFlag: boolean = false;
  showDataTable: boolean = false;
  headers: any;
  editFlag: boolean;
  editId: string;
  dataArr: any;
  isexternal: any;
  preludeUrl: string;

  queryParams: any = {};
  selectedStudy: any = {};

  constructor(
    public router: Router,
    public route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private clinicService: ClinicService,
    private toastr: ToastrService,
    public customDatePipe: CustomDateFormatPipe
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe((obj: any) => {
      this.queryParams = obj;
    });
    let str = this.router.url;
    let id = str.split("study-questionnaire/")[1].split("/")[0];
    console.log(id);

    this.headers = [
      { label: "Questionnaire Name", checked: true },
      { label: "Occurrence", checked: true },
      { label: "Frequency", checked: true },
      { label: "Start Date", checked: true },
      { label: "End Date", checked: true },
      { label: "Status", checked: true }
    ];
    if (this.router.url.indexOf('/study-questionnaire') > -1) {
      console.log("this.router.url", this.router.url);
      let str = this.router.url;
      let id = str.split("study-questionnaire/")[1].split("/")[0];
      this.editFlag = true;
      this.editId = id;
      this.spinner.show();
      this.clinicService.getStudy(`/api/study/${id}`, '').subscribe(res => {
        console.log("res", res);
        if (res.status.success == true) {
          this.selectedStudy = res.response.rows;
          this.dataArr = this.selectedStudy.questionnairesAssociated;
           
          this.dataArr.forEach(ele => {
            ele.startDate = this.customDatePipe.transform(ele.startDate, 'MM/dd/yyyy');
            ele.endDate = this.customDatePipe.transform(ele.endDate, 'MM/dd/yyyy');
          })
          this.spinner.hide();
        }
      },
        err => {
          this.spinner.hide();
          this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
        }
      );
    }
  }
  openQuestions(list){
   // if(list.isActive){
      this.router.navigate(['/user/clinics/view-study-questionnaire/' +this.selectedStudy.studyId + '/' + list.studyQuestionnaireId]);
   // }
  }

 
  

}
