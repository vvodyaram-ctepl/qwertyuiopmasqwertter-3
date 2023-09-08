import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PetDataExtractListComponent } from './components/pet-data-extract-list/pet-data-extract-list.component';
import { PetDataExtractComponent } from './components/pet-data-extract/pet-data-extract.component';
import { ViewPetDataExtractComponent } from './components/view-pet-data-extract/view-pet-data-extract.component';


const routes: Routes = [
  {
    path: '', component: PetDataExtractListComponent
  },
  { path: 'manage-pet-data-extract', component: PetDataExtractComponent },
  {
    path: 'view-pet-data-extract/:id/:type', component: ViewPetDataExtractComponent
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PetDataExtractRoutingModule { }
