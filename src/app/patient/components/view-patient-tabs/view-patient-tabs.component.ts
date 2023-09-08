import { Component, OnInit, Input, ViewEncapsulation, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbCarousel } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-view-patient-tabs',
  templateUrl: './view-patient-tabs.component.html',
  styleUrls: ['./view-patient-tabs.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ViewPatientTabsComponent implements OnInit {
  @Input() activeTab: any;
  @Input() petId: any;
  @Input() studyId: any;
  @ViewChild('carousel') carousel: NgbCarousel;
  public flatTabs: any = [];
  data: any[];

  queryParams: any = {};

  constructor
    (
      public activatedRoute: ActivatedRoute,
      public router: Router
    ) { }

  ngOnInit(): void {

    this.activatedRoute.queryParams.subscribe((obj: any) => {
      this.queryParams = obj;
    });

    if (this.router.url.indexOf('/user/patients/view') > -1) {
      let str = this.router.url;
      let idArr = str.split("/user/patients/view/")[1].split("/");
      // this.petId = 
      this.studyId = idArr[1];

    }

    this.flatTabs = [
      { tabId: 1, name: 'Weight History', link: 'patient-charts', property: 'patientCharts' },
      { tabId: 2, name: 'Pet Parent Info', link: 'patient-client-info', property: 'patientClientInfo' },
      { tabId: 3, name: 'Data Streams', link: 'patient-study-asset', property: 'patientDeviceDetails' },
      { tabId: 4, name: 'Notes', link: 'patient-notes', property: 'patientNotes' },
      { tabId: 5, name: 'Campaign Points', link: 'campaign-points', property: 'campaignPoints' },
      { tabId: 6, name: 'Observations', link: 'patient-observations', property: 'patientObservations' },
      { tabId: 7, name: 'questionnaires', link: 'questionnaire', property: 'questionnaire' },
      { tabId: 8, name: 'eating enthusiasm', link: 'pet-eating', property: 'pet-eating' },
      { tabId: 9, name: 'Image Scoring', link: 'pet-img-scoring', property: 'pet-img-scoring' },
      { tabId: 10, name: 'Activity Factor Results', link: 'patient-activity-factor', property: 'patientActivityFactor' },
      { tabId: 11, name: 'Duplicate Pets', link: 'pet-view-duplicate-pet', property: 'petViewDuplicatePet' },
      { tabId: 12, name: 'Pet Data Extract', link: 'pet-view-data-extract', property: 'petViewDataExtract' }
    ];

    this.studyArray(4, this.flatTabs);

    // this.activeTab = { tabId: 1, name: 'Weight History', link: 'patient-charts', property: 'patientCharts' };
    // this.activateTab(this.activeTab);
  }
  ngAfterViewInit() {
    if (this.activeTab > 4 && this.activeTab < 8)
      this.carousel.activeId = '1';
    else if (this.activeTab > 8)
      this.carousel.activeId = '2';
    else
      this.carousel.activeId = '0';

  }

  studyArray(numberOfChunks, inputList) {
    this.data = [];
    var result = inputList.reduce((resultArray, item, index) => {
      const chunkIndex = Math.floor(index / numberOfChunks)

      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = [] // start a new chunk
      }

      resultArray[chunkIndex].push(item);
      this.data = resultArray;
      return resultArray
    }, [])

  }

  public activateTab(activeTab) {
    console.log("activeTabb", activeTab)
    this.flatTabs.forEach(flatTag => {
      if (flatTag.tabId == activeTab.tabId) {
        flatTag.active = true;
      } else {
        flatTag.active = false;
      }
    });
  }

  onSlide($event, carousel) {
    console.log("$event, carousel", $event, carousel);
    if ($event.current == "2") {
      this.router.navigate([`/user/patients/view/${this.petId}/${this.studyId}/pet-img-scoring`], { queryParams: this.queryParams });
    }
    if ($event.current == "1") {
      this.router.navigate([`/user/patients/view/${this.petId}/${this.studyId}/campaign-points`], { queryParams: this.queryParams });
    }
    if ($event.current == "0") {
      this.router.navigate([`/user/patients/view/${this.petId}/${this.studyId}/patient-charts`], { queryParams: this.queryParams });
    }
  }
}
