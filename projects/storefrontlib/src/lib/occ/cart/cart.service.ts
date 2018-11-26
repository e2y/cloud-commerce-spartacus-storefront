import { throwError, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import {
  OccConfig,
  CartList,
  Cart,
  CartModification,
  Address,
  DeliveryMode,
  PaymentDetails
} from '@spartacus/core';
import { CustomEncoder } from '../custom.encoder';

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';

import '../../../../../../assets/worldpay-cse';


// for mini cart
const BASIC_PARAMS =
  'DEFAULT,deliveryItemsQuantity,totalPrice(formattedValue),' +
  'entries(totalPrice(formattedValue),product(images(FULL)))';

// for cart details page
const DETAILS_PARAMS =
  'DEFAULT,potentialProductPromotions,appliedProductPromotions,potentialOrderPromotions,appliedOrderPromotions,' +
  'entries(totalPrice(formattedValue),product(images(FULL),stock(FULL)),basePrice(formattedValue)),' +
  'totalPrice(formattedValue),totalItems,totalPriceWithTax(formattedValue),totalDiscounts(formattedValue),subTotal(formattedValue),' +
  'deliveryItemsQuantity,totalTax(formattedValue),pickupItemsQuantity,net,appliedVouchers,productDiscounts(formattedValue)';

@Injectable()
export class OccCartService {
  constructor(protected http: HttpClient, protected config: OccConfig) {}

  protected getCartEndpoint(userId: string) {
    const cartEndpoint = 'users/' + userId + '/carts/';
    return (
      (this.config.server.baseUrl || '') +
      this.config.server.occPrefix +
      this.config.site.baseSite +
      '/' +
      cartEndpoint
    );
  }

  public loadAllCarts(userId: string, details?: boolean): Observable<CartList> {
    const url = this.getCartEndpoint(userId);
    const params = details
      ? new HttpParams({
          fromString: 'fields=carts(' + DETAILS_PARAMS + ',saveTime)'
        })
      : new HttpParams({
          fromString: 'fields=carts(' + BASIC_PARAMS + ',saveTime)'
        });
    return this.http
      .get<CartList>(url, { params: params })
      .pipe(catchError((error: any) => throwError(error)));
  }

  public loadCart(
    userId: string,
    cartId: string,
    details?: boolean
  ): Observable<Cart> {
    const url = this.getCartEndpoint(userId) + cartId;
    const params = details
      ? new HttpParams({
          fromString: 'fields=' + DETAILS_PARAMS
        })
      : new HttpParams({
          fromString: 'fields=' + BASIC_PARAMS
        });

    if (cartId === 'current') {
      return this.loadAllCarts(userId, details).pipe(
        map(cartsData => {
          if (cartsData && cartsData.carts) {
            const activeCart = cartsData.carts.find(cart => {
              return cart['saveTime'] === undefined;
            });
            return activeCart;
          } else {
            return null;
          }
        })
      );
    } else {
      return this.http
        .get<Cart>(url, { params: params })
        .pipe(catchError((error: any) => throwError(error)));
    }
  }

  public createCart(
    userId: string,
    oldCartId?: string,
    toMergeCartGuid?: string
  ): Observable<Cart> {
    const url = this.getCartEndpoint(userId);
    const toAdd = JSON.stringify({});
    let queryString = 'fields=' + BASIC_PARAMS;

    if (oldCartId) {
      queryString = queryString + '&oldCartId=' + oldCartId;
    }
    if (toMergeCartGuid) {
      queryString = queryString + '&toMergeCartGuid=' + toMergeCartGuid;
    }
    const params = new HttpParams({
      fromString: queryString
    });

    return this.http
      .post<Cart>(url, toAdd, { params: params })
      .pipe(catchError((error: any) => throwError(error.json())));
  }

  public addCartEntry(
    userId: string,
    cartId: string,
    productCode: string,
    quantity: number = 1
  ): Observable<CartModification> {
    const toAdd = JSON.stringify({});

    const url = this.getCartEndpoint(userId) + cartId + '/entries';

    const params = new HttpParams({
      fromString: 'code=' + productCode + '&qty=' + quantity
    });

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http
      .post<CartModification>(url, toAdd, { headers, params })
      .pipe(catchError((error: any) => throwError(error.json())));
  }

  public updateCartEntry(
    userId: string,
    cartId: string,
    entryNumber: string,
    qty: number,
    pickupStore?: string
  ): Observable<CartModification> {
    const url =
      this.getCartEndpoint(userId) + cartId + '/entries/' + entryNumber;

    let queryString = 'qty=' + qty;
    if (pickupStore) {
      queryString = queryString + '&pickupStore=' + pickupStore;
    }
    const params = new HttpParams({
      fromString: queryString
    });

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http
      .patch<CartModification>(url, {}, { headers, params })
      .pipe(catchError((error: any) => throwError(error.json())));
  }

  public removeCartEntry(
    userId: string,
    cartId: string,
    entryNumber: string
  ): Observable<any> {
    const url =
      this.getCartEndpoint(userId) + cartId + '/entries/' + entryNumber;

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http
      .delete(url, { headers })
      .pipe(catchError((error: any) => throwError(error.json())));
  }

  public createAddressOnCart(
    userId: string,
    cartId: string,
    address: any
  ): Observable<Address> {
    return this.http
      .post<Address>(
        this.getCartEndpoint(userId) + cartId + '/addresses/delivery',
        address,
        {
          headers: new HttpHeaders().set('Content-Type', 'application/json')
        }
      )
      .pipe(catchError((error: any) => throwError(error.json())));
  }

  public setDeliveryAddress(
    userId: string,
    cartId: string,
    addressId: string
  ): Observable<any> {
    return this.http
      .put(
        this.getCartEndpoint(userId) + cartId + '/addresses/delivery',
        {},
        {
          params: { addressId: addressId }
        }
      )
      .pipe(catchError((error: any) => throwError(error.json())));
  }

  public setDeliveryMode(
    userId: string,
    cartId: string,
    deliveryModeId: string
  ): Observable<any> {
    return this.http
      .put(
        this.getCartEndpoint(userId) + cartId + '/deliverymode',
        {},
        {
          params: { deliveryModeId: deliveryModeId }
        }
      )
      .pipe(catchError((error: any) => throwError(error.json())));
  }

  public getDeliveryMode(userId: string, cartId: string): Observable<any> {
    return this.http
      .get(this.getCartEndpoint(userId) + cartId + '/deliverymode')
      .pipe(catchError((error: any) => throwError(error.json())));
  }

  public getSupportedDeliveryModes(
    userId: string,
    cartId: string
  ): Observable<DeliveryMode> {
    return this.http
      .get<DeliveryMode>(
        this.getCartEndpoint(userId) + cartId + '/deliverymodes'
      )
      .pipe(catchError((error: any) => throwError(error.json())));
  }

  public getPaymentProviderSubInfo(
    userId: string,
    cartId: string
  ): Observable<any> {
    return this.http
      .get(
        this.getCartEndpoint(userId) +
          cartId +
          '/payment/sop/request?responseUrl=sampleUrl'
      )
      .pipe(catchError((error: any) => throwError(error.json())));
  }

  public createSubWithPaymentProvider(
    postUrl: string,
    parameters: any
  ): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'text/html'
    });
    let httpParams = new HttpParams({ encoder: new CustomEncoder() });
    Object.keys(parameters).forEach(key => {
      httpParams = httpParams.append(key, parameters[key]);
    });

    return this.http.post(postUrl, httpParams, {
      headers,
      responseType: 'text'
    });
  }

  public createPaymentDetails(
    userId: string,
    cartId: string,
    parameters: any
  ): Observable<PaymentDetails> {
    let httpParams = new HttpParams({ encoder: new CustomEncoder() });
    Object.keys(parameters).forEach(key => {
      httpParams = httpParams.append(key, parameters[key]);
    });

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http
      .post<PaymentDetails>(
        this.getCartEndpoint(userId) + cartId + '/payment/sop/response',
        httpParams,
        { headers }
      )
      .pipe(catchError((error: any) => throwError(error)));
  }

  public createWorldpayPaymentDetails(
    userId: string,
    cartId: string,
    paymentDetails: any,
  ): Observable<any> {
    const Worldpay = window['Worldpay'];
    // TODO-E2Y: Make this configurable
    Worldpay.setPublicKey('1#10001#c745fe13416ffc5f9283f47f7b18e58a55a1e152d8'
      + '73cf7e31cd87e04dda905570b53bd6996c54d2f90a7ade6e65'
      + 'ba45853617472b1ad78d02f0bd9183af22d8dd6002a7857d0c'
      + '4f5c102bd29864ae9b5b2caf3ef22932a7b2c6f00f819f6ac9'
      + '2905d9662d0905526f0a99160e49dd613b07212fb9429535a2'
      + '8b54a087fc3541a8fc214e46a07ebacab0f5b6a60331cd6616'
      + '8548c097c716df09332d95faf3d9717107a5db5ce553406688'
      + 'a368d6d44f79eb4c3366068e7c4dbe1f1987ef6ac54bc4e119'
      + '5021ceac831141553986db5a5b8206abc0e0b36ed4adf31ae6'
      + '92829057dbb0c99270825335405e816f40fe3a3051c323695e'
      + '52bf97fccda813c45a31');

    const token = Worldpay.encrypt({
      cvc: paymentDetails.cvn,
      cardHolderName: paymentDetails.accountHolderName,
      cardNumber: paymentDetails.cardNumber,
      expiryMonth: paymentDetails.expiryMonth,
      expiryYear: paymentDetails.expiryYear
    }, error => {
      console.log(error);
    });

    console.log(paymentDetails);

    return this.http
      .post(
        this.getCartEndpoint(userId) + cartId + '/worldpaypaymentdetails'
        + `?accountHolderName=${paymentDetails.accountHolderName}&cseToken=${token}&cardType=${paymentDetails.cardType.code}`
        + `&expiryMonth=${paymentDetails.expiryMonth}&expiryYear=${paymentDetails.expiryYear}`
        + `&billingAddress.titleCode=${paymentDetails.billingAddress.titleCode}`
        + `&billingAddress.firstName=${paymentDetails.billingAddress.firstName}`
        + `&billingAddress.lastName=${paymentDetails.billingAddress.lastName}`
        + `&billingAddress.line1=${paymentDetails.billingAddress.line1}&billingAddress.line2=${paymentDetails.billingAddress.line2}`
        + `&billingAddress.town=${paymentDetails.billingAddress.town}&billingAddress.postalCode=${paymentDetails.billingAddress.postalCode}`
        + `&billingAddress.country.isocode=${paymentDetails.billingAddress.country.isocode}`,
        null
      )
      .pipe(catchError((error: any) => throwError(error)));
  }

  public setPaymentDetails(
    userId: string,
    cartId: string,
    paymentDetailsId: any
  ): Observable<any> {
    return this.http
      .put(
        this.getCartEndpoint(userId) + cartId + '/paymentdetails',
        {},
        {
          params: { paymentDetailsId: paymentDetailsId }
        }
      )
      .pipe(catchError((error: any) => throwError(error.json())));
  }
}
