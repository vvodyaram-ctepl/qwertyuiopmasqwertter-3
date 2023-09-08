import { Component, OnInit } from '@angular/core';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-add-sub-clinics',
  templateUrl: './add-sub-clinics.component.html',
  styleUrls: ['./add-sub-clinics.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class AddSubClinicsComponent implements OnInit {
  dropdownList = [];
  selectedItems = [];
  dropdownSettings = {};

  addSubClinicForm: FormGroup;

  queryParams: any = {};  
    
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.addSubClinicForm = this.fb.group({
      'subclinicName': ['', [Validators.required]],
   })
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((obj: any) => {
      this.queryParams = obj;
    });
     this.dropdownList = [
      { item_id: 1, item_text: 'Mumbai' },
      { item_id: 2, item_text: 'Bangaluru' },
      { item_id: 3, item_text: 'Pune' },
      { item_id: 4, item_text: 'Navsari' },
      { item_id: 5, item_text: 'New Delhi' }
    ];
    this.selectedItems = [
      { item_id: 3, item_text: 'Pune' },
      { item_id: 4, item_text: 'Navsari' }
    ];

    this.dropdownSettings = {
      singleSelection: false,
      idField: 'item_id',
      textField: 'item_text',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 3,
      allowSearchFilter: true
    };
  }
  onItemSelect(item: any) {
    console.log(item);
  }
  onSelectAll(items: any) {
    console.log(items);
  }
  onSubmit($event) {

  }
  back() {
    this.router.navigate(['/clinics/add-new-clinic/add-plans'], { queryParams: this.queryParams });
  }
  next() {

  }

}
