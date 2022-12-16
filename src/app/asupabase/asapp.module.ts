import { NgModule } from '@angular/core';

import { AsappComponent } from './asapp.component';
import { AuthComponent } from './auth.component';
import { AccountComponent } from './account.component';
import { AvatarComponent } from './avatar.component';

@NgModule({
  declarations: [AsappComponent, AuthComponent, AccountComponent, AvatarComponent],
  imports: [BrowserModule],
  exports: [AsappComponent],
  bootstrap: [AsappComponent],
})
export class AsappModule {}