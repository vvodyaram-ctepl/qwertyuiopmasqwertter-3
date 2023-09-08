import { Component, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AssetService } from 'src/app/services/util/asset.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { PetService } from 'src/app/patient/pet.service';
import { CustomDateFormatPipe } from 'src/app/pipes/custom-date-format.pipe';
import { TabserviceService } from 'src/app/shared/tabservice.service';
import { Router,ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-select-primary-pets',
  templateUrl: './select-primary-pets.component.html',
  styleUrls: ['./select-primary-pets.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SelectPrimaryPetsComponent implements OnInit {

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
  selectedPrimaryPet:any = {};
  submitFlag: any;
  dataList: any =[];

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
    this.firmForm = this.fb.group({
      'firmwareVersion': ['', [Validators.required]],
      'firmwareVersionId': '',
      'ModifedBy': ''
    })
  }

  ngOnInit() {
    
    //this.tabservice.clearDataModel();
    let res = this.tabservice.getModelData() ? this.tabservice.getModelData() : {}
    console.log(res);
    if(res && res.primaryPetInfo){
      this.selectedPrimaryPet = res.primaryPetInfo;
    }
    
    
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
      { key: "primaryPet", label: "Primary", checked: true, customTemplate: this.primaryTemplate, jsonKeys: ['rowData'], width: 65 },
      { key: "petPhotoUrl", label: "", checked: true, width: 50},
      { key: "petName", label: "Pet Name", checked: true },
      { key: "petParentName", label: "Pet Parent Name", checked: true },
      { key: "gender", label: "Gender", checked: true },
      { key: "dateOfBirth", label: "Date of Birth", checked: true },
      { key: "breedName", label: "Breed", checked: true }
    ];
    this.filterTypeArr =
      [
      ];
    
  }

  public reloadDatatable() {
    this.showDataTable = false;
    setTimeout(() => {
      this.showDataTable = true;
    }, 1);
  }
  formatter($event){
    this.dataList = $event;
    $event.forEach(element => {
      if (element.petPhoto) {
        element.petPhotoUrl = `<span class="petImage p-img"><img class="dog-circle" src= ` +
          element.petPhotoUrl + ` height="38" width="38"></span>`
      } else {
        element.petPhotoUrl = '<span class="petImage p-img"><img class="dog-circle" src="assets/images/no-dogs.svg" height="38" width="38"></span>';
      }
       
      element.dateOfBirth = this.customDatePipe.transform(element.dateOfBirth, 'MM/dd/yyyy');
      element['customTemplateJson']['primaryPet'] = { 'rowData': element };
     
     // console.log(element);
      if(this.selectedPrimaryPet && (Object.keys(this.selectedPrimaryPet).length !==0) &&
      element.petId == this.selectedPrimaryPet.petId
      ){
        console.log("got");
        element.isChecked = true;
      }
     // element.petParentName = '<a style="color:#37b57c">'+element.petParentName+'</a>';
    });
  }

  onSubmit() {
    console.log("Sdjsb", this.firmForm.value.firmwareVersion);
    console.log("valid", this.firmForm.valid);
    console.log("Sds");
    Object.keys(this.firmForm.controls).forEach(key => {
      this.firmForm.controls[key].markAsTouched();
    });

    if (this.firmForm.valid) {
      this.spinner.show();


      let fid = this.firmForm.value.firmwareVersion
      this.assetservice.updateFirmware(`/api/assets/updateDeviceFirmware/${fid}/${this.devArr.toString()}`, {}).subscribe(res => {
        console.log("resss", res);
        if (res.status.success === true) {
          this.reloadDatatable();
          this.spinner.hide();
          this.toastr.success('Firmware Version updated successfully!');
        }
        else {
          this.spinner.hide();
          this.toastr.error(res.errors[0].message);
        }
        this.modalRef2.close();
      },
        err => {

          console.log(err);
          if (err.status == 500) {
            this.toastr.error(err.error.message + ". " + "Please try after sometime or contact administrator.");
          }
          else {
            this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
          }
          this.modalRef2.close();
          this.spinner.hide();
        }
      )
    }


  }
  selectedRecords($event) {
    console.log("$event", $event);
    if ($event) {
      this.devArr = [];
      $event.forEach(ele => {
        this.devArr.push(ele.deviceId);
      })
    }
  }
  selectedRecordsForVersion($event) {
    console.log("$event", $event);
    if ($event) {
      this.assetArr = [];
      this.assetModelArr = []   
        $event.forEach(ele => {
          this.assetArr.push(ele.deviceType);
          this.assetModelArr.push(ele.deviceModel)
        })
     }
  }
  lowerCaseModelFunction(){
    console.log(this.assetModelArr)
  let j = this.assetModelArr.length;
  while ( --j >= 0 ) {
    console.log(this.assetModelArr[j]);
    console.log(typeof this.assetModelArr[j]);
      if ( typeof this.assetModelArr[j] === "string" ) {
        this.assetModelArr[j] = this.assetModelArr[j].toLowerCase();
      }
      
    }
    return this.assetModelArr;
  }
  lowerCaseFunction(){
    console.log(this.assetArr)
  let i = this.assetArr.length;
  while ( --i >= 0 ) {
    console.log(this.assetArr[i]);
    console.log(typeof this.assetArr[i]);
      if ( typeof this.assetArr[i] === "string" ) {
        this.assetArr[i] = this.assetArr[i].toLowerCase();
      }
      
    }
    return this.assetArr;
  }
  checkAssetType(){
    // let values: (string)[] = this.assetArr;
    
    const allEqual =  this.assetArr.every(v => v ==this.assetArr[0]);
    console.log(allEqual);
    this.assetCheckValid =allEqual;
    // ?allEqual(this.assetArr);
  }

  checkAssetModel(){
    // let values: (string)[] = this.assetArr;
    
    const allEqual =  this.assetModelArr.every(v => v ==this.assetModelArr[0]);
    console.log(allEqual);
    this.assetModelCheckValid =allEqual;
    // ?allEqual(this.assetArr);
  }

  getFirmwareList(type,model) {
    this.assetservice.getFirmwareList(`/api/assets/getAllFirmwareVersions/${type}/${model}`,'').subscribe(res => {
      console.log("ress", res);
      this.firmwareList = res.response.firmwareVersions;
    })
  }

  openPopup(div, size) {
    console.log('div :::: ', div);
    this.modalRef2 = this.modalService.open(div, {
      size: size,
      windowClass: 'smallModal',
      backdrop: 'static',
      keyboard: false
    });
    this.modalRef2.result.then((result) => {
      console.log(result);
    }, () => {
    });
  }

  getNode($event){
    console.log($event)
  }
  onPrimarySelect(data){
    console.log(data);
    this.selectedPrimaryPet = data;

  }
  next(){
    if(Object.keys(this.selectedPrimaryPet).length > 0){
      this.tabservice.setModelData(this.selectedPrimaryPet, 'primaryPetInfo');
      this.router.navigate(['/user/duplicate-pets/add-duplicate-pets/select-duplicate'], { queryParams: this.queryParams });
    }else{
      this.toastr.error('Please select at least one primary pet');
      return;
    }
  }
  cancel(){
    this.router.navigate(['/user/duplicate-pets']);
    this.tabservice.clearDataModel();
  }
  canDeactivate(component, route, state, next) {
    let data = this.tabservice.getModelData();
    if (next.url.indexOf('/auth/login') > -1) {
      return true;
    }
    if(Object.keys(this.selectedPrimaryPet).length > 0){
      this.tabservice.setModelData(this.selectedPrimaryPet, 'primaryPetInfo');
    }
    if(next && (next.url.includes('/user/duplicate-pets/add-duplicate-pets/select-duplicate')
            && Object.keys(this.selectedPrimaryPet).length == 0
            )){
      this.toastr.error('Please select at least one primary pet');
      return false;
    }else if(next.url.includes('/user/duplicate-pets/add-duplicate-pets/data-stream')){
      let res = this.tabservice.getModelData() ? this.tabservice.getModelData() : {}
      console.debug(res);

      if(!res || !res.primaryPetInfo){
        this.toastr.error('Please select at least one primary pet');
        return false;
      }

      if(!res.duplicatePeIds){
        this.toastr.error('Please select at least one duplicate pet');
        return false;
      }
      return true;
    }else{
      return true;
    }
  }
  reset($event){
    if($event == true){
      this.selectedPrimaryPet = {};
      this.tabservice.clearDataModel();
    }
      
  }
   
}
