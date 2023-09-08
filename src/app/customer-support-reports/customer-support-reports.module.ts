import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomerSupportReportsRoutingModule } from './customer-support-reports-routing.module';
import { ReportsComponent } from './components/reports/reports.component';


@NgModule({
  declarations: [ReportsComponent],
  imports: [
    CommonModule,
    CustomerSupportReportsRoutingModule
  ]
})
export class CustomerSupportReportsModule { }
