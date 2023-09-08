import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'app-add-duplicate-pets',
  templateUrl: './add-duplicate-pets.component.html',
  styleUrls: ['./add-duplicate-pets.component.scss']
})
export class AddDuplicatePetsComponent implements OnInit {

 
  @Input() editFlag: boolean = false;
  public flatTabs: any[];
  editId: string;
  viewFlag: boolean = false;
  addFlag: boolean;

  queryParams: any = {};

  constructor(public route: ActivatedRoute,
    private router: Router) { }

  ngOnInit(): void {
    // if(this.router.url.indexOf('/add-pet-parent') > -1) {
    //   let str = this.router.url;
    //   let id = str.split("add-pet-parent/")[1].split("/")[0];
    //   this.editFlag = false;
    //   this.editId = id;
    //   }
    //   else {
    //     this.editFlag = true;
    //   }

    this.route.queryParams.subscribe((obj: any) => {
      this.queryParams = obj;
    })
    this.route.params.subscribe(async params => {
      console.log("paramas", params);
      this.editId = params.id;
      const path = this.route.snapshot.url[0].path;
      console.log("path", path)
      if (path === 'add-pet-parent') {
        this.addFlag = true;
      }
      if (path === 'view-pet-parent') {
        this.viewFlag = true;
      }
      if (path === 'edit-pet-parent') {
        this.editFlag = true;
      }
    })
    if (this.editFlag) {
      this.flatTabs = [
        { tabId: 1, name: 'SelectPrimary', label: 'Select Primary', link: 'select-primary-pets', property: 'SelectPrimary' },
        { tabId: 2, name: 'SelectDuplicates', label: 'Select Duplicate', link: 'select-duplicate', property: 'SelectDuplicates' },
        { tabId: 3, name: 'DataStreams', label: 'Data Streams', link: 'data-stream', property: 'DataStreams' }
      ];
    }
    else {
      this.flatTabs = [
        { tabId: 1, name: 'SelectPrimary', label: 'Select Primary', link: 'select-primary-pets', property: 'SelectPrimary' },
        { tabId: 2, name: 'SelectDuplicates', label: 'Select Duplicate', link: 'select-duplicate', property: 'SelectDuplicates' },
        { tabId: 3, name: 'DataStreams', label: 'Data Streams', link: 'data-stream', property: 'DataStreams' }
      ];
    }
    console.log("this.flatTabs", this.flatTabs);
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
