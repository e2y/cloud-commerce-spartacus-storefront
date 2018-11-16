import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { Store, select } from '@ngrx/store';
import { filter } from 'rxjs/operators';
import { Subscription, Observable } from 'rxjs';

import * as fromCheckoutStore from '../../../store';
import * as fromCart from '../../../../cart/store';

import { GlobalMessageType } from './../../../../global-message/models/message.model';
import { Address } from '../../../models/address-model';
import { CheckoutService } from '../../../services/checkout.service';
import { CartService } from '../../../../cart/services/cart.service';
import { CartDataService } from '../../../../cart/services/cart-data.service';
import { GlobalMessageService } from '../../../../global-message/facade/global-message.service';
import { RoutingService } from '@spartacus/core';
import { checkoutNavBar } from './checkout-navigation-bar';

@Component({
  selector: 'cx-multi-step-checkout',
  templateUrl: './multi-step-checkout.component.html',
  styleUrls: ['./multi-step-checkout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MultiStepCheckoutComponent implements OnInit, OnDestroy {
  step = 1;

  deliveryAddress: Address;
  paymentDetails: any;
  shippingMethod: string;
  subscriptions: Subscription[] = [];

  cart$: Observable<any>;
  tAndCToggler = false;

  navs = checkoutNavBar;

  constructor(
    protected checkoutService: CheckoutService,
    protected cartService: CartService,
    protected cartDataService: CartDataService,
    protected routingService: RoutingService,
    protected globalMessageService: GlobalMessageService,
    private store: Store<fromCheckoutStore.CheckoutState>,
    protected cd: ChangeDetectorRef
  ) {}

  private refreshCart() {
    this.cartService.loadCartDetails();
  }

  ngOnInit() {
    if (!this.cartDataService.getDetails) {
      this.cartService.loadCartDetails();
    }
    this.cart$ = this.store.pipe(select(fromCart.getActiveCart));
    this.processSteps();
  }

  processSteps() {
    // step1: set delivery address
    this.subscriptions.push(
      this.store
        .pipe(
          select(fromCheckoutStore.getDeliveryAddress),
          filter(
            deliveryAddress =>
              Object.keys(deliveryAddress).length !== 0 && this.step === 1
          )
        )
        .subscribe(deliveryAddress => {
          this.deliveryAddress = deliveryAddress;
          this.nextStep(2);
          this.refreshCart();
          this.cd.detectChanges();
        })
    );

    // step2: select delivery mode
    this.subscriptions.push(
      this.store
        .pipe(
          select(fromCheckoutStore.getSelectedCode),
          filter(selected => selected !== '' && this.step === 2)
        )
        .subscribe(selectedMode => {
          this.nextStep(3);
          this.refreshCart();
          this.shippingMethod = selectedMode;
          this.cd.detectChanges();
        })
    );

    // step3: set payment information
    this.subscriptions.push(
      this.store
        .pipe(
          select(fromCheckoutStore.getPaymentDetails),
          filter(
            paymentInfo =>
              Object.keys(paymentInfo).length !== 0 && this.step === 3
          )
        )
        .subscribe(paymentInfo => {
          if (!paymentInfo['hasError']) {
            this.nextStep(4);
            this.paymentDetails = paymentInfo;
            this.cd.detectChanges();
          } else {
            Object.keys(paymentInfo).forEach(key => {
              if (key.startsWith('InvalidField')) {
                this.globalMessageService.add({
                  type: GlobalMessageType.MSG_TYPE_ERROR,
                  text: 'InvalidField: ' + paymentInfo[key]
                });
              }
            });
            this.store.dispatch(new fromCheckoutStore.ClearCheckoutStep(3));
          }
        })
    );

    // step4: place order
    this.subscriptions.push(
      this.store
        .pipe(
          select(fromCheckoutStore.getOrderDetails),
          filter(order => Object.keys(order).length !== 0 && this.step === 4)
        )
        .subscribe(order => {

          // TODO-E2Y: This doesn't work for some reason?

          this.checkoutService.orderDetails = order;
          this.routingService.go(['orderConfirmation']);
        })
    );
  }

  setStep(backStep) {
    this.nextStep(backStep);
  }

  nextStep(step: number): void {
    const previousStep = step - 1;

    this.navs.forEach(function(nav) {
      if (nav.id === previousStep) {
        nav.status.completed = true;
      }
      if (nav.id === step) {
        nav.status.active = true;
        nav.status.disabled = false;
      } else {
        nav.status.active = false;
      }

      nav.progressBar = nav.status.active || nav.status.completed;
    });

    this.step = step;
    this.tAndCToggler = false;
  }

  addAddress({ newAddress, address }) {
    if (newAddress) {
      this.checkoutService.createAndSetAddress(address);
      return;
    }
    // if the selected address is the same as the cart's one
    if (this.deliveryAddress && address.id === this.deliveryAddress.id) {
      this.nextStep(2);
      return;
    }
    this.checkoutService.setDeliveryAddress(address);
    return;
  }

  setDeliveryMode({ deliveryModeId }) {
    // if the selected shipping method is the same as the cart's one
    if (this.shippingMethod && this.shippingMethod === deliveryModeId) {
      this.nextStep(3);
      return;
    }
    this.checkoutService.setDeliveryMode(deliveryModeId);
    return;
  }

  addPaymentInfo({ newPayment, payment }) {
    // TODO-E2Y: At the moment the form for separate billing address does not appear to exist
    payment.billingAddress = this.deliveryAddress;

    if (newPayment) {
      this.checkoutService.createWorldpayPaymentDetails(payment);
      return;
    }

    // TODO-E2Y: There is a bug here where setting paymentDetailID to an order does not set the payment address...
    this.checkoutService.setPaymentDetails(payment);
  }

  placeOrder() {
    this.checkoutService.placeWorldpayOrder(this.paymentDetails);
  }

  toggleTAndC() {
    this.tAndCToggler = !this.tAndCToggler;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());

    this.store.dispatch(new fromCheckoutStore.ClearCheckoutData());
  }
}
