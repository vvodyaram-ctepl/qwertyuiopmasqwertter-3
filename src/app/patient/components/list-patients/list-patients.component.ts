import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ViewEncapsulation } from '@angular/core';
import { UserDataService } from 'src/app/services/util/user-data.service';
import { TabserviceService } from 'src/app/shared/tabservice.service';
import { CustomDateFormatPipe } from 'src/app/pipes/custom-date-format.pipe';
import { PetService } from 'src/app/patient/pet.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-list-patients',
  templateUrl: './list-patients.component.html',
  styleUrls: ['./list-patients.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ListPatientsComponent implements OnInit {

  headers: any;
  filterTypeArr: any[];
  totalActivePets: any = 0;
  totalActiveStudies: any = 0;
  RWFlag: boolean;
  modalRef2: NgbModalRef;
  showDataTable: boolean = true;
  @ViewChild('archiveContent') archiveContent: ElementRef;
  @ViewChild('unassignPopupTemplate') unassignPopupTemplate: ElementRef;
  petId: any;
  petName: any;
  modalRef: NgbModalRef;

  filteredObj: any;

  filterParams: any = {};

  //@ViewChild(AssetUnassignComponent) unassignPopup: AssetUnassignComponent;
  

  deviceNumber: any;
  studiesMappedToSameDevice: any = [];
  selectedStudy: any;
  selectedPet: any;
  deviceId: any = '';

  constructor(
    public router: Router,
    public route: ActivatedRoute,
    private userDataService: UserDataService,
    private tabservice: TabserviceService,
    private customDatePipe: CustomDateFormatPipe,
    private petService: PetService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private modalService: NgbModal
  ) { }

  ngOnInit() {
    //permission for the module
    let userProfileData = this.userDataService.getRoleDetails();
    let menuActionId = '';

    userProfileData.rolePermissions && userProfileData.rolePermissions.forEach(ele => {
      if (ele.menuId == "14") {
        menuActionId = ele.menuActionId;
      }
    });
    if (menuActionId == "3") {
      this.RWFlag = true;
    }

    this.headers = [
      { key: "petPhotoUrl", label: "", checked: true, width: 50 },
      { key: "petName", label: "Pet Name", checked: true, clickable: true, sortable: true },
      { key: "breedName", label: "Breed", checked: true, sortable: true },
      { key: "petParentName", label: "Pet Parent Name", checked: true, sortable: true },
      { key: "studyName", label: "Study", checked: true, width: 200 },
      // { key: "planNames", label: "plan", checked: true, width: 200 },
      { key: "sensorDetails", label: "Asset Details", checked: true, width: 250 },
      { key: "petStatus", label: "Status", checked: true, width: 100 },
      { key: "static", label: "", clickable: true, checked: true, width: 100 },
    ];

    this.filterTypeArr =
      [{
        name: "Status",
        id: "petStatus"
      },
      {
        name: "Study",
        id: "Study"
      }
      ];

    this.route.queryParams.subscribe((obj: any) => {
      this.filterParams = obj;
    })
  }
  getNode($event) {
    let action = $event.event.target.title;
    let res = Object.assign({});
    res.id = $event.item.petId;
    this.petId = res.id;
    
    if ($event.header === 'petName') {
      this.spinner.show();
      let studyId: any;
      this.petService.getPet(`/api/pets/getCurrentStudies/${$event.item.petId}`, '').subscribe(res => {
        if (res.status.success === true) {
          let list = res.response.petStudy;
          if (list.length > 0) {
            studyId = list[0].petStudyId;
            this.spinner.hide();
            this.router.navigate([`/user/patients/view/${$event.item.petId}/${studyId}/patient-charts`], { queryParams: this.filteredObj });
          }
          else {
            this.petService.getPet(`/api/pets/getArchiveStudies/${$event.item.petId}`, '').subscribe(res => {
              if (res.status.success === true) {
                let archList = res.response.petStudy;
                if (archList.length > 0) {
                  studyId = archList[0].petStudyId;
                  this.spinner.hide();
                  this.router.navigate([`/user/patients/view/${$event.item.petId}/${studyId}/patient-charts`], { queryParams: this.filteredObj });
                }
                else {
                  this.spinner.hide();
                  this.router.navigate([`/user/patients/view/${$event.item.petId}/0/patient-charts`], { queryParams: this.filteredObj });
                }
              }
              else {
                this.toastr.error(res.errors[0].message);
              }
            }, err => {
              this.spinner.hide();
              if (err.status == 500) {
                this.toastr.error(err.error.message + ". " + "Please try after sometime or contact administrator.");
              }
              else {
                this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
              }

            })
          }
          // $event.item.studyId

        }
        else {
          this.toastr.error(res.errors[0].message);
        }
      }, err => {
        this.spinner.hide();
        if (err.status == 500) {
          this.toastr.error(err.error.message + ". " + "Please try after sometime or contact administrator.");
        }
        else {
          this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
        }

      })

      // /user/patients/view/5829/0/patient-charts
    }
    if (action === 'Edit') {
      this.tabservice.clearDataModel();
      this.router.navigate(['/user/patients/edit-patient', $event.item.petId], { queryParams: this.filteredObj });
    }
    if (action === 'view') {
      this.router.navigate(['/user/patients/view'], { queryParams: this.filteredObj });
    }
    if (action === 'Delete') {
      
      
      // if($event.item.petStatus == 'On Study'){
      //   this.toastr.error(`Cannot delete ${$event.item.petName} as it is already a part of an ongoing study ${$event.item.petStatus}`);
      //   return;
      // }
      // if ($event.item.isActive === "Inactive") {
      this.openPopup(this.archiveContent, 'xs');
      this.petName = $event.item.petName;
      // }
      // else {
      //   this.toastr.error("Cannot delete an active study");
      // }
    }
    if (action === 'Unassign') {

      this.deviceId = $event.item.deviceId;
      this.selectedStudy = $event.item.studyId;
      this.modalRef = this.modalService.open(this.unassignPopupTemplate, {
        size: 'xs',
        windowClass: 'smallModal'
      });
      this.modalRef.result.then((result) => {
      }, (reason) => {
      });
    }
  }
  public reloadDatatable() {
    this.showDataTable = false;
    setTimeout(() => {
      this.showDataTable = true;
    }, 1);
  }

  deletePet() {
    this.spinner.show();
    this.petService.deletePet(`/api/pets/${this.petId}`, '').subscribe(res => {
      if (res.status.success === true) {
        this.toastr.success('Pet deleted successfully!');
        this.reloadDatatable();
      }
      else {
        this.toastr.error(res.errors[0].message);
      }
      this.spinner.hide();
      this.modalRef2.close();
    },
      err => {
        if (err.status == 500) {
          this.toastr.error(err.error.message + ". " + "Please try after sometime or contact administrator.");
        }
        else {
          this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
        }
        this.modalRef2.close();
        this.spinner.hide();
      })
  }
  openPopup(div, size) {
    this.modalRef2 = this.modalService.open(div, {
      size: size,
      windowClass: 'smallModal',
      backdrop: 'static',
      keyboard: false
    });
    this.modalRef2.result.then((result) => {
    }, () => {
    });
  }

  totalFormatter($event) {
    this.totalActiveStudies = $event.otherFields.totalActiveStudies;
    this.totalActivePets = $event.otherFields.totalActivePets;
  }

  formatter($event) {

    $event.forEach(ele => {
      if (ele.petPhoto) {
        ele.petPhotoUrl = `<span class="petImage"><img class="dog-circle" src= ` +
          ele.petPhotoUrl + ` height="38" width="38"></span>`
      } else {
        ele.petPhotoUrl = '<span class="petImage"><img class="dog-circle" src="assets/images/no-dogs.svg" height="38" width="38"></span>';
      }
      // if(ele.breedName == 'UKNOWN'){
      //   ele.breedName = '';
      // }
      if (ele.petStatusId == '1') {
        ele['columnCssClass']['petStatus'] = "off-status";
      }
      if (ele.petStatusId == '2') {
        ele['columnCssClass']['petStatus'] = "active-status";
      }
      if (ele.petStatusId == '3') {
        ele['columnCssClass']['petStatus'] = "inactive-status";
      }
      if (ele.petStatusId == '4') {
        ele['columnCssClass']['petStatus'] = "inactive-status";
      }

      ele.createdDate = this.customDatePipe.transform(ele.createdDate, 'MM/dd/yyyy');

      if (this.RWFlag) {
        ele.static = `<div class="card icon-card-list green-bg mb-2 mr-2" title="Edit">
          <span class="icon-tag size-20" title="Edit"></span>
        </div>&nbsp;${ele.sensorDetails ? `<div class="card icon-card-list red-bg mb-2 mr-2 pl-1"  title="Unassign">
        <span class="icon-unassigned size-12" title="Unassign"></span>
        </div>&nbsp;` : ``}<div class="card icon-card-list red-bg mb-2" title="Delete">
        <span class="fa fa-trash-alt size-14" style="color:red;" title="Delete"></span>
        </div>`;
      }
    });
  }

  addNewPet() {
    this.tabservice.clearDataModel();
    this.router.navigate(['/user/patients/add-patient'], { queryParams: this.filteredObj });
  }

  filterObj(obj: any) {
    this.filteredObj = obj;
  }
  dismiss(event){
    this.modalRef.close();
    if(event) this.reloadDatatable();
  }

}
