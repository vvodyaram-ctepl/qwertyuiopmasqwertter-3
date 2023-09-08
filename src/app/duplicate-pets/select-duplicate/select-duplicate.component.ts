import { Component, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AssetService } from 'src/app/services/util/asset.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { PetService } from 'src/app/patient/pet.service';
import { TabsService } from 'projects/Tabs/src/lib/components/tabs.service';
import { TabserviceService } from 'src/app/shared/tabservice.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomDateFormatPipe } from 'src/app/pipes/custom-date-format.pipe';

@Component({
  selector: 'app-select-duplicate',
  templateUrl: './select-duplicate.component.html',
  styleUrls: ['./select-duplicate.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SelectDuplicateComponent implements OnInit {

  @ViewChild('primaryTemplate', { static: true }) primaryTemplate: ElementRef;
  
  headers: any;
  queryParams = {};
  public showDataTable: boolean = true;
  firmForm: FormGroup;
  modalRef2: NgbModalRef;
  selectable: object = {
    title: '',
    selectAll: false,
    type : 'radio'
  };
  breedArray =[];
  genderArray = [];
  petNamesList = [];
  

  @ViewChild('archiveContent') archiveContent: ElementRef;
  filterTypeArr: any[];
  firmwareList: any;
  devArr: any[];
  RWFlag: boolean;
  assetArr: any[];
  assetCheckValid: boolean = false;
  assetModelArr: any;
  assetModelCheckValid: any;
  selectedPrimaryPet = {};
  submitFlag: any;
  chkboxValue:any;
  selectedPrimaryPetId: any = '';
  selectedDuplicatePetIds: any = [];
  selectedDuplicate: any;
  constructor(
    private fb: FormBuilder,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private assetservice: AssetService,
    private toastr: ToastrService,
    private petService: PetService,
    public customDatePipe: CustomDateFormatPipe,
    private tabservice: TabserviceService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
     
  }

  ngOnInit() {
    
    this.petService.getPet('/api/lookup/getPetBreeds', '').subscribe(res => {
      this.breedArray = res.response.breeds;
      this.genderArray = [{id :"Male", value : "Male"},{id:"Female", value :"Female"}]
      this.spinner.hide();
    },
      err => {
        this.spinner.hide();
        this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
      }
    );

    this.petService.getPet('/api/lookup/getPetName', '').subscribe(res => {
      this.petNamesList = res.response ?  res.response.petNameList : null;
    },
      err => {
        this.spinner.hide();
        this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
      }
    );
     
    this.headers = [
      { key: "duplicatePet", label: "Duplicate", checked: true, customTemplate: this.primaryTemplate, jsonKeys: ['rowData'], width: 75 },
      { key: "petPhotoUrl", label: "", checked: true, width: 50},
      { key: "petName", label: "Pet Name", checked: true },
      { key: "petParentName", label: "Pet Parent Name", checked: true },
      { key: "petParentEmail", label: "Email", checked: true },
      { key: "gender", label: "Gender", checked: true },
      { key: "dateOfBirth", label: "Date of Birth", checked: true },
      { key: "studyName", label: "Study", checked: true },
      { key: "breedName", label: "Breed", checked: true }
    ];
    this.filterTypeArr =
      [
        {
          name: "Asset Type",
          id: "deviceType"
        },
        {
          name: "Asset Location",
          id: "location"
        },
        {
          name: "Asset Model",
          id: "Model"
        }
      ];
    
      let res = this.tabservice.getModelData() ? this.tabservice.getModelData() : {}
      console.log(res);
      if(res && res.primaryPetInfo){
        this.selectedPrimaryPetId = res.primaryPetInfo.petId;
        this.selectedDuplicatePetIds = res.duplicatePeIds ? res.duplicatePeIds : [];
        this.reloadDatatable();
      }else{
        this.router.navigate(['/user/duplicate-pets/add-duplicate-pets/select-primary-pets']);
        return;
      }
  }

  public reloadDatatable() {
    this.showDataTable = false;
    setTimeout(() => {
      this.showDataTable = true;
    }, 1);
  }
  formatter($event){
    $event.forEach(element => {
      if (element.petPhoto) {
        element.petPhotoUrl = `<span class="petImage p-img"><img class="dog-circle" src= ` +
          element.petPhotoUrl + ` height="38" width="38"></span>`
      } else {
        element.petPhotoUrl = '<span class="petImage p-img"><img class="dog-circle" src="assets/images/no-dogs.svg" height="38" width="38"></span>';
      }
       
      element.dateOfBirth = this.customDatePipe.transform(element.dateOfBirth, 'MM/dd/yyyy');
      element['customTemplateJson']['duplicatePet'] = { 'rowData': element };
     
     // console.log(element)
     if(this.selectedDuplicatePetIds && this.selectedDuplicatePetIds.length){
        console.log(this.selectedDuplicatePetIds.includes(element.petId));
        if(this.selectedDuplicatePetIds.includes(element.petId)){
          element.isChecked = true;
        }
     }

      //element.petParentName = '<a style="color:#37b57c">'+element.petParentName+'</a>';
    });
  }

   
  next(){
    if(this.selectedDuplicatePetIds.length == 0){
      this.toastr.error('Please select at least one duplicate pet');
      return;
    }
    this.tabservice.setModelData(this.selectedDuplicatePetIds, 'duplicatePeIds');
      this.router.navigate(['/user/duplicate-pets/add-duplicate-pets/data-stream'], { queryParams: this.queryParams });
  }
  back(){
      this.router.navigate(['/user/duplicate-pets/add-duplicate-pets/select-primary-pets'], { queryParams: this.queryParams });
  }
  canDeactivate(component, route, state, next) {
    let data = this.tabservice.getModelData();
    if (next.url.indexOf('/auth/login') > -1) {
      return true;
    }
    if(Object.keys(this.selectedDuplicatePetIds).length > 0){
      this.tabservice.setModelData(this.selectedDuplicatePetIds, 'duplicatePeIds');
      return true;
    }
    if(next.url.includes('/user/duplicate-pets/add-duplicate-pets/data-stream')){
      if(this.selectedDuplicatePetIds.length == 0){
        this.toastr.error('Please select at least one duplicate pet');
        return false;
      }
      return true;
    }else{
      return true;
    }
  }
   
  getChkboxValue(e:any, data){
    console.log('e',e.target.checked);
    if(e.target.checked){
      this.selectedDuplicatePetIds.push(data.petId); 
    }else{
      let index = this.selectedDuplicatePetIds.indexOf(data.petId);
      this.selectedDuplicatePetIds.splice(index, 1); 
    }
    console.log(this.selectedDuplicatePetIds)
  }
  reset($event){
    if($event){
      this.selectedDuplicatePetIds = [];
      this.tabservice.removeModel('duplicatePeIds');
    }
      
  }
}

