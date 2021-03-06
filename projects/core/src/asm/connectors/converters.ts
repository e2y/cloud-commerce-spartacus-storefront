import { InjectionToken } from '@angular/core';
import { Converter } from '../../util/converter.service';
import { CustomerSearchPage } from '../models/asm.models';

/**
 * @deprecated since 3.2, use asm lib instead
 */
export const CUSTOMER_SEARCH_PAGE_NORMALIZER = new InjectionToken<
  Converter<any, CustomerSearchPage>
>('CustomerSearchPageNormalizer');
