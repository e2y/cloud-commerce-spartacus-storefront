import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, Input } from '@angular/core';
import { OrderConfirmationComponent } from './order-confirmation.component';
import { By } from '@angular/platform-browser';
import { CheckoutService } from '../../services';
import { ProductImageConverterService } from '../../../product/converters/product-image-converter.service';
import { CartService } from '../../../cart/services';

@Component({ selector: 'cx-order-summary', template: '' })
class MockOrderSummaryComponent {
  @Input()
  cart: any;
}
@Component({ selector: 'cx-cart-item-list', template: '' })
class MockReviewSubmitComponent {
  @Input()
  items: any;
  @Input()
  isReadOnly: any;
}
@Component({ selector: 'cx-card', template: '' })
class MockCartComponent {
  @Input()
  content: any;
}

class CheckoutServiceMock {
  entries;
  orderDetails = {
    order: {
      code: 'test-code-412',
      deliveryAddress: {
        country: {}
      },
      deliveryMode: {},
      paymentInfo: {
        billingAddress: {
          country: {}
        }
      },
      entries: []
    }
  };
}

class ProductImageConverterServiceMock {
  convertProduct: () => {};
}

describe('OrderConfirmationComponent', () => {
  let component: OrderConfirmationComponent;
  let fixture: ComponentFixture<OrderConfirmationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        OrderConfirmationComponent,
        MockReviewSubmitComponent,
        MockCartComponent,
        MockOrderSummaryComponent
      ],
      providers: [
        { provide: CheckoutService, useClass: CheckoutServiceMock },
        { provide: ProductImageConverterService, useClass: ProductImageConverterServiceMock },
        { provide: CartService, useValue: {} }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderConfirmationComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.ngOnInit();
    expect(component).toBeTruthy();
  });

  it('should create', () => {
    component.ngOnInit();
    fixture.detectChanges();
    const titleText = fixture.debugElement.query(By.css('.cx-page__title'))
      .nativeElement.textContent;

    expect(titleText).toContain('test-code-412');
  });
});
