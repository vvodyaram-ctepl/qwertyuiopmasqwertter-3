import {
  Component,
  OnInit,
  Input,
  ViewEncapsulation,
  Output,
  EventEmitter,
  forwardRef,
  ViewChild,
  ElementRef,
  HostListener,
  ContentChild,
  TemplateRef,
  ChangeDetectorRef,
  OnDestroy,
  OnChanges,
  AfterViewInit,
  Inject
} from '@angular/core';
import { Router } from '@angular/router';
import * as $ from 'jquery';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
// tslint:disable-next-line: nx-enforce-module-boundaries
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as moment from 'moment';

import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { DatatableService } from './datatable.service';
import { Subscription } from 'rxjs';
import { SortableListComponent } from './sortable-list/sortable-list.component';
import { Config } from './config';
import { environment } from '../../../../src/environments/environment';
import { ToastrService } from 'ngx-toastr';
import { NgbDropdownConfig } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { CustomDateFormatPipe } from 'src/app/pipes/custom-date-format.pipe';
import { LookupService } from 'src/app/services/util/lookup.service';
import { RolesService } from 'src/app/roles/components/roles.service';
import { UserDataService } from 'src/app/services/util/user-data.service';

const noop = () => { };

export const CUSTOM_INPUT_CONTROL_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => DatatableComponent),
  multi: true
};

@Component({
  selector: 'reports-datatable',
  templateUrl: './datatable.component.html',
  styleUrls: ['./datatable.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [CUSTOM_INPUT_CONTROL_VALUE_ACCESSOR, NgbDropdownConfig]
})
export class DatatableComponent
  implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  private onTouchedCallback: () => void = noop;
  private onChangeCallback: (_: any) => void = noop;
  query: string;//for filtering
  startDate: any;
  endDate: any;
  userId: any;
  filterType: string = '';
  filterValue: any;
  filterdrop: boolean;
  @Input() filterTypeArr: any;
  filterValArr: any;

  datatableData: any;
  base64Img: any = '';
  monitorLoader = false;
  exportDataExcel: any;
  exportDataPDF: any;
  options: any = {};
  @ContentChild(TemplateRef, { static: false }) templateRef;
  @ContentChild('tool', { static: false }) tool: TemplateRef<any>;
  mouseActive: any;
  @ViewChild('selectedElement', { static: false }) selectedElement: ElementRef;
  @ViewChild(SortableListComponent, { static: false })
  sortElement: SortableListComponent;
  public popoverPlacement = 'bottom';
  selectedRowEle: Number;
  setClickedRow: Function;
  checkedFinalList: any = [];
  preferencesDropdown: any;
  mainHeader: any;
  mainData: any;
  sortDirection: any;
  sortColumn: any;
  sortByColumn: any;
  pagination: any = {
    page: 1,
    totalElements: 10,
    noOfElements: 10
  };
  selectAll: any;
  private innerValue: any = '';
  @Input() sapLoader: boolean;
  @Input() placeholder: string;
  RoleTypeArr: any;
  RoleArr: any;
  feedbackfilterdrop: boolean;
  questionnairefilterdrop: boolean;
  deviceModelArr: any;
  deviceTypeArr: any;
  moduleArr: any;
  actionArr: any[];
  assetStatusArr: any;
  feedbackPageArr: any;
  categoryArr: any;
  petNameArr: any;
  petParentNameArr: any;
  trackerActivityArr: any;
  behaviorArr: any;
  assignedToListArr: any;
  ticketPrioritiesArr: any;
  supportStatusArr: any;
  sensorLocationsArr: any;
  studyList: any;
  petList: any;
  petParentList: any;
  reportGroupsArr: any;
  preludeStudyArr: any;
  preludeCategoryArr: any;
  campaignArr: any;
  preludeStudyId: any = '';
  preludeCategory: any = '';
  @Input() pageName: string = '';
  filterFlag: boolean = false;
  RWFlag: boolean = false;
  planArr: any;
  phoneModelArr: any;
  @Input() studyAll: boolean = false;
  petQuestionnaireArr: any;
  @Input() petQuesId: any;

  @Input() set rowsLimit(val: number) {
    this.pagination.noOfElements = val;
  };
  @Input() headers: any;
  @Input() ngModel: any;
  @Input() url: string;
  @Input() defaultColumn: string;
  @Input() dir: string;
  @Input() method: string;
  @Input() body: any;
  @Input() preferences: boolean;
  @Input() export: any;
  @Input() hideExport: any;
  @Input() showTopPagination: boolean;
  @Input() hideBottomPagination: boolean;
  @Input() limitSelection: any;
  @Input() noRecordMsg: any = 'No records found';
  @Input() monitorTable = false;
  @Input() landscape = true;

  @Output() preferenceChange = new EventEmitter();
  @Output() inlineUpdate = new EventEmitter();
  @Output() actions = new EventEmitter();
  @Output() staticAction = new EventEmitter();
  @Output() formatter = new EventEmitter();
  @Output() totalFormatter = new EventEmitter();
  @Output() nodeAction = new EventEmitter();
  @Input() selectable;
  @Input() title: string;
  @Output() popoverData = new EventEmitter();
  @Output() recordSelected = new EventEmitter();
  @Output() selectedRecords = new EventEmitter();
  @Input() hidetitle: boolean = true;
  @Input() hidetotalRecords: boolean;
  @Input() hidePdf: boolean;
  @Input() hideExcel: boolean;
  @Input() hidePrint: boolean;
  @Input() showExcelTemplate: Boolean = false;
  @Input() showBarCodeIcon: Boolean = false;
  @Output() barcodeAction = new EventEmitter();
  @Input() sortDisable = true;
  @Input() selectList: any = [];
  @Input() multiSelectText: any;
  @Input() multiSelectWidth: any;
  @Output() mutliSelectRecord = new EventEmitter();
  @Input() activeRow = false;
  @Input() selectSelectAll: boolean;
  @Input() isReport: boolean;
  @Input() exportTitle: any;
  @Input() fileName: any;
  @Input() reportFromDate: any;
  @Input() reportToDate: any;
  @Input() reportFontSize: any;
  @Input() reportHeaderOverflow: any;
  @Input() reportBodyOverflow: any;
  @Input() reportCellAlign: any;
  @Input() reportTestType: any;
  @Input() reportProtocol: any;
  datatableServiceCall: Subscription;
  @Input() set updateTable(value: any) {
    if (value) {
      this.loadResults();
    }
  };

  selectListData: any;
  editableRowNum: any;
  FilterFlag: boolean = false;//filtering
  @Output() searchAction = new EventEmitter();
  @Input() filterDropdown: boolean = true;
  @Input() searchFilter = false;
  @Input() reportName = '';

  public popoverContent: any;
  public timer: any;
  public randomNumber: number;

  constructor(
    private componentService: DatatableService,
    private userDataService: UserDataService,
    public router: Router,
    private ref: ChangeDetectorRef,
    private excelService: DatatableService,
    private toastr: ToastrService,
    private config: NgbDropdownConfig,
    private spinnerService: NgxSpinnerService,
    private lookupService: LookupService,
    private customDatePipe: CustomDateFormatPipe,
    private roleservice: RolesService
    //  @Inject('config') private config: Config,
  ) {
    // customize default values of dropdowns used by this component tree
    config.placement = 'top-left';
    config.autoClose = false;

    ref.detach();
    this.timer = setInterval(() => {
      this.ref.detectChanges();
    }, 500);
    //  console.log(config);


  }

  ngOnDestroy() {
    clearTimeout(this.timer);
    if(this.datatableServiceCall) this.datatableServiceCall.unsubscribe();
  }

  ngOnChanges() {
    if (this.selectSelectAll) {
      this.selectAll = true;
    }
    this.innerValue =
      this.pagination &&
      this.pagination.data &&
      this.pagination.data.filter(function (data) {
        return data.select;
      });
    this.ngModel = this.innerValue;
    this.onChangeCallback(this.innerValue);
  }
  afterResize() { }
  ngOnInit() {
    this.url = environment.baseUrl + this.url;
    //filter
    if (this.filterTypeArr) {
      this.filterTypeArr.forEach(flr => {
        if (flr.id === 'petQuestionnaire') {
          this.lookupService.getDeviceModel(`/api/lookup/getPetQuestionnaires/${this.petQuesId}`).subscribe(res => {
            console.log("res", res);
            this.petQuestionnaireArr = res.response.rows;
          },
            err => {
              this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
            }
          );
        }
        if (flr.id === 'deviceType' || flr.id === 'Model') {
          this.lookupService.getDeviceModel('/api/assets/getDeviceTypesAndModels').subscribe(res => {
            console.log("res", res);
            this.deviceModelArr = res.response.deviceModels;
            this.deviceTypeArr = res.response.deviceTypes;
          },
            err => {
              this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
            }
          );
        }
        if (flr.id === 'Menu') {
          let userProfileData = this.userDataService.getRoleDetails();
          console.log("userProfileData", userProfileData);
          let menuArr = [];
          menuArr = JSON.parse(JSON.stringify(userProfileData.rolePermissions));
          this.moduleArr = menuArr;
          if (this.pageName == 'Audit') {
            for (let i = 0; i < this.moduleArr.length; i++) {
              if (this.moduleArr[i] != undefined && (this.moduleArr[i].menuId == 30 || this.moduleArr[i].menuId == 31 || this.moduleArr[i].menuId == 32 || this.moduleArr[i].menuId == 27 || this.moduleArr[i].menuId == 16 || this.moduleArr[i].menuId == 22 || this.moduleArr[i].menuId == 25 || this.moduleArr[i].menuId == 9 || this.moduleArr[i].menuId == 18 || this.moduleArr[i].menuId == 33)) {
                this.moduleArr.splice(i, 1);
                --i;
              }
            }
          }
          if (this.pageName == 'Favorite') {
            for (let i = 0; i < this.moduleArr.length; i++) {
              if (this.moduleArr[i] != undefined &&
                (this.moduleArr[i].menuId == 29 || this.moduleArr[i].menuId == 30 || this.moduleArr[i].menuId == 31 || this.moduleArr[i].menuId == 32 || this.moduleArr[i].menuId == 12 || this.moduleArr[i].menuId == 13 || this.moduleArr[i].menuId == 27 || this.moduleArr[i].menuId == 16 || this.moduleArr[i].menuId == 20 || this.moduleArr[i].menuId == 19 || this.moduleArr[i].menuId == 22 || this.moduleArr[i].menuId == 25 || this.moduleArr[i].menuId == 9 || this.moduleArr[i].menuId == 18 || this.moduleArr[i].menuId == 1 || this.moduleArr[i].menuId == 33 || this.moduleArr[i].menuId == 35)) {
                this.moduleArr.splice(i, 1);
                --i;
              }
            }
          }
          // this.roleservice.getRoleDetails(`/api/lookup/getMenus`, '').subscribe(res => {
          //   console.log("res", res);
          //   this.moduleArr = res.response.menus;
          // },
          //   err => {
          //     this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
          //   }
          // );
        }
        if (flr.id === 'category') {
          this.lookupService.getFeedbackpageList(`/api/lookup/getCategoryNameTimer`).subscribe(res => {
            console.log("res", res);
            this.categoryArr = res.response.categoryList;
          },
            err => {
              this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
            }
          );
        }
        if (flr.id === 'petName') {
          this.lookupService.getFeedbackpageList(`/api/lookup/getPetNameTimer`).subscribe(res => {
            console.log("res", res);
            this.petNameArr = res.response.petNameList;
          },
            err => {
              this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
            }
          );
        }
        if (flr.id === 'petParentName') {
          this.lookupService.getFeedbackpageList(`/api/lookup/getPetParentNameTimer`).subscribe(res => {
            console.log("res", res);
            this.petParentNameArr = res.response.petParentNameList;
          },
            err => {
              this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
            }
          );
        }
        if (flr.id === 'feedbackPage') {
          this.lookupService.getFeedbackpageList(`/api/lookup/getMobileAppFeedbackPages`).subscribe(res => {
            console.log("res", res);
            // this.filterValue = "";
            this.feedbackPageArr = res.response.mobileAppFeedbackPages;
          },
            err => {
              this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
            }
          );
        }

        if (flr.id === 'RoleType') {
          this.lookupService.getRoleTypes('/api/lookup/getRoleTypes').subscribe(res => {
            console.log("res", res);
            // this.filterValue = "";
            this.RoleTypeArr = res.response.roleTypes;
          },
            err => {
              this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
            }
          );
        }

        if (flr.id === 'trackerActivity') {

          this.lookupService.getTrackerActivity('/api/lookup/getPointTrackerActivities/').subscribe(res => {
            console.log("res", res);
            // this.filterValue = "";
            this.trackerActivityArr = res.response.pointTrackerActivities;
          },
            err => {
              this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
            }
          );
        }
        if (flr.id === 'phoneModel') {

          this.lookupService.getTrackerActivity('/api/lookup/getMobileAppPhoneModels').subscribe(res => {
            console.log("res", res);
            // this.filterValue = "";
            this.phoneModelArr = res.response.mobileAppFBPhoneModel;
          },
            err => {
              this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
            }
          );
        }
        if (flr.id === 'assignedTo') {
          this.lookupService.getCommon('/api/lookup/getUsers').subscribe(res => {
            if (res.status.success === true) {
              //permission for the module
              let userProfileData = this.userDataService.getRoleDetails();
              console.log("userProfileData", userProfileData);
              let menuActionId = '';
              userProfileData.rolePermissions && userProfileData.rolePermissions.forEach(ele => {
                if (ele.menuId == "37") {
                  console.log("text" + ele.menuId);
                  menuActionId = ele.menuActionId;
                }
              });
              if (menuActionId == "4") {
                this.RWFlag = true;
              }

              let userId = this.userDataService.getUserId();
              if (!this.RWFlag) {
                this.assignedToListArr = res.response.assignedUserList && res.response.assignedUserList.filter(item => item.userId == userId);
              }
              else {
                this.assignedToListArr = res.response.assignedUserList;
              }
            } else {
              this.toastr.error(res.errors[0].message);
            }
          }, err => {
            this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
          });
        }
        //SensorLocation
        if (flr.id === 'location') {
          this.lookupService.getCommon(`/api/lookup/getSensorLocation`).subscribe(res => {
            if (res.status.success === true) {
              this.sensorLocationsArr = res.response.sensorLocationList;
              this.sensorLocationsArr && this.sensorLocationsArr.forEach(ele => {
                if (ele.storageLocationName == "Other Storage Location") {
                  let index = this.sensorLocationsArr.indexOf(ele);
                  this.sensorLocationsArr.splice(index, 1);
                }
              })
            }
            else {
              this.toastr.error(res.errors[0].message);
            }
          }, err => {
            this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
          });
        }
        if (flr.id === 'Plan') {
          this.lookupService.getCommon(`/api/plans/getPlans`).subscribe(res => {
            if (res.status.success === true) {
              this.planArr = res.response.rows;
            }
            else {
              this.toastr.error(res.errors[0].message);
            }
          }, err => {
            this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
          });
        }
        if (flr.id === 'ticketPriority') {
          this.lookupService.getCommon('/api/lookup/getTicketPriorities').subscribe(res => {
            if (res.status.success === true) {
              this.ticketPrioritiesArr = res.response.ticketPriorities;
            }
            else {
              this.toastr.error(res.errors[0].message);
            }
          }, err => {
            this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
          });
        }
        if (flr.id === 'behavior') {

          this.lookupService.getTrackerActivity('/api/lookup/getPointTrackerMetrics').subscribe(res => {
            console.log("res", res);
            // this.filterValue = "";
            this.behaviorArr = res.response.pointTrackerMetrics;
          },
            err => {
              this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
            }
          );
        }

        if (flr.id === 'Role') {
          this.lookupService.getRole('/api/lookup/getRoles').subscribe(res => {
            console.log("res", res);
            // this.filterValue = "";
            this.RoleArr = res.response.roles;
          },
            err => {
              this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
            }
          )
        }
        if (flr.id === 'assetStatus') {
          this.lookupService.getRole('/api/lookup/getDeviceStatuses').subscribe(res => {
            console.log("res", res);
            // this.filterValue = "";
            this.assetStatusArr = res.response.deviceStatuses;
          },
            err => {
              this.toastr.error('Something went wrong. Please try after sometime or contact administrator.');
            }
          )
        }
        if (flr.id === 'Study') {
          if (this.studyAll) {
            this.lookupService.getCommon('/api/study/getAllStudyList').subscribe(res => {
              if (res.status.success === true) {
                this.studyList = res.response.studyList;
              } else {
                this.toastr.error(res.errors[0].message);
              }
            }, err => {
              this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
            });
          }
          else {
            this.lookupService.getCommon('/api/study/getStudyList').subscribe(res => {
              if (res.status.success === true) {
                this.studyList = res.response.studyList;
              } else {
                this.toastr.error(res.errors[0].message);
              }
            }, err => {
              this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
            });
          }
        }
        if (flr.id === 'supportStatus') {
          this.lookupService.getCommon('/api/lookup/getStatus').subscribe(res => {
            if (res.status.success === true) {
              this.supportStatusArr = res.response.statusList;
            } else {
              this.toastr.error(res.errors[0].message);
            }
          }, err => {
            this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
          });
        }
        if (flr.id === 'Action') {
          this.actionArr = ["Added", "Updated", "Deleted"];
        }
        if (flr.id === 'reportGroup') {
          this.lookupService.getCommon('/api/analyticalReports/getReportGroups').subscribe(res => {
            if (res.status.success === true) {
              this.reportGroupsArr = res.response.analyticalReportGroupList;
            } else {
              this.toastr.error(res.errors[0].message);
            }
          }, err => {
            this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
          });
        }
        if (flr.id === 'preludeStudy') {
          this.lookupService.getCommon('/api/lookup/getPreludeStudyName').subscribe(res => {
            if (res.status.success === true) {
              this.preludeStudyArr = res.response.preludeStudyList;
              this.preludeStudyId = this.preludeStudyArr[0].studyId;
              this.loadResults();
            } else {
              this.toastr.error(res.errors[0].message);
            }
          }, err => {
            this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
          });
        }
        if (flr.id === 'preludeCategory') {
          this.lookupService.getCommon('/api/lookup/getExtractFileCategory').subscribe(res => {
            if (res.status.success === true) {
              this.preludeCategoryArr = res.response.extractFileCategoryList;
            } else {
              this.toastr.error(res.errors[0].message);
            }
          }, err => {
            this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
          });
        }
        if (flr.id === 'campaign') {
          this.lookupService.getCommon('/api/lookup/getCampaignList').subscribe(res => {
            if (res.status.success === true) {
              this.campaignArr = res.response.campaigns;
            } else {
              this.toastr.error(res.errors[0].message);
            }
          }, err => {
            this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
          });
        }
        if (flr.id === 'pet') {
          this.lookupService.getCommon('/api/pets/getPointsAccumulatedPets').subscribe(res => {
            if (res.status.success === true) {
              this.petList = res.response.pets;
            } else {
              this.toastr.error(res.errors[0].message);
            }
          }, err => {
            this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
          });
        }
        if (flr.id === 'petParent') {
          this.lookupService.getCommon('/api/petParents/getPetParents').subscribe(res => {
            if (res.status.success === true) {
              this.petParentList = res.response.petParentList;
            } else {
              this.toastr.error(res.errors[0].message);
            }
          }, err => {
            this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
          });
        }
      })
    }


    this.options = {
      disabled: this.sortDisable,
      onUpdate: (event: any) => {
      }
    };
    this.randomNumber = Math.random();
    this.preferencesDropdown = [];
    this.headers.forEach(ele => {
      if (ele.label && ele.label !== 'Options') {
        this.preferencesDropdown.push(ele);
      }
    });
    
    this.loadResults();
  }
  ngAfterViewInit() { }
  autoFocusSelect($event, clickedType?: string) {
    if (clickedType == 'iconClicked')
      $('.make-active').addClass('inline-active');
    else
      $($event.currentTarget).addClass('inline-active');
    setTimeout(() => {
      // tslint:disable-next-line: no-unused-expression
      this.selectedElement && this.selectedElement.nativeElement.focus();
    }, 500);
  }
  sortChange($event) {
    this.headers = $event;
    this.preferenceChange.emit($event);
  }
  loadHeaders() {
    // tslint:disable-next-line: no-unused-expression
    this.headers &&
      this.headers.forEach((element, i) => {
        element.id = i;
      });

  }
  checkedHeaders() {
    const checkedList = this.headers.filter(function (ele) {
      return ele.checked;
    });
    return checkedList;
  }
  startdateSelect() {
    console.log("sdsdsd");
    if (moment(this.endDate) < moment(this.startDate)) {
      this.endDate = "";
    }
  }
  loadResults() {
    if (this.filterType == 'dateType' || this.filterType == 'questionnaireDate') {
      if (this.endDate === '' || this.startDate === '') {
        this.toastr.error("Please select from and to dates.");
        return false;
      }
    }
    if (this.monitorTable) {
      this.monitorLoader = true;
    } else {
      this.spinnerService.show();
      /* if (this.sapLoader) {
        this.sapSpinner.show();
      } else {
        this.spinnerService.show();
      } */
    }
    var startIndex =
      this.pagination.page === 1
        ? 0
        : this.pagination.page * this.pagination.noOfElements -
        this.pagination.noOfElements;
    this.pagination.noOfElements = this.pagination.noOfElements
      ? this.pagination.noOfElements
      : 5;

    var data: any = {
      startIndex: startIndex,
      endIndex: this.pagination.totalItems
        ? this.pagination.totalItems <
          Number(startIndex) + Number(this.pagination.noOfElements)
          ? this.pagination.totalItems
          : Number(startIndex) + Number(this.pagination.noOfElements)
        : Number(startIndex) + Number(this.pagination.noOfElements),
      limit: this.pagination.noOfElements,
      sortByColumn: this.sortByColumn ? this.sortByColumn : this.defaultColumn,
      sortDirection: this.sortDirection ? this.sortDirection : this.dir,
      searchText: this.query ? encodeURIComponent(this.query.trim()) : '',
      filterType: this.filterType ? this.filterType : '',
      filterValue: this.filterValue ? this.filterValue : '',
      startDate: this.startDate ? this.customDatePipe.transform(this.startDate, 'yyyy-MM-dd') : '',
      endDate: this.endDate ? this.customDatePipe.transform(this.endDate, 'yyyy-MM-dd') : ''
    };
    console.log("searchText", data.searchText);
    $('.page-wrapper').scrollTop(0);
    if (data.startDate || data.endDate || data.searchText || data.filterValue) {
      this.filterFlag = true;
    }
    else {
      this.filterFlag = false;
    }
    if (this.filterType == "assignedTo") {
      console.log("this.filterValue.userName", this.filterValue.userName);
      data.filterValue = this.filterValue ? this.filterValue.userName : '';
    }
    if (this.filterType == "petQuestionnaire") {
      console.log("this.filterValue.questionnaireId", this.filterValue.questionnaireId);
      data.filterValue = this.filterValue ? this.filterValue.questionnaireId : '';
    }
    if (this.filterType == "Study") {
      data.filterValue = this.filterValue ? this.filterValue.studyName : '';
    }
    if (this.filterType == "pet") {
      data.filterValue = this.filterValue ? this.filterValue.petName : '';
    }
    if (this.filterType == "petParent") {
      data.filterValue = this.filterValue ? this.filterValue.petParentName : '';
    }
    if (this.filterType == "Plan") {
      data.filterValue = this.filterValue ? this.filterValue.planName : '';
    }
    if (this.pageName == "preludeReport") {
      console.log(data);
      data.preludeStudyId = this.preludeStudyId;
      if (this.preludeCategory) {
        data.filterType = 'category';
        data.filterValue = this.preludeCategory;
      }
      this.filterFlag = true;
    }
    if (this.reportName == 'Pet Parent Report') {
      console.log(this.filterValue)
      data.filterValue = this.filterValue ? this.filterValue.petParentId : '';
      this.filterFlag = false;
    }
    
    console.log(data);
    this.setClickedRow = function (index) {
      if (this.activeRow === true) {
        this.selectedRowEle = index;
      }
    };
    this.datatableServiceCall = this.componentService
      .getDataTableData(this.url, data, this.method, this.body)
      .subscribe(
        // tslint:disable-next-line: no-shadowed-variable
        (data: any) => {
          console.log("sdsdsds", data);
          // if (data.status.success === true) {
          if (Object.keys(data).length && data.response && data.response.rows) {
            this.pagination.totalElements = data.response.totalElements;
            this.pagination.searchElments = data.response.searchElments;
            this.pagination.data = Array.isArray(data.response.rows)
              ? data.response.rows
              : [data.response.rows];
            this.pagination.data.forEach((ele, index) => {
              ele["rnum"] = startIndex + index + 1;
            });
            this.pagination.otherFields = JSON.parse(
              JSON.stringify(data.response)
            );
            delete this.pagination.otherFields.rows;
            const staticFields = {};
            const options = {};
            const customTemplate = {};
            const editableFields = {};
            this.headers.map(ele => {
              if (ele.static && !ele.clickable) {
                ele.width = ele.width ? ele.width : 55;
                staticFields[ele.key] = ele.static;
                staticFields['staticControls'] =
                  ele.controls && JSON.parse(JSON.stringify(ele.controls));
                staticFields['showAll'] = ele.showAll;
              }
              if (ele.clickable) {
                ele.static = ele.key;
              }
              if (ele.editable && ele.editableType === 'select') {
                options[ele.key] = ele.editableSchema;
              }
              if (ele.customTemplate) {
                customTemplate[ele.key] = ele.jsonKeys;
              }

              if (ele.editable) {
                this.pagination.data.forEach(ele1 => {
                  if (!ele1.hasOwnProperty(ele.key)) {
                    ele1[ele.key] = '';
                  }
                });
                editableFields[ele.key] = JSON.parse(
                  JSON.stringify({
                    editable: ele.editable,
                    editableType: ele.editableType,
                    defaultInline: ele.defaultInline,
                    inlineText: ele.inlineText
                  })
                );
              }
            });

            const selectedRows = this.checkedFinalList.map(ele => {
              return ele.rnum || ele.RNUM;
            });
            this.pagination.data.forEach(ele => {
              if (
                (ele.rnum && selectedRows.indexOf(ele.rnum) !== -1) ||
                (ele.RNUM && selectedRows.indexOf(ele.RNUM) !== -1)
              ) {
                ele.select = true;
              }
              ele.inlineSelectOptions = {};
              ele.editableIcon = {};

              // tslint:disable-next-line: forin
              for (const i in options) {
                ele.inlineSelectOptions[i] = options[i];
              }
              ele.customTemplateJson = {};

              for (const i in customTemplate) {
                if (ele.hasOwnProperty(i)) {
                  customTemplate[i].forEach(tem => {
                    if (!ele.customTemplateJson[i]) {
                      ele.customTemplateJson[i] = {};
                    }
                    ele.customTemplateJson[i][tem] = {};
                  });
                }
              }
              ele.inlineEdit = {};
              for (const i in editableFields) {
                if (ele.hasOwnProperty(i)) {
                  ele.inlineEdit[i] = JSON.parse(
                    JSON.stringify(editableFields[i])
                  );
                }
              }
              ele.columnStyle = {};
              ele.columnTitle = {};
              ele.columnCssClass = {};
              ele.disabledColumn = {};
              ele = $.extend(ele, JSON.parse(JSON.stringify(staticFields)));
            });
            this.mainData = JSON.parse(JSON.stringify(data.response.rows));
            this.innerValue = this.pagination.data.filter(innerValue => {
              return innerValue.select;
            });
            this.ngModel = this.innerValue;
            this.onChangeCallback(this.innerValue);
            this.selectedRecords.emit(this.checkedFinalList);
          } else {
            this.pagination.data = [];
          }
          setTimeout(() => {
            if (this.monitorTable) {
              this.monitorLoader = false;
            } else {
              this.spinnerService.hide();
              /*  if (this.sapLoader) {
                this.sapSpinner.hide();
              } else {
                this.spinnerService.hide();
              } */
            }
          }, 500);
          this.formatter.emit(this.pagination.data);
          this.totalFormatter.emit(this.pagination);
          // }
          // else {
          //   this.toastr.error(data.errors[0].message);
          // }
        },
        error => {
          // this.toastr.error(error.error.errors[0] ?.message || 'Something went wrong. Please try after sometime or contact administrator.');
          setTimeout(() => {
            if (this.monitorTable) {
              this.monitorLoader = false;
            } else {
              this.spinnerService.hide();
              /*   if (this.sapLoader) {
                this.sapSpinner.hide();
              } else {
                this.spinnerService.hide();
              } */
            }
          }, 500);
        }
      );
  }
  openTooltip(myTip) {
    $('.tooltip').hide();
    setTimeout(function () {
      $('#' + myTip._ngbTooltipWindowId).show();
      // myTip.open();
    }, 10);
  }
  @HostListener('document:click', ['$event'])
  clickout(event) {
    if (!$(event.target).closest('.tooltip')[0]) {
      $('.tooltip').hide();
    }
    if (
      !$(event.target).closest('.sortable-datatable-list')[0] &&
      this.preferences
    ) {
      if (this.sortElement) this.sortElement.close();
      //$(".sortable-datatable-list").find(".dropdown-menu.show").removeClass("show");
    }
  }
  @HostListener('mousedown', ['$event'])
  mouseDown(event) {
    this.mouseActive = event.target;
  }
  @HostListener('mousemove', ['$event'])
  mouseMove(event) { }
  pageChanged() {
    this.selectAll = false;
    this.loadResults();
  }
  changeMaxSize() {
    this.pagination.page = 1;
    this.loadResults();
  }
  sortColumnData(column) {
    if (column.key !== this.sortByColumn && !column.dir) {
      this.headers.forEach(element => {
        element.dir = false;
      });
      this.sortDirection = 'DESC';
      // this.sortDirection = 'ASC';
    } else {
      this.sortDirection = column.dir ? 'ASC' : 'DESC';
    }
    column.dir = !column.dir;

    this.sortByColumn = column.key;
    this.pagination.page = 1;
    this.loadResults();
  }
  getColor(type, label, schema) {
    if (type === 'button') {
      let clr;
      schema.forEach(element => {
        if (element.key === label) {
          clr = element.color;
        }
      });
      return clr;
    }
  }
  getSanitizeText(text) {
    if (text) {
      const div = document.createElement('div');
      div.innerHTML = text;
      return div.textContent;
    }
  }
  isArray(data) {
    return Array.isArray(data);
  }
  getParams(item, header) {
    const params = header.linkParam.split(',');
    const str = {};
    params.forEach(element => {
      str[element] = item[element.trim()];
    });
    if (header.concatObj) {
      return $.extend(str, header.concatObj);
    } else {
      return str;
    }
  }
  editColumn($event /*, header, item*/) {
    // header.contentEditable = true;
    /* if (header.editableType == "select") {
       let select = document.createElement("select");
       for (let i = 0; i < header.editableSchema.length; i++) {
         let option = document.createElement("option");
         option.value = header.editableSchema[i].id;
         option.textContent = header.editableSchema[i].name;
         select.appendChild(option);
       }
       select.addEventListener("change", function () {
         let selected = header.editableSchema[<any>this.value-1];
         item[header.key] = selected.name;
       });
 
       $($event.currentTarget).parent().append(select);
     }*/
  }
  onSelectChange($event, item, schema, key, index, headerIndex, type) {
    this.inlineUpdate.emit({
      value: item,
      selected: schema[$event.currentTarget.selectedIndex],
      type: type,
      key: key,
      event: function (data) {
        if (data) {
          $('td.inline-active').removeClass('inline-active');
          item.contentEditable = false;
          this.mainData[index][key] = item[key];
        } else {
          item[key] = this.mainData[index][key];
          this.headers = Object.assign([], this.mainHeader);
          item.contentEditable = false;
        }
      }.bind(this)
    });
  }
  onContentBlur(item, key?) {
    $('td.inline-active').removeClass('inline-active');
    item.contentEditable = false;
  }
  setPropertyValues($event, item, key, model, schema, type, index) {
    if ($($event.target).prop('checked')) {
      item[key] = schema[0];
    } else {
      item[key] = schema[1];
    }
    const oldData = JSON.parse(JSON.stringify(this.mainData[index]));

    this.inlineUpdate.emit({
      value: item,
      selected: item[key],
      oldData: oldData,
      type: type,
      key: key,
      event: function (data) {
        if (data) {
          item.contentEditable = false;
        } else {
          item.contentEditable = false;
        }
      }.bind(this)
    });
    /*if ($($event.target).prop("checked")) {
      item[key] = schema[0];
    } else {
      item[key] = schema[1];
    }*/
    // item[key] = model ? schema[0] : schema[1];
  }
  getArray(str) {
    // console.log(str);
    return str && str.toString().split(',');
  }
  onInputBlur($event, item, schema, key, index, headerIndex, type) {
    item.contentEditable = false;
    const oldData = JSON.parse(JSON.stringify(this.mainData[index]));
    this.inlineUpdate.emit({
      value: item,
      selected: item[key],
      oldData: oldData,
      type: type,
      key: key,
      event: function (data) {
        if (data) {
          item.contentEditable = false;
        } else {
          item.contentEditable = false;
        }
      }.bind(this)
    });
  }
  checkAll() {
    const selectedRows = this.checkedFinalList.map(ele => {
      return ele.rnum || ele.RNUM;
    });
    if (this.selectAll) {
      this.pagination.data.forEach(element => {
        if (!element.disabled) {
          element.select = true;
        }
        if (
          ((element.rnum && selectedRows.indexOf(element.rnum) === -1) ||
            (element.RNUM && selectedRows.indexOf(element.RNUM) === -1)) &&
          !element.disabled
        ) {
          this.checkedFinalList.push(element);
        }
      });
    } else {
      this.pagination.data.forEach(element => {
        element.select = false;

        let ind: any = '';
        this.checkedFinalList.forEach((ele, index) => {
          if (
            (ele.rnum && ele.rnum === element.rnum) ||
            (ele.RNUM && ele.RNUM === element.RNUM)
          ) {
            ind = index;
          }
        });
        this.checkedFinalList.splice(ind, 1);
      });
    }
    this.innerValue = this.pagination.data.filter(function (data) {
      return data.select;
    });
    this.ngModel = this.innerValue;
    this.onChangeCallback(this.innerValue);
    this.recordSelected.emit(this.ngModel);
    this.selectedRecords.emit(this.checkedFinalList);
  }
  checkOne(one) {
    if (this.selectable.type !== 'radio') {
      if (one.select) {
        this.checkedFinalList.push(one);
      } else {
        let ind: any = '';
        this.checkedFinalList.forEach((ele, index) => {
          //   if (ele.rnum == one.rnum || ele.RNUM == one.RNUM) {
          if (
            (ele.rnum && ele.rnum === one.rnum) ||
            (ele.RNUM && ele.RNUM === one.RNUM)
          ) {
            ind = index;
          }
          if (
            (ele.selectListData && ele.selectListData === one.selectListData) ||
            (ele.selectListData && ele.selectListData === one.selectListData)
          ) {
            one.selectListData = [];
          }
        });
        this.checkedFinalList.splice(ind, 1);
      }
      if (!one.select) {
        this.selectAll = false;
      }
      this.innerValue = this.pagination.data.filter(function (data) {
        return data.select;
      });

      this.ngModel = this.innerValue;
      this.onChangeCallback(this.innerValue);
      this.recordSelected.emit(one);
      this.selectedRecords.emit(this.checkedFinalList);

      const checked =
        this.pagination.data
          .map(ele => {
            return ele.select === true;
          })
          .indexOf(false) === -1;
      this.selectAll = checked;
    } else {
      this.ngModel = [one];
      this.onChangeCallback([one]);
      this.recordSelected.emit([one]);
      this.selectedRecords.emit([one]);
    }
  }

  changeMulti($event) {
    this.mutliSelectRecord.emit($event);
  }

  selected($event) {
  }
  unCheckAll() {
    this.pagination.data.forEach(ele => {
      ele.select = false;
    });
    this.checkedFinalList = [];
  }

  loadPopover($event, item, key) {
    if (
      $event.clientX < window.innerWidth / 2 &&
      $event.clientY < window.innerHeight / 2
    ) {
      this.popoverPlacement = 'bottom-left';
    }
    if (
      $event.clientX < window.innerWidth / 2 &&
      $event.clientY > window.innerHeight / 2
    ) {
      this.popoverPlacement = 'top-left';
    }
    if (
      $event.clientX > window.innerWidth / 2 &&
      $event.clientY > window.innerHeight / 2
    ) {
      this.popoverPlacement = 'top-right';
    }
    if (
      $event.clientX > window.innerWidth / 2 &&
      $event.clientY < window.innerHeight / 2
    ) {
      this.popoverPlacement = 'bottom-right';
    }
    this.popoverContent = null;
    this.popoverData.emit({
      row: item,
      key: key,
      popoverText: $event.target.textContent.trim(),
      content: content => {
        this.popoverContent = content;
      },
      event: $event
    });
  }

  //get accessor
  get value(): any {
    return this.innerValue;
  }

  //set accessor including call the onchange callback
  set value(v: any) {
    if (v !== this.innerValue) {
      this.innerValue = v;
      this.onChangeCallback(v);
    }
  }

  //Set touched on blur
  onBlur() {
    this.onTouchedCallback();
  }

  //From ControlValueAccessor interface
  writeValue(value: any) {
    if (value !== this.innerValue) {
      this.innerValue = value;
    }
  }

  //From ControlValueAccessor interface
  registerOnChange(fn: any) {
    this.onChangeCallback = fn;
  }

  //From ControlValueAccessor interface
  registerOnTouched(fn: any) {
    this.onTouchedCallback = fn;
  }
  onControl($event, name, item) {
    this.actions.emit({ event: $event, item: name, value: item });
  }
  staticClick($event) {
    this.staticAction.emit($event);
  }
  getNode(item, $event, header) {
    this.nodeAction.emit({ item: item, event: $event, header });
  }
  openPopup(link) {
    //window.open(link, 'MyWindow', "width=700,height=600")
    window.open(
      link,
      '0',
      'toolbar=0,scrollbars=1,location=0,statusbar=0,menubar=0,resizable=0,width=800,height=600'
    );
  }
  //Searching
  searchText(query) {
    if (query == undefined) {
      this.query = "";
    }
    this.searchAction.emit({ query: this.query.trim() });
    this.pagination.page = 1;
    this.loadResults();

  }
  reset() {
    this.query = '';
    this.filterType = '';
    this.filterValue = '';
    this.startDate = '';
    this.endDate = '';
    this.FilterFlag = false;
    this.pagination.page = 1;
    this.pagination.noOfElements = 10;
    if (this.pageName == 'preludeReport') {
      this.preludeStudyId = this.preludeStudyArr[0].studyId;
      this.preludeCategory = '';
    }
    this.loadResults();
  }

  changedInput($event) {
    console.log("You entered: ", $event.target.value);
    this.pagination.page = 1;
    this.loadResults();
  }
  // export logic

  async generatePDF(flag) {

    var data = {
      startIndex: 0,
      endIndex: this.pagination.totalElements,
      limit: this.pagination.totalElements,
      sortByColumn: this.sortByColumn ? this.sortByColumn : this.defaultColumn,
      sortDirection: this.sortDirection ? this.sortDirection : this.dir,
      searchText: this.query ? encodeURIComponent(this.query.trim()) : '',
      filterType: this.filterType ? this.filterType : '',
      filterValue: this.filterValue ? this.filterValue : '',
      startDate: this.startDate ? this.customDatePipe.transform(this.startDate, 'yyyy-MM-dd') : '',
      endDate: this.endDate ? this.customDatePipe.transform(this.endDate, 'yyyy-MM-dd') : ''
    };

    if (this.filterType == "assignedTo") {
      console.log("this.filterValue.userName", this.filterValue.userName);
      data.filterValue = this.filterValue ? this.filterValue.userName : '';
    }
    if (this.filterType == "petQuestionnaire") {
      console.log("this.filterValue.questionnaireId", this.filterValue.questionnaireId);
      data.filterValue = this.filterValue ? this.filterValue.questionnaireId : '';
    }
    if (this.filterType == "Study") {
      data.filterValue = this.filterValue ? this.filterValue.studyName : '';
    }
    if (this.filterType == "pet") {
      data.filterValue = this.filterValue ? this.filterValue.petName : '';
    }
    if (this.filterType == "petParent") {
      data.filterValue = this.filterValue ? this.filterValue.petParentName : '';
    }
    if (this.filterType == "Plan") {
      data.filterValue = this.filterValue ? this.filterValue.planName : '';
    }
    if(this.filterType == "" && this.reportName == 'Pet Parent Report'){
      data.filterValue = this.filterValue ? this.filterValue.petParentId : '';
    }

    let data1: any = await this.componentService
      .getDataTableData(this.url, data, this.method, this.body)
      .toPromise();
    this.exportDataPDF = Array.isArray(data1.response.rows)
      ? data1.response.rows
      : [data1.response.rows];
    this.imgToBase64(
      'assets/images/wearables-pdf.jpg',
      base64 => {
        this.base64Img = base64;
        this.generate(flag);
      }
    );
  }

  getColumns() {
    const headers = [];
    this.headers.filter(ele => {
      if ((ele.checked && ele.label !== 'Options' && !ele.hideReportColumn) || ele.addReportColumn) {
        headers.push({ header: ele.label, dataKey: ele.key, format: ele.format });
      }
    });
    return headers;
  }

  getReportColumns() {
    const headers = [];
    this.headers.filter(ele => {
      if (
        (ele.checked || ele.addReportColumn) &&
        ele.label !== 'Options' &&
        !ele.hideReportColumn
      ) {
        headers.push(ele.label);
      }
    });
    return [headers];
  }

  getColumnsWidth() {
    const columnStyles: any = {};
    let i = 0;
    this.headers.filter(ele => {
      if (
        (ele.checked || ele.addReportColumn) &&
        ele.label !== 'Options' &&
        !ele.hideReportColumn
      ) {
        if (ele.cellWidth) {
          columnStyles[i] = { cellWidth: ele.cellWidth };
        }
        ++i;
      }
    });
    return columnStyles;
  }

  getReportData() {
    const arr = [];
    this.exportDataPDF.forEach(ele => {
      const obj = [];
      this.headers.filter(ele1 => {
        if (
          (ele1.checked || ele1.addReportColumn) &&
          ele1.label !== 'Options' &&
          !ele1.hideReportColumn
        ) {
          if (ele1.format)
            obj.push(this.customDatePipe.transform(ele[ele1.key], ele1.format));
          else
            obj.push(ele[ele1.key]);
        }
      });
      arr.push(obj);
    });
    return arr;
  }

  getData() {
    const arr = [];
    this.exportDataPDF.forEach(ele => {
      const obj = {};
      this.getColumns().forEach(ele1 => {
        obj[ele1.dataKey] = ele[ele1.dataKey];
      });
      arr.push(obj);
    });
    return arr;
  }

  imgToBase64(url, callback) {
    if (!window['FileReader']) {
      callback(null);
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = function () {
      const reader: any = new FileReader();
      reader.onloadend = function () {
        callback(reader.result.replace('text/xml', 'image/jpg'));
      };
      reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', url);
    xhr.send();
  }

  generate(flag) {
    let doc: any;
    if (this.landscape) {
      doc = new jsPDF('landscape');
    } else {
      doc = new jsPDF();
    }
    const totalPagesExp = '{total_pages_count_string}';
    let title = this.exportTitle;
    let fileName = this.fileName;

    if(this.reportName == 'Pet Parent Report'){
      fileName = this.filterValue ? (this.fileName + ' : ' +this.filterValue.petParentName) : this.fileName;
      title = this.filterValue ? (this.fileName + ' : ' +this.filterValue.petParentName) : this.exportTitle;
    }

    const pageContent = data => {
      // HEADER
      doc.setFontSize(10);
      doc.setTextColor(40);
      // doc.setFontStyle('normal');
      doc.setFont(undefined, undefined, 'normal');
      if (this.base64Img) {
        doc.addImage(
          this.base64Img,
          'JPG',
          data.settings.margin.left,
          15,
          32,
          10,
          191,
          54
        );
      }
      // doc.setFontStyle('bold');
      doc.setFont(undefined, undefined, 'bold');
      doc.text(title ? title : 'Title', data.settings.margin.left + 125, 20);

      if (this.reportFromDate && this.reportToDate) {
        // doc.setFontStyle('bold');
        doc.setFont(undefined, undefined, 'bold');
        doc.setFontSize(7);
        doc.text(
          this.reportFromDate + ' to ' + this.reportToDate,
          data.settings.margin.left + 75,
          25
        );
      }
      // FOOTER
      let str = 'Page ' + data.pageCount;
      //Total page number plugin only available in jspdf v1.0+
      if (typeof doc.putTotalPages === 'function') {
        str = str + ' of ' + totalPagesExp;
      }
      // doc.setFontStyle('normal');
      doc.setFont(undefined, undefined, 'normal');
      doc.setFontSize(7);
      const footerText = `This document is the property of Hill’s Pet Nutrition. All information and know-how herein is confidential and cannot be used, reproduced, or revealed without the express written`;
      const footerText1 = ` permission of Hill’s Pet Nutrition`;
      const date = new Date().toDateString() //moment().format('DD-MMM-YYYY hh:mm A');
      doc.text(
        footerText,
        data.settings.margin.left,
        doc.internal.pageSize.height - 15
      );
      doc.text(
        footerText1,
        data.settings.margin.left,
        doc.internal.pageSize.height - 10
      );
      doc.text(
        date,
        data.settings.margin.left,
        doc.internal.pageSize.height - 5
      );
      doc.text(
        str,
        data.settings.margin.left + 185,
        doc.internal.pageSize.height - 5
      );
      //doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
      // console.log(data.settings);
      // doc.text(moment().format('DD-MMM-YYYY hh:mm A'), data.settings.margin.right, doc.internal.pageSize.height - 10);
    };

    const headerFontSize = this.reportFontSize ? this.reportFontSize : 7;
    const bodyFontSize = this.reportFontSize ? this.reportFontSize : 8;
    const reportHeaderOverflow = this.reportHeaderOverflow
      ? this.reportHeaderOverflow
      : 'visible';
    const reportBodyOverflow = this.reportBodyOverflow
      ? this.reportBodyOverflow
      : 'linebreak';
    const reportCellAlign = this.reportCellAlign
      ? this.reportCellAlign
      : 'center';

    doc.autoTable({
      head: this.getReportColumns(),
      body: this.getReportData(),
      styles: { overflow: 'linebreak' },
      // padding: {right: 0, left: 2},
      didDrawPage: pageContent,
      margin: {
        top: 30,
        left: 5,
        right: 5,
        bottom: 25
      },
      headStyles: {
        fontSize: headerFontSize,
        halign: reportCellAlign,
        overflow: reportHeaderOverflow
      },
      bodyStyles: {
        fontSize: bodyFontSize,
        halign: reportCellAlign,
        overflow: reportBodyOverflow
      },
      columnStyles: this.getColumnsWidth(),
      tableWidth: 'auto'
    });

    // Total page number plugin only available in jspdf v1.0+
    if (typeof doc.putTotalPages === 'function') {
      doc.putTotalPages(totalPagesExp);
    }
    if (flag === 'print') {
      doc.output('dataurlnewwindow');
    } else {
      doc.save(fileName ? fileName : 'Sample' + '.pdf');
    }
  }

  async exportAsXLSX() {
    var data = {
      startIndex: 0,
      endIndex: this.pagination.totalElements,
      limit: this.pagination.totalElements,
      sortByColumn: this.sortByColumn ? this.sortByColumn : this.defaultColumn,
      sortDirection: this.sortDirection ? this.sortDirection : this.dir,
      searchText: this.query ? encodeURIComponent(this.query.trim()) : '',
      filterType: this.filterType ? this.filterType : '',
      filterValue: this.filterValue ? this.filterValue : '',
      startDate: this.startDate ? this.customDatePipe.transform(this.startDate, 'yyyy-MM-dd') : '',
      endDate: this.endDate ? this.customDatePipe.transform(this.endDate, 'yyyy-MM-dd') : ''
    };
    if (this.filterType == "petQuestionnaire") {
      console.log("this.filterValue.questionnaireId", this.filterValue.questionnaireId);
      data.filterValue = this.filterValue ? this.filterValue.questionnaireId : '';
    }
    if (this.filterType == "assignedTo") {
      console.log("this.filterValue.userName", this.filterValue.userName);
      data.filterValue = this.filterValue ? this.filterValue.userName : '';
    }
    if (this.filterType == "Study") {
      data.filterValue = this.filterValue ? this.filterValue.studyName : '';
    }
    if (this.filterType == "pet") {
      data.filterValue = this.filterValue ? this.filterValue.petName : '';
    }
    if (this.filterType == "petParent") {
      data.filterValue = this.filterValue ? this.filterValue.petParentName : '';
    }
    if (this.filterType == "Plan") {
      data.filterValue = this.filterValue ? this.filterValue.planName : '';
    }
    
    let fileName = this.fileName;
    if(this.filterType == "" && this.reportName == 'Pet Parent Report'){
      data.filterValue = this.filterValue ? this.filterValue.petParentId : '';
      fileName = this.filterValue ? (this.fileName + '_' +this.filterValue.petParentName) : this.fileName;
    }

    let data1: any = await this.componentService
      .getDataTableData(this.url, data, this.method, this.body)
      .toPromise();
    this.exportDataExcel = Array.isArray(data1.response.rows)
      ? data1.response.rows
      : [data1.response.rows];
      

    this.excelService.exportAsExcelFile(this.excelData(), fileName);
  }

  excelData() {
    const arr = [];
    this.exportDataExcel.forEach(ele => {
      const obj = {};
      this.getColumns().forEach(ele1 => {
        if (ele1.format)
          obj[ele1.header] = this.customDatePipe.transform(ele[ele1.dataKey], ele1.format);
        else
          obj[ele1.header] = ele[ele1.dataKey];
      });
      arr.push(obj);
    });
    
    return arr;
  }
  makeNormal($event, item) {
    if (!$($event.target).closest('.inline-active')[0]) {
      item.contentEditable = false;
      this.editableRowNum = -1;
      $('td.inline-active').removeClass('inline-active');
    }
  }
  changeField($event) {
    console.log($event);
    this.filterValArr = [];
    this.filterValue = "";
    this.startDate = "";
    this.endDate = "";

    if (this.filterType == "") {
      this.filterValArr = [];
      this.FilterFlag = false;
      this.filterValue = "";
    }
    else {
      this.FilterFlag = true;
      if (this.filterType == "Status") {
        this.filterdrop = true;
        this.filterValue = "";
        this.filterValArr = [
          {
            name: "Active",
            id: "1"
          },
          {
            name: "Inactive",
            id: "0"
          }
        ]
      }
      else if (this.filterType == "pointTrackingStatus") {
        this.filterdrop = true;
        this.filterValue = "";
        this.filterValArr = [
          {
            name: "Draft",
            id: "2"
          },
          {
            name: "Published",
            id: "1"
          },
          {
            name: "Inactive",
            id: "0"
          }
        ]
      }
      else if (this.filterType == "questionnaireStatus") {
        this.filterdrop = true;
        this.filterValue = "";
        this.filterValArr = [
          {
            name: "Draft",
            id: "1"
          },
          {
            name: "Published",
            id: "2"
          },
          {
            name: "Inactive",
            id: "0"
          }
        ]
      }
      else if (this.filterType == "notificationStatus") {
        this.filterdrop = true;
        this.filterValue = "";
        this.filterValArr = [
          {
            name: "Enabled",
            id: "1"
          },
          {
            name: "Disabled",
            id: "0"
          }
        ]
      }
      else if (this.filterType == "petStatus") {
        this.filterdrop = true;
        this.filterValue = "";
        this.lookupService.getCommon('/api/lookup/getPetStatuses').subscribe(res => {
          if (res.status.success === true) {
            this.filterValArr = res.response.petStatuses;
          } else {
            this.toastr.error(res.errors[0].message);
          }
        }, err => {
          this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
        });
      }
      else if (this.filterType == "trackerStatus") {
        this.filterdrop = true;
        this.filterValue = "";
        this.filterValArr = [
          {
            name: "Pending",
            id: "1"
          },
          {
            name: "Approved",
            id: "2"
          },
          {
            name: "Rejected",
            id: "3"
          },
          {
            name: "In-Review",
            id: "4"
          }
        ]
      }
      else if (this.filterType == "supportStatus") {
        this.filterdrop = true;
        this.filterValue = "";
        this.filterValArr = this.supportStatusArr;
      }
      else if (this.filterType == "assetStatus") {
        this.filterdrop = true;
        this.filterValue = "";
        this.filterValArr = this.assetStatusArr;
      }
      else if (this.filterType == "Role") {
        this.filterdrop = true;
        this.filterValue = "";
        this.filterValArr = this.RoleArr;
      }
      else if (this.filterType == "RoleType") {
        this.filterdrop = true;
        this.filterValue = "";
        this.filterValArr = this.RoleTypeArr;
      }
      else if (this.filterType == "trackerActivity") {
        this.filterdrop = true;
        this.filterValue = "";
        this.filterValArr = this.trackerActivityArr;
      }
      else if (this.filterType == "phoneModel") {
        this.filterdrop = true;
        this.filterValue = "";
        this.filterValArr = this.phoneModelArr;
      }

      // else if(this.filterType == "assignedTo") {
      //   this.filterdrop = true;
      //   this.filterValue = "";
      //   this.filterValArr = this.assignedToListArr;
      // }
      else if (this.filterType == "ticketPriority") {
        this.filterdrop = true;
        this.filterValue = "";
        this.filterValArr = this.ticketPrioritiesArr;
      }
      else if (this.filterType == "location") {
        this.filterdrop = true;
        this.filterValue = "";
        this.filterValArr = this.sensorLocationsArr;
      }
      else if (this.filterType == "behavior") {
        this.filterdrop = true;
        this.filterValue = "";
        this.filterValArr = this.behaviorArr;
      }
      else if (this.filterType == "feedbackPage") {
        this.filterdrop = true;
        this.filterValue = "";
        this.filterValArr = this.feedbackPageArr;
      }
      else if (this.filterType == "category") {
        this.filterdrop = true;
        this.filterValue = "";
        this.filterValArr = this.categoryArr;
      }
      else if (this.filterType == "petName") {
        this.filterdrop = true;
        this.filterValue = "";
        this.filterValArr = this.petNameArr;
      }
      else if (this.filterType == "petParentName") {
        this.filterdrop = true;
        this.filterValue = "";
        this.filterValArr = this.petParentNameArr;
      }
      else if (this.filterType == "deviceType") {
        this.filterdrop = true;
        this.filterValue = "";
        this.filterValArr = this.deviceTypeArr;
      }
      else if (this.filterType == "Model") {
        this.filterdrop = true;
        this.filterValue = "";
        this.filterValArr = this.deviceModelArr;
      }
      else if (this.filterType == "Menu") {
        this.filterdrop = true;
        this.filterValue = "";
        this.filterValArr = this.moduleArr;
      }
      else if (this.filterType == "Action") {
        this.filterdrop = true;
        this.filterValue = "";
        this.filterValArr = this.actionArr;
      }
      else if (this.filterType == "dateType") {
        this.filterdrop = false;
        this.feedbackfilterdrop = true;
        this.filterValue = "";
      }
      else if (this.filterType == "assignedTo") {
        this.filterdrop = false;
        this.filterValArr = this.assignedToListArr;
        // this.feedbackfilterdrop = true;
        // this.filterValue = "";
      }
      else if (this.filterType == "petQuestionnaire") {
        this.filterdrop = false;
        this.filterValArr = this.petQuestionnaireArr;
      }
      else if (this.filterType == "Study") {
        this.filterdrop = false;
        this.filterValArr = this.studyList;
        // this.feedbackfilterdrop = true;
        // this.filterValue = "";
      }
      else if (this.filterType == "Plan") {
        this.filterdrop = false;
        this.filterValArr = this.planArr;
      }
      else if (this.filterType == "questionnaireDate") {
        this.filterdrop = false;
        this.questionnairefilterdrop = true;
        this.filterValue = "";
      }
      else if (this.filterType == "reportGroup") {
        this.filterdrop = true;
        this.filterValue = "";
        this.filterValArr = this.reportGroupsArr;
      }
      else if (this.filterType == "campaign") {
        this.filterdrop = true;
        this.filterValue = "";
        this.filterValArr = this.campaignArr;
      }
      else if (this.filterType == "pet") {
        this.filterdrop = false;
        this.filterValArr = this.petList;
      }
      else if (this.filterType == "petParent") {
        this.filterdrop = false;
        this.filterValArr = this.petParentList;
      }

    }
  }

  changeFilterVal($event) {

  }

}