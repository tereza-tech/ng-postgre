import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AsappComponent } from './asupabase/asapp.component';

const routes: Routes = [
  { path: '', component: AsappComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
