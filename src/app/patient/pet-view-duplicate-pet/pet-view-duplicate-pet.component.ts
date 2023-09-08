import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
 import { NgxSpinnerService } from 'ngx-spinner';
import { LookupService } from 'src/app/services/util/lookup.service';
import { UserDataService } from 'src/app/services/util/user-data.service';
import { TabserviceService } from 'src/app/shared/tabservice.service';
import { PetParentService } from 'src/app/pet-parent/pet-parent.service';
import { CustomDateFormatPipe } from 'src/app/pipes/custom-date-format.pipe';
import { PetService } from 'src/app/patient/pet.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';

@Component({
  selector: 'app-pet-view-duplicate-pet',
  templateUrl: './pet-view-duplicate-pet.component.html',
  styleUrls: ['./pet-view-duplicate-pet.component.scss'],
  encapsulation : ViewEncapsulation.None
})
export class PetViewDuplicatePetComponent implements OnInit {

  petParentId: any = '';
  petParentDetails: any = {};
  viewDuplicatePetArray: any = [];
  headers: any;
  menuId: any;
  RWFlag: boolean;
  isFav: boolean = false;
  queryParams: any = {};
  @ViewChild('addressHistory') addressHistory: ElementRef;
  modalRef: NgbModalRef;
  addressList: any[] = [];
  tooltipHover = [true];

  @ViewChild('historyContent') historyContent: ElementRef;
  streamHistory: any = [];
  modalRef2: NgbModalRef;
  petId: string;

  constructor(
    private router: Router,
    private petParentService: PetParentService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private lookupService: LookupService,
    private userDataService: UserDataService,
    private tabService: TabserviceService,
    private activatedRoute: ActivatedRoute,
    private customDatePipe: CustomDateFormatPipe,
    private petService: PetService
  ) { }

  formatUSPhoneNumber(phoneNumberString) {
    var cleaned = ('' + phoneNumberString).replace(/\D/g, '');
    var match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      var intlCode = (match[1] ? '+1 ' : '+1 ');
      return [intlCode, ' ', '(', match[2], ')', match[3], '-', match[4]].join('');
    }
    return null;
  }

  formatUKPhoneNumber(phoneNumber) {
    let phoneNumberArr = phoneNumber.toString().split("44");
    let genPh = phoneNumberArr[1]
    // return phoneNumberArr[1].replace(/\s+/g, '').replace(/(.)(\d{4})(\d)/, '+44 $1 - $2 - $3');
    let newString = '+44' + ' ' + genPh.substr(0, 2) + '-' + genPh.substr(2, 4) + '-' + genPh.substr(6, 4);
    return newString
  }

  ngOnInit() {

    this.activatedRoute.params.subscribe(async params => {
      let str = this.router.url;
      this.petId = str.split("view/")[1].split("/")[0];
       
    })

    let userProfileData = this.userDataService.getRoleDetails();
    let menuActionId = '';
    userProfileData.rolePermissions && userProfileData.rolePermissions.forEach(ele => {
      if (ele.menuId == "15") {
        menuActionId = ele.menuActionId;
        this.menuId = ele.menuId;
      }
    });

    if (menuActionId == "3") {
      this.RWFlag = true;
    }

     
      this.spinner.show();
      this.petParentService.getPetParentService(`/api/duplicatePets/getDuplicatePetConfigById/${this.petId}`).subscribe(res => {
        this.spinner.hide();
        if (res.status.success == true && res.response) {
           console.log(res.response);
           this.viewDuplicatePetArray =  Object.keys(res.response).map((key) => res.response[key]);
           console.log(this.viewDuplicatePetArray);
           this.viewDuplicatePetArray.forEach(element => {
              element.forEach(element => {
                if(element.startDate){
                  element.startDate = this.customDatePipe.transform(element.startDate, 'MM/dd/yyyy');
                }
                if(element.endDate){
                  element.endDate = this.customDatePipe.transform(element.endDate, 'MM/dd/yyyy');
                }
                if(element.extractStartDate){
                  element.extractStartDate = this.customDatePipe.transform(element.extractStartDate, 'MM/dd/yyyy');
                }
                if(element.extractEndDate){
                  element.extractEndDate = this.customDatePipe.transform(element.extractEndDate, 'MM/dd/yyyy');
                }
                
              });
          });
           
        }
        this.spinner.hide();
      }, err => {
        this.errorMsg(err);
      });
    
     
  }

  groupBy(xs, f) {
    return xs.reduce((r, v, i, a, k = f(v)) => ((r[k] || (r[k] = [])).push(v), r), {});
  }
    
  backToList() {
    this.router.navigate(['user/duplicate-pets']);
  }

  errorMsg(err) {
    this.spinner.hide();
    if (err.status == 500) {
      this.toastr.error(err.error.message + ". " + "Please try after sometime or contact administrator.");
    }
    else {
      this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
    }
  }
  getHistory(list){
    this.streamHistory = [];
    list.forEach(element => {
      if(element.petType == 'P'){
        if(!element.excludeFromDataExtract){
          this.streamHistory.push({
            assetNumber: element.assetNumber,
            startDate : element.extractStartDate,
            endDate : element.extractEndDate,
            stream: element.streamId
          });
        }
      }else{
        if(!element.dupExcludeFromDataExtract){
          this.streamHistory.push({
            assetNumber: element.assetNumber,
            startDate : element.extractStartDate,
            endDate : element.extractEndDate,
            stream: element.streamId
          });
        }
      }
        
    });
    if(this.streamHistory.length){
      this.openPopup(this.historyContent, 'lg');
    }else{
      this.toastr.error("History unavailable as the selected stream is excluded from extract.");
    }
      
  }

  openPopup(div, size) {
    this.modalRef2 = this.modalService.open(div, {
      size: size,
      windowClass: 'xs' ? 'smallModal' : 'largeModal',
      backdrop: 'static',
      keyboard: false
    });
  }
  getFormatted(value){
    return moment(value).format("MM-DD-YYYY")
  }
  onHoverStream(i: number) {
    this.tooltipHover = [];
    this.tooltipHover[i] = !this.tooltipHover[i];
  }

}
