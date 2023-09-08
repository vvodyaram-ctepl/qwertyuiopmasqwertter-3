import { Component, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AssetService } from 'src/app/services/util/asset.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { PetService } from 'src/app/patient/pet.service';
import { TabsService } from 'projects/Tabs/src/lib/components/tabs.service';
import { TabserviceService } from 'src/app/shared/tabservice.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomDateFormatPipe } from 'src/app/pipes/custom-date-format.pipe';
import * as moment from 'moment';

@Component({
  selector: 'app-data-streams',
  templateUrl: './data-streams.component.html',
  styleUrls: ['./data-streams.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DataStreamsComponent implements OnInit {

  @ViewChild('primaryTemplate', { static: true }) primaryTemplate: ElementRef;

  headers: any;
  queryParams = {};
  public showDataTable: boolean = true;
  firmForm: FormGroup;
  modalRef2: NgbModalRef;
  selectable: object = {
    title: '',
    selectAll: false,
    type: 'radio'
  };
  breedArray = [];
  genderArray = [];


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
  chkboxValue: any;
  selectedPrimaryPetId: any = '';
  selectedPetIds: any = [];
  dataStreamArray = [];
  stitchArray = [];
  stitchGroupArray = [];
  streamForm: FormGroup;
  primaryPetId: number;
  duplicatePetIds: any = '';

  constructor(
    private fb: FormBuilder,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private petservice: PetService,
    private toastr: ToastrService,
    private petService: PetService,
    public customDatePipe: CustomDateFormatPipe,
    private tabservice: TabserviceService,
    private router: Router,
    private route: ActivatedRoute,
  ) {

  }

  ngOnInit() {
    this.streamForm = this.fb.group({
      arr: this.fb.array([]),
    });


    let res = this.tabservice.getModelData() ? this.tabservice.getModelData() : {};
    if (res && res.primaryPetInfo) {
      //  if(true){
      this.selectedPrimaryPetId = res.primaryPetInfo.petId;
      this.duplicatePetIds = res.duplicatePeIds ? res.duplicatePeIds.toString() : '';
      //  this.selectedPrimaryPetId = '4613';
      //  this.duplicatePetIds = '4390,3568,3569,114,4390';

      this.spinner.show();
      this.petService.getPet(`/api/duplicatePets/getDataStreams?primaryPetId=${this.selectedPrimaryPetId}&duplicatePetIds=${this.duplicatePetIds}`, '').subscribe(res => {
        this.dataStreamArray = res.response;
        this.dataStreamArray.forEach(element => {
          if (element.startDate) {
            element.startDate = this.customDatePipe.transform(element.startDate, 'MM/dd/yyyy');
          }
          if (element.endDate) {
            element.endDate = this.customDatePipe.transform(element.endDate, 'MM/dd/yyyy');
          }
        });
        this.spinner.hide();
      },
        err => {
          this.spinner.hide();
          this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
        }
      );
    } else {
      this.router.navigate(['/user/duplicate-pets/add-duplicate-pets/select-primary-pets']);
      return;
    }
  }
  getFormArray(): any {
    return <FormArray>this.streamForm.get('arr');
  }


  formatter($event) {
    $event.forEach(element => {
      if (element.petPhoto) {
        element.petPhotoUrl = `<span class="petImage"><img class="dog-circle" src= ` +
          element.petPhotoUrl + ` height="38" width="38"></span>`
      } else {
        element.petPhotoUrl = '<span class="petImage"><img class="dog-circle" src="assets/images/no-dogs.svg" height="38" width="38"></span>';
      }

      element.dateOfBirth = this.customDatePipe.transform(element.dateOfBirth, 'MM/dd/yyyy');
      element['customTemplateJson']['duplicatePet'] = { 'rowData': element };

      element.petParentName = '<a style="color:#37b57c">' + element.petParentName + '</a>';
    });
  }

  onPrimarySelect(data) {
    this.selectedPrimaryPet = data;
  }

  back() {
    this.router.navigate(['/user/duplicate-pets/add-duplicate-pets/select-duplicate'], { queryParams: this.queryParams });
  }

  canDeactivate(component, route, state, next) {
    let data = this.tabservice.getModelData();
    if (next.url.indexOf('/auth/login') > -1) {
      return true;
    }
    return true;

  }

  getChkboxValue(e: any, data, index) {
    if (e.target.checked) {
      this.selectedPetIds.push(data);
    } else {
      let indexValue = this.selectedPetIds.findIndex((x, indx) => (x.studyId == data.studyId && x.petId == data.petId));
      this.selectedPetIds.splice(indexValue, 1);
    }
  }
  stitch() {
    if (this.selectedPetIds.length > 0) {
      this.stitchArray = [];
      let isPetStudySame = this.selectedPetIds.every(item => item.studyId === this.selectedPetIds[0].studyId);

      if (isPetStudySame) {

        // allow only one active stream to stitch
        /* let activeStreams = this.selectedPetIds.filter((pet: any) => !pet.endDate || pet.endDate == '');
        if (activeStreams.length > 1) {
          this.toastr.error('Only one active stream should be present in the selected streams');
          return false;
        } */

        const newFormAray = this.fb.array([]);
        this.getFormArray().push(newFormAray);

        this.selectedPetIds.forEach(element => {
          let index = this.dataStreamArray.findIndex(x => (x.petId === element.petId && x.studyId == element.studyId));
          let obj = this.dataStreamArray.find(item => (item.petId === element.petId && item.studyId == element.studyId));
          if (obj) {
            this.dataStreamArray.splice(index, 1);
            const subFormArray = newFormAray as FormArray
            subFormArray.push(this.createSubFormGroup(obj));
          }
        });

        //this.stitchGroupArray.push(this.stitchArray);
        this.selectedPetIds.length = 0;

      } else {
        this.toastr.error('Please select same study pet', 'Error!');
      }
    } else {
      this.toastr.error('Please select at least one pet', 'Error!');
    }
  }
  createSubFormGroup(obj) {
    return this.fb.group({
      startDate: '',
      endDate: '',
      data: obj,
      isExcludeDataExtract : false
    })
  }
  createGroupArray(obj) {
    return this.fb.array([])
  }
  onSubmit() {
    let postObject = Object.assign({});
    let duplicatePetArray = [];

    if (this.dataStreamArray.length != 0) {
      this.toastr.error('Please select all streams for stitch');
      return;
    }

    let isDatesValid = true;
    this.streamForm.value.arr.forEach((element, index) => {
      if (!isDatesValid) return;

      element.forEach(elem => {
        if ((elem.startDate == '' || elem.endDate == '') && !elem.isExcludeDataExtract) {
          isDatesValid = false;
          return;
        }
      });
    });
    if (!isDatesValid) {
      this.toastr.error('Please select valid extract date');
      return;
    }

    // extract start date and end date overlap check between streams -- start
    let isOverlap: boolean = false;
    let allexcludedextract: boolean = false;
    this.streamForm.value.arr.forEach((ele: any) => {
      if (ele.length > 1 && !isOverlap) {
        for (let i = 0; i < ele.length; i++) {
          let overlapRecords = ele.filter((obj: any, indx: number) => {
            let startDate1 = new Date(ele[i].startDate),
              startDate2 = new Date(obj.startDate),
              endDate1 = new Date(ele[i].endDate),
              endDate2 = new Date(obj.endDate);
            return (i != indx && ((startDate1 >= startDate2 && startDate1 <= endDate2) || (endDate1 >= startDate2 && endDate1 <= endDate2) || (startDate2 >= startDate1 && startDate2 <= endDate1) || (endDate2 >= startDate1 && endDate2 <= endDate1)) && !ele[i].isExcludeDataExtract);
          });
          if (overlapRecords.length) {
            isOverlap = true;
            this.toastr.error("'Extract Date Ranges' should not overlap between streams.");
            return false;
          }
        }
      }
      if(ele.length > 1 && !allexcludedextract){
        allexcludedextract = ele.length > 1 ? ele.every(v => v.isExcludeDataExtract === true) : false;
        if(allexcludedextract){
          return false;
        }
      }
    });
    if (isOverlap)
      return false;
    // extract start date and end date overlap check between streams -- end

    if(allexcludedextract){
      this.toastr.error('At least one stream should be included in data extract.');
      return false;
    }

    this.streamForm.value.arr.forEach((element, index) => {

      let date = new Date();
      let stitch = this.selectedPrimaryPetId + '-' + index + '-' + date.getDate() + '-' + date.getHours() + '-' + date.getMinutes() + '-' + date.getSeconds();

      let primaryPetArray = element.filter(group => (group.data.petType === 'P'));

      if (primaryPetArray.length) {

        //Primary pet and duplicate pet combination
        element.forEach((ele, index) => {
          let obj = Object.assign({});
          
          if (ele.data.petType == 'D') {
            obj.primaryPetId = this.selectedPrimaryPetId;
            obj.primaryStreamId = primaryPetArray[0].data.streamId;
            obj.primaryExtractStartDate = this.customDatePipe.transform(primaryPetArray[0].startDate, 'yyyy-MM-dd');
            obj.primaryExtractEndDate = this.customDatePipe.transform(primaryPetArray[0].endDate, 'yyyy-MM-dd');

            obj.petType = 'D';
            obj.dupExcludeFromDataExtract = ele.isExcludeDataExtract ? 1 : 0;
            obj.excludeFromDataExtract = primaryPetArray[0].isExcludeDataExtract ? 1 : 0;

            obj.duplicatePetId = ele.data.petId;
            obj.duplicateStreamId = ele.data.streamId;
            obj.duplicateExtractStartDate = this.customDatePipe.transform(ele.startDate, 'yyyy-MM-dd');
            obj.duplicateExtractEndDate = this.customDatePipe.transform(ele.endDate, 'yyyy-MM-dd');

            obj.stitchGroupId = stitch;

            obj.primaryPetStudyDeviceId = primaryPetArray[0].data.petStudyDeviceId;
            obj.dupPetStudyDeviceId = ele.data.petStudyDeviceId;

            duplicatePetArray.push(obj);
          }
        });

        //primary pets available.
        let startIndex = (primaryPetArray.length == element.length) ? 0 : 1;  
        //startIndex-starts from 0 or 1 because one primary & duplicate combination already added.
        for (let i = startIndex; i < primaryPetArray.length; i++) {
          let obj = Object.assign({});

          obj.primaryPetId = this.selectedPrimaryPetId;
          obj.primaryStreamId = primaryPetArray[i].data.streamId;
          obj.primaryExtractStartDate = this.customDatePipe.transform(primaryPetArray[i].startDate, 'yyyy-MM-dd');
          obj.primaryExtractEndDate = this.customDatePipe.transform(primaryPetArray[i].endDate, 'yyyy-MM-dd');
          obj.petType = 'P';
          obj.stitchGroupId = stitch;

          obj.primaryPetStudyDeviceId = primaryPetArray[i].data.petStudyDeviceId;
          obj.excludeFromDataExtract = primaryPetArray[i].isExcludeDataExtract ? 1 : 0;
          obj.dupExcludeFromDataExtract = 0;

          duplicatePetArray.push(obj);
        }

      } else {
        //only duplicate pets without primary pet
        element.forEach((ele, index) => {
          let obj = Object.assign({});

          obj.primaryPetId = this.selectedPrimaryPetId;
          obj.duplicatePetId = ele.data.petId;
          obj.duplicateStreamId = ele.data.streamId;
          obj.duplicateExtractStartDate = this.customDatePipe.transform(ele.startDate, 'yyyy-MM-dd');
          obj.duplicateExtractEndDate = this.customDatePipe.transform(ele.endDate, 'yyyy-MM-dd');

          obj.stitchGroupId = stitch;
          obj.petType = 'D';

          obj.dupPetStudyDeviceId = ele.data.petStudyDeviceId;
          obj.dupExcludeFromDataExtract = ele.isExcludeDataExtract ? 1 : 0;

          duplicatePetArray.push(obj);
        });
      }

    });
    postObject['duplicatePetsList'] = duplicatePetArray;
    //return;
    this.spinner.show();
    this.petservice.saveDataStream('/api/duplicatePets/saveDataStream', postObject).subscribe(res => {
      if (res.status.success === true) {
        this.toastr.success('Data Stream added Successfully!');
        this.spinner.hide();
        this.tabservice.clearDataModel();
        this.router.navigate(['/user/duplicate-pets'], { queryParams: this.queryParams });
      }
      else {
        this.toastr.error(res.errors[0].message);
        this.spinner.hide();
      }
    }, err => {
      console.log(err);
      this.errorMsg(err);
    });
  }
  errorMsg(err) {
    if (err.status == 500) {
      this.toastr.error(err.error.message + ". " + "Please try after sometime or contact administrator.");
    }
    else {
      this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
    }
    this.spinner.hide();
  }
  removeFromStitch(index) {
    const streamFormArray: any = <FormArray>this.streamForm.get('arr')['controls'];
    const petStreamItem = streamFormArray[index];
    if (petStreamItem && petStreamItem.controls.length) {
      petStreamItem.controls.forEach(element => {
        let data = Object.assign({});
        data = element.value.data;
        data.checked = false;
        this.dataStreamArray.push(data);
      });
    }
    streamFormArray.splice(index, 1);

    if (streamFormArray.length == 0) {
      this.dataStreamArray.forEach(element => {
        element.checked = false;
      });
    }

    this.dataStreamArray = this.sortArrray(this.dataStreamArray);
  }

  sortArrray(array) {
    return array.sort((a, b) => (b.startDate - a.startDate));
  }
  dateRangeOverlaps(a_start, a_end, b_start, b_end) {
    if (a_start < b_start && b_start < a_end) return true; // b starts in a
    if (a_start < b_end && b_end < a_end) return true; // b ends in a
    if (b_start < a_start && a_end < b_end) return true; // a in b
    if (b_start == a_end || a_start == b_end) return true; // a in b
    return false;
  }

  excludeDataExtract(event, index, subIndex){
    if(event.target.checked){
        const form = this.streamForm.get('arr')['controls'][index];
        if(form){
          form['controls'][subIndex].get('startDate').setValue('');
          form['controls'][subIndex].get('endDate').setValue('');
        }
    }
  }


}
