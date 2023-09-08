import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { QuestionnaireService } from 'src/app/questionnaire/questionnaire.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-questions-view',
  templateUrl: './questions-view.component.html',
  styleUrls: ['./questions-view.component.scss', '../../../styles/custom-slider.scss']
})
export class QuestionsViewComponent implements OnInit {

  questionnaireId: any;
  public data: any;
  queryParams: any = {};

  constructor(
    private activatedRoute: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private questionnaireService: QuestionnaireService,
    private toastr: ToastrService,
    private router: Router
  ) { }

  ngOnInit(): void {

    this.activatedRoute.queryParams.subscribe((obj: any) => {
      this.queryParams = obj;
    });

    this.activatedRoute.params.subscribe(params => {
      let str = this.router.url;
      this.questionnaireId = str.split("view/")[1].split("/")[0];
      this.spinner.show();
      this.questionnaireService.getQuestionnaireById(`/api/questionnaire/${this.questionnaireId}`).subscribe(res => {
        if (res.status.success === true) {
          this.data = res.response.questionnaire;

          //To show slider scale based on options and get next questions
          this.data.questions.forEach((question: any, i: number) => {
            // To show slider scale based on options
            this.data.questions[i].other.showTicks = !this.data.questions[i].other.isContinuousScale;
            this.data.questions[i].other.vertical = this.data.questions[i].other.isVerticalScale;
            this.data.questions[i].other.disabled = true;
            this.data.questions[i].other.getLegend = (value: number): string => {
              return value != this.data.questions[i].other.ceil ? '' + value : '';
            }
          });

          //order questions based on sections
          let sectionWiseQuestions = [];
          this.data.sections.forEach((section: any) => {
            let thisSectionQuestions = this.data.questions.filter((question: any) => question.section.sectionName == section.sectionName);
            sectionWiseQuestions = sectionWiseQuestions.concat({ [section.sectionName]: thisSectionQuestions });
          });
          this.data.sectionWiseQuestions = sectionWiseQuestions;

          this.spinner.hide();
        }
        else {
          this.toastr.error(res.errors[0].message);
          this.spinner.hide();
        }
      },
        err => {
          this.errorMsg(err);
        }
      );
    });
  }

  errorMsg(err) {
    if (err.status == 500) {
      this.toastr.error(err.error.message + ". " + "Please try after sometime or contact administrator.");
      this.spinner.hide();
    }
    else {
      this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
      this.spinner.hide();
    }
  }

  getQuestion(quesId: number) {
    let question = this.data.questions.filter((question: any) => question.questionId == quesId);
    if (question.length)
      return "Q" + question[0].questionOrder + "- " + question[0].question;
  }

  back() {
    this.router.navigate([`/user/questionnaire/view/${this.questionnaireId}/instructions`], { queryParams: this.queryParams });
  }
  cancel() {
    this.router.navigate(['/user/questionnaire'], { queryParams: this.queryParams });
  }
}
