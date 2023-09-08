import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-add-new-patient',
  templateUrl: './add-new-patient.component.html',
  styleUrls: ['./add-new-patient.component.scss']
})
export class AddNewPatientComponent implements OnInit {

  @Input() editFlag: boolean = false;
  public flatTabs: any[];
  queryParams: any = {};

  constructor(public route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe((obj: any) => {
      this.queryParams = obj;
    });
    this.flatTabs = [{ tabId: 1, name: 'PetInfo', label: 'Pet Info', link: 'pet-info', property: 'petInfo' },
    { tabId: 3, name: 'Asset', label: 'Asset', link: 'pet-asset', property: 'asset' },
    { tabId: 2, name: 'Study', label: 'Study', link: 'pet-study', property: 'petStudy' },
    { tabId: 3, name: 'Data Streams', label: 'Data Streams', link: 'pet-study-asset', property: 'petStudyAsset' },
    { tabId: 4, name: 'PetParentInfo', label: 'Pet Parent Info', link: 'pet-parent-info', property: 'petParentInfo' },
    { tabId: 5, name: 'Review', label: 'Review', link: 'review', property: 'review' },
    ];
  }

  public activateTab(activeTab) {

    this.flatTabs.forEach(flatTag => {
      if (flatTag.tabId == activeTab.tabId) {
        flatTag.active = true;
        console.log("activeTab.tabId", activeTab.tabId);
        console.log("activeTab.tabId", activeTab.name);
      } else {
        flatTag.active = false;
      }


    });
  }
  navChange($event) {
    console.log("navChange", $event);
  }
}
