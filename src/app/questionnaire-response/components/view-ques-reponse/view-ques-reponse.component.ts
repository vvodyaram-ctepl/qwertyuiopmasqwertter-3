import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { CustomDateFormatPipe } from 'src/app/pipes/custom-date-format.pipe';
import { QuesResponseService } from '../../ques-response.service';
import { DomSanitizer } from '@angular/platform-browser';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-view-ques-reponse',
  templateUrl: './view-ques-reponse.component.html',
  styleUrls: ['./view-ques-reponse.component.scss']
})
export class ViewQuesReponseComponent implements OnInit {

  public questionnaireName: any;
  public petParentName: String;
  public petName: String;
  public study: String;
  public submittedOn: String;
  public questionnaireResponseList: any;
  questionnaireResponseId: any;
  questionnaireId: any;
  studyId: any;
  selectedMedia: any;
  modalRef: NgbModalRef;

  @ViewChild('mediaContent') mediaContent: ElementRef;
  sectionList: any;
  isSectionWise: boolean;

  constructor(public router: Router,
    private spinner: NgxSpinnerService,
    private quesResponseService: QuesResponseService,
    public customDatePipe: CustomDateFormatPipe,
    private activatedRoute: ActivatedRoute,
    private sanitization: DomSanitizer,
    private modalService: NgbModal
  ) { }

  async ngOnInit() {
    this.getViewData();
  }

  async getViewData() {

    await this.activatedRoute.params.subscribe(async params => {
      this.spinner.show();
      this.questionnaireResponseId = params.questionnaireResponseId;
      this.studyId = params.studyId;
      this.quesResponseService.getQuestionnaireView(`/api/questionnaire/getViewQuestionnaireResponse/${this.questionnaireResponseId}/${this.studyId}`).subscribe(res => {
        if (res.status.success === true) {
          let questionnaireDetails = res.response.questionnaireDetails;
          
          this.questionnaireId = questionnaireDetails.questionnaireId;
          this.questionnaireName = questionnaireDetails.questionnaireName;
          this.petParentName = questionnaireDetails.petParentName;
          this.petName = questionnaireDetails.petName;
          this.study = questionnaireDetails.studyName || 'NA';
          this.submittedOn = this.customDatePipe.transform(questionnaireDetails.submittedDate, 'MM/dd/yyyy');
          this.sectionList = res.response.sectionList;
          
          this.isSectionWise = false;
          
         

          if(res.response.sectionList.length){
            this.isSectionWise = true;
            let sectionWiseQuestions = [];
            res.response.sectionList.forEach((section: any) => {
              let thisSectionQuestions = res.response.questionnaireResponseList.filter((question: any, index) => {
                       question.sno = (index + 1);
                return question.section.sectionName == section.sectionName;
              });
              sectionWiseQuestions = sectionWiseQuestions.concat({ [section.sectionName]: thisSectionQuestions });
            });
            this.questionnaireResponseList = sectionWiseQuestions;
            console.log(sectionWiseQuestions)
          }else{
            this.isSectionWise = false;
            this.questionnaireResponseList = res.response.questionnaireResponseList;
          }
          
          this.spinner.hide();
        }
      });

    });
    // this.quesResponseService.getQuestionnaireVire();
  }

  back() {
    this.router.navigate([`/user/responses/list-study/${this.questionnaireId}/${encodeURIComponent(this.questionnaireName)}/${this.studyId}/${this.study}`]);
  }

  openMedia(url: string, type?: number) {
    this.selectedMedia = {
      type: type || 7,
      url: url
    };
    this.openPopup(this.mediaContent, 'xs');
  }

  openPopup(div, size) {
    this.modalRef = this.modalService.open(div, {
      size: size,
      windowClass: 'smallModal',
      backdrop: 'static',
      keyboard: false
    });
  }

  close() {
    this.router.navigate([`/user/responses`]);
  }

  getSectionName(name){
    if(name){
      return Object.keys(name).length ? Object.keys(name)[0] : '';
    }
  }

}
