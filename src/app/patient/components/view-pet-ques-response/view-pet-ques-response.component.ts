import { Component, ElementRef, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CustomDateFormatPipe } from 'src/app/pipes/custom-date-format.pipe';

@Component({
  selector: 'app-view-pet-ques-response',
  templateUrl: './view-pet-ques-response.component.html',
  styleUrls: ['./view-pet-ques-response.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ViewPetQuesResponseComponent implements OnInit {

  headers: any;
  filterTypeArr: any[];
  url: string;
  petId: any;
  petName: any;
  reportName = "Pet Questionnaire Response";
  selectedMedia: any;
  modalRef: NgbModalRef;

  @ViewChild('quesContent', { static: true }) quesContent: ElementRef;
  @ViewChild('answerContent', { static: true }) answerContent: ElementRef;
  @ViewChild('mediaContent') mediaContent: ElementRef;

  constructor(
    public router: Router,
    public customDatePipe: CustomDateFormatPipe,
    private activatedRoute: ActivatedRoute,
    private sanitization: DomSanitizer,
    private modalService: NgbModal
  ) { }

  async ngOnInit() {
    await this.activatedRoute.params.subscribe(async params => {
      this.petId = params.petId;
      this.url = `/api/questionnaire/getQuestionnaireResponseByPet?petId=${this.petId
        }`;
      this.headers = [
        { key: "studyNames", label: "Study", checked: true, width: 150, cellWidth: 30 },
        { key: "questionnaireName", label: "Questionnaire Name", checked: true, width: 180, cellWidth: 30 },
        { key: "questionName", label: "Question", checked: true, width: 200, customTemplate: this.quesContent, jsonKeys: ['rowData'] },
        { key: "questionType", label: "Question Type", checked: true },
        { key: "questionTypeId", label: "Question Type Id", checked: false },
        { key: "answerOpts", label: "Options", checked: true, width: 200 },
        { key: "answers", label: "Answer", checked: true, customTemplate: this.answerContent, jsonKeys: ['rowData'], hideReportColumn : true },
        { key: "answerImage", label: "Answer", addReportColumn : true },
        { key: "submittedOn", label: "Submitted On", checked: true }
      ];
      this.filterTypeArr =
        [
          {
            name: "Questionnaire",
            id: "petQuestionnaire"
          },
          {
            name: "Attempted Between",
            id: "dateType"
          }
        ];

    });
  }

  getNode($event) {
    let questionnaireId = $event.item.questionnaireId;
    let questionnaireName = $event.item.questionnaireName;
    let studyId = $event.item.studyId;
    let studyName = $event.item.study;
    let action = $event.event.target.title;
    if (action === 'View Response') {
      this.router.navigate([`/user/responses/list-study/${questionnaireId}/${questionnaireName}/${studyId}/${studyName}`]);
    }
    if ($event.header === 'study') {
      this.router.navigate([`/user/responses/list-study/${questionnaireId}/${questionnaireName}/${studyId}/${studyName}`]);
    }
  }

  formatter($event) {
    $event.forEach(ele => {
      if(!this.petName){
        this.petName = ele.petName;
      }
      ele['customTemplateJson']['questionName'] = { 'rowData': ele };
      ele['customTemplateJson']['answers'] = { 'rowData': ele };
      

    });
    this.reportName = 'Pet Questionnaire Response: ' + this.petName
  }

  sanitizeURL(url: string) {
    return this.sanitization.bypassSecurityTrustUrl(url);
  }

  openMedia(url: string, type?: number) {
    this.selectedMedia = {
      type: type || 7,
      url: this.sanitizeURL(url)
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

}
