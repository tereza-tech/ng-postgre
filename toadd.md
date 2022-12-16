# Service
import { Injectable } from '@angular/core'
import {
  AuthChangeEvent,
  AuthSession,
  createClient,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js'
import { environment } from 'src/environments/environment'
import { Database } from 'src/schema'

export interface Profile {
  id?: string
  username: string
  website: string
  avatar_url: string
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient
  _session: AuthSession | null = null

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey)
  }

  get session() {
    this.supabase.auth.getSession().then(({ data }) => {
      this._session = data.session
    })
    return this._session
  }

  profile(user: User) {
    return this.supabase
      .from('profiles')
      .select(`username, website, avatar_url`)
      .eq('id', user.id)
      .single()
  }

  authChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }

  signIn(email: string) {
    return this.supabase.auth.signInWithOtp({ email })
  }

  signOut() {
    return this.supabase.auth.signOut()
  }

  updateProfile(profile: Profile) {
    const update = {
      ...profile,
      updated_at: new Date(),
    }

    return this.supabase.from('profiles').upsert(update)
  }

  downLoadImage(path: string) {
    return this.supabase.storage.from('avatars').download(path)
  }

  uploadAvatar(filePath: string, file: File) {
    return this.supabase.storage.from('avatars').upload(filePath, file)
  }
}

# Auth Component
import { Component, OnInit } from '@angular/core'
import { FormBuilder } from '@angular/forms'
import { SupabaseService } from '../supabase.service'

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
})
export class AuthComponent implements OnInit {
  loading = false

  signInForm = this.formBuilder.group({
    email: '',
  })

  constructor(
    private readonly supabase: SupabaseService,
    private readonly formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {}

  async onSubmit(): Promise<void> {
    try {
      this.loading = true
      const email = this.signInForm.value.email as string
      const { error } = await this.supabase.signIn(email)
      if (error) throw error
      alert('Check your email for the login link!')
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message)
      }
    } finally {
      this.signInForm.reset()
      this.loading = false
    }
  }
}

    <div class=“row flex-center flex”>
      <div class=“col-6 form-widget” aria-live=“polite”>
        <h1 class=“header”>Supabase + Angular</h1>
        <p class=“description”>Sign in via magic link with your email below</p>
        <form [formGroup]=“signInForm” (ngSubmit)=“onSubmit()” class=“form-widget”>
          <div>
            <label for=“email”>Email</label>
            <input
              id=“email”
              formControlName=“email”
              class=“inputField”
              type=“email”
              placeholder=“Your email”
            />
          </div>
          <div>
            <button
              type=“submit”
              class=“button block”
              [disabled]=“loading”
            >
              {{ loading ? ‘Loading’ : ‘Send magic link’ }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
# Account component
import { Component, Input, OnInit } from '@angular/core'
import { FormBuilder } from '@angular/forms'
import { AuthSession } from '@supabase/supabase-js'
import { Profile, SupabaseService } from '../supabase.service'

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css'],
})
export class AccountComponent implements OnInit {
  loading = false
  profile!: Profile

  @Input()
  session!: AuthSession

  updateProfileForm = this.formBuilder.group({
    username: '',
    website: '',
    avatar_url: '',
  })

  constructor(private readonly supabase: SupabaseService, private formBuilder: FormBuilder) {}

  async ngOnInit(): Promise<void> {
    await this.getProfile()

    const { username, website, avatar_url } = this.profile
    this.updateProfileForm.patchValue({
      username,
      website,
      avatar_url,
    })
  }

  async getProfile() {
    try {
      this.loading = true
      const { user } = this.session
      let { data: profile, error, status } = await this.supabase.profile(user)

      if (error && status !== 406) {
        throw error
      }

      if (profile) {
        this.profile = profile
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message)
      }
    } finally {
      this.loading = false
    }
  }
  
  get avatarUrl() {
    return this.updateProfileForm.value.avatar_url as string
  }

  async updateAvatar(event: string): Promise<void> {
    this.updateProfileForm.patchValue({
      avatar_url: event,
    })
    await this.updateProfile()
  }

  async updateProfile(): Promise<void> {
    try {
      this.loading = true
      const { user } = this.session

      const username = this.updateProfileForm.value.username as string
      const website = this.updateProfileForm.value.website as string
      const avatar_url = this.updateProfileForm.value.avatar_url as string

      const { error } = await this.supabase.updateProfile({
        id: user.id,
        username,
        website,
        avatar_url,
      })
      if (error) throw error
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message)
      }
    } finally {
      this.loading = false
    }
  }

  async signOut() {
    await this.supabase.signOut()
  }
}
    
    <form [formGroup]="updateProfileForm" (ngSubmit)="updateProfile()" class="form-widget">
  <app-avatar [avatarUrl]="this.avatarUrl" (upload)="updateAvatar($event)"> </app-avatar>
      <div>
        <label for=“email”>Email</label>
        <input id=“email” type=“text” [value]=“session.user.email” disabled />
      </div>
      <div>
        <label for=“username”>Name</label>
        <input formControlName=“username” id=“username” type=“text” />
      </div>
      <div>
        <label for=“website”>Website</label>
        <input formControlName=“website” id=“website” type=“url” />
      </div>
    
      <div>
        <button type=“submit” class=“button primary block” [disabled]=“loading”>
          {{ loading ? ‘Loading ...’ : ‘Update’ }}
        </button>
      </div>
    
      <div>
        <button class=“button block” (click)=“signOut()”>Sign Out</button>
      </div>
    </form>
    
# App component
import { Component, OnInit } from '@angular/core'
import { SupabaseService } from './supabase.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'angular-user-management'

  session = this.supabase.session

  constructor(private readonly supabase: SupabaseService) {}

  ngOnInit() {
    this.supabase.authChanges((_, session) => (this.session = session))
  }
}

    <div class=“container” style=“padding: 50px 0 100px 0”>
      <app-account *ngIf=“session; else auth” [session]=“session”></app-account>
      <ng-template #auth>
        <app-auth></app-auth>
      </ng-template>
    </div>
    
# App module
import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'

import { AppComponent } from './app.component'
import { AuthComponent } from './auth/auth.component'
import { AccountComponent } from './account/account.component'
import { ReactiveFormsModule } from '@angular/forms'
import { AvatarComponent } from './avatar/avatar.component'

@NgModule({
  declarations: [AppComponent, AuthComponent, AccountComponent, AvatarComponent],
  imports: [BrowserModule, ReactiveFormsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}

# Avatar component
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser'
import { SupabaseService } from '../supabase.service'

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.css'],
})
export class AvatarComponent implements OnInit {
  _avatarUrl: SafeResourceUrl | undefined
  uploading = false

  @Input()
  set avatarUrl(url: string | null) {
    if (url) {
      this.downloadImage(url)
    }
  }

  @Output() upload = new EventEmitter<string>()

  constructor(private readonly supabase: SupabaseService, private readonly dom: DomSanitizer) {}

  ngOnInit(): void {}

  async downloadImage(path: string) {
    try {
      const { data } = await this.supabase.downLoadImage(path)
      if (data instanceof Blob) {
        this._avatarUrl = this.dom.bypassSecurityTrustResourceUrl(URL.createObjectURL(data))
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error downloading image: ', error.message)
      }
    }
  }

  async uploadAvatar(event: any) {
    try {
      this.uploading = true
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${Math.random()}.${fileExt}`

      await this.supabase.uploadAvatar(filePath, file)
      this.upload.emit(filePath)
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message)
      }
    } finally {
      this.uploading = false
    }
  }
}

    <div>
      <img
        *ngIf=“_avatarUrl”
        [src]=“_avatarUrl”
        alt=“Avatar”
        class=“avatar image”
        style=“height: 150px; width: 150px”
      />
    </div>
    <div *ngIf=“!_avatarUrl” class=“avatar no-image” style=“height: 150px; width: 150px”></div>
    <div style=“width: 150px”>
      <label class=“button primary block” for=“single”>
        {{ uploading ? ‘Uploading ...’ : ‘Upload’ }}
      </label>
      <input
        style=“visibility: hidden;position: absolute”
        type=“file”
        id=“single”
        accept=“image/*”
        (change)=“uploadAvatar($event)”
        [disabled]=“uploading”
      />
    </div>
    
# 