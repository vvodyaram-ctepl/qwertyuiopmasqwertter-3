import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomDateFormatPipe } from 'src/app/pipes/custom-date-format.pipe';
import { UserDataService } from 'src/app/services/util/user-data.service';
import { TabserviceService } from 'src/app/shared/tabservice.service';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { PetParentService } from 'src/app/pet-parent/pet-parent.service';
import { PetService } from 'src/app/patient/pet.service';
 
@Component({
  selector: 'app-primary-pets-list',
  templateUrl: './primary-pets-list.component.html',
  styleUrls: ['./primary-pets-list.component.scss']
})
export class PrimaryPetsListComponent implements OnInit {

  headers: any;
  filterTypeArr: any[];
  RWFlag: boolean;
  modalRef2: NgbModalRef;
  petParentId: any;
  parentName: any;
  showDataTable: boolean = true;
  petNamesList = [];
  breedArray =[];
  genderArray = [];

  filteredObj: any;

  filterParams: any = {};

  @ViewChild('archiveContent') archiveContent: ElementRef;
  petName: any;
  petId: any = '';

  constructor(
    public router: Router,
    public route: ActivatedRoute,
    public customDatePipe: CustomDateFormatPipe,
    private userDataService: UserDataService,
    private tabservice: TabserviceService,
    private parentService: PetParentService,
    private toastr: ToastrService,
    private modalService: NgbModal,
    private spinner: NgxSpinnerService,
    private petService: PetService
  ) { }

  ngOnInit() {

    


    //permission for the module
    this.petService.getPet('/api/lookup/getPetName', '').subscribe(res => {
      this.petNamesList = res.response ?  res.response.petNameList : null;
    },
      err => {
        this.spinner.hide();
        this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
      }
    );
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

    let userProfileData = this.userDataService.getRoleDetails();
    console.log("userProfileData", userProfileData);
    let menuActionId = '';
    userProfileData.rolePermissions && userProfileData.rolePermissions.forEach(ele => {
      if (ele.menuId == "42") {
        menuActionId = ele.menuActionId;
      }
    });
    if (menuActionId == "3") {
      this.RWFlag = true;
    }
    this.headers = [
      { key: "petName", label: "Primary Pet Name", checked: true, clickable: true },
      { key: "duplicatePets", label: "Duplicate Pets", checked: true },
      { key: "static", label: "", clickable: true, checked: true, width: 65 }
    ];
    this.filterTypeArr =
      [{
        name: "Status",
        id: "Status"
      },
        // {
        //   name: "Study",
        //   id: "Study"
        // }
      ];

    this.route.queryParams.subscribe((obj: any) => {
      this.filterParams = obj;
    })
  }

  formatter($event) {
    $event.forEach(ele => {
      ele.createdDate = this.customDatePipe.transform(ele.createdDate, 'MM/dd/yyyy');
      //ele.createdDate = this.customDatePipe.transform(ele.createdDate, 'MM/dd/yyyy');
      ele.id = ele.rnum;

      if (ele.petNames) {
        ele.petNames = ele.petNames.toString().split(',').join(', ');
      }

      if (ele.isActive == true) {
        ele.isActive = "Active";
        ele['columnCssClass']['isActive'] = "active-status";
      } else {
        ele.isActive = "Inactive";
        ele['columnCssClass']['isActive'] = "inactive-status";
      }
      if (ele.petParentFirstName) {
        ele['petParentName'] = ele.petParentFirstName + " " + ele.petParentLastName;
      }
      if(!ele.duplicatePets){
        ele.duplicatePets  = '-';
      }


      if (this.RWFlag) {
        ele.static = `<div class="card icon-card-list red-bg mb-2" title="Delete">
  <span class="fa fa-trash-alt size-14" style="color:red;" title="Delete"></span>
  </div>`
      }

    });
  }

  getNode($event) {
    let action = $event.event.target.title;

    if (action === 'Delete') {
      let res = Object.assign({});
      this.petId = $event.item.primaryPetId;

      this.openPopup(this.archiveContent, 'xs');
      this.petName = $event.item.petName;
     }else{
      this.router.navigate(['/user/duplicate-pets/view-duplicate-pet/', $event.item.primaryPetId], { queryParams: this.filteredObj });
     }
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

  public reloadDatatable() {
    this.showDataTable = false;
    setTimeout(() => {
      this.showDataTable = true;
    }, 1);
  }

  selectPrimaryPets() {
    this.tabservice.clearDataModel();
    this.router.navigate(['/user/duplicate-pets/add-duplicate-pets/select-primary-pets'], { queryParams: this.filteredObj });
  }

  filterObj(obj: any) {
    this.filteredObj = obj;
  }

  deleteDuplicatePet(){
    console.log(this.petId)
    this.spinner.show();
    this.petService.deletePet(`/api/duplicatePets/deleteDuplicatePet/${this.petId}`, '').subscribe(res => {
      if (res.status.success === true) {
        this.toastr.success('Duplicate Pet has been deleted successfully!');
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

}
