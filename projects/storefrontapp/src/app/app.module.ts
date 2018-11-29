import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { StorefrontModule } from '@spartacus/storefront';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '../environments/environment.prod';

import { AppComponent } from './app.component';

const devImports = [];

if (!environment.production) {
  devImports.push(StoreDevtoolsModule.instrument());
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    StorefrontModule.withConfig({
      production: environment.production,
      server: {
        baseUrl: environment.occBaseUrl
      },
      pwa: {
        enabled: true,
        addToHomeScreen: true
      }
    }),
    ...devImports
  ],

  bootstrap: [AppComponent]
})
export class AppModule {}
