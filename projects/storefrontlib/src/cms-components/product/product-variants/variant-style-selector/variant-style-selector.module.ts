import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { UrlModule, I18nModule } from '@spartacus/core';
import { VariantStyleSelectorComponent } from './variant-style-selector.component';
import { RouterModule } from '@angular/router';

/**
 * @deprecated since 3.2
 * Use feature-library @spartacus/product/variants/components instead
 */
@NgModule({
  imports: [CommonModule, RouterModule, UrlModule, I18nModule],
  declarations: [VariantStyleSelectorComponent],
  entryComponents: [VariantStyleSelectorComponent],
  exports: [VariantStyleSelectorComponent],
})
export class VariantStyleSelectorModule {}
