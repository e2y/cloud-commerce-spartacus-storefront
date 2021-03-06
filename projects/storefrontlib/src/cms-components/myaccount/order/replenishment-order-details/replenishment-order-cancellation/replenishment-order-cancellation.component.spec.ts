import {
  DebugElement,
  ElementRef,
  Pipe,
  PipeTransform,
  ViewContainerRef,
} from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import {
  I18nTestingModule,
  ReplenishmentOrder,
  UserReplenishmentOrderService,
} from '@spartacus/core';
import { LaunchDialogService, LAUNCH_CALLER } from '@spartacus/storefront';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { ReplenishmentOrderCancellationLaunchDialogService } from './replenishment-order-cancellation-launch-dialog.service';
import { ReplenishmentOrderCancellationComponent } from './replenishment-order-cancellation.component';

const mockReplenishmentOrder: ReplenishmentOrder = {
  active: true,
  purchaseOrderNumber: 'test-po',
  replenishmentOrderCode: 'test-repl-order',
  entries: [{ entryNumber: 0, product: { name: 'test-product' } }],
};

const mockReplenishmentOrder$ = new BehaviorSubject<ReplenishmentOrder>(
  mockReplenishmentOrder
);

class MockUserReplenishmentOrderService {
  getReplenishmentOrderDetails(): Observable<ReplenishmentOrder> {
    return mockReplenishmentOrder$.asObservable();
  }
  clearReplenishmentOrderDetails() {}
}

class MockReplenishmentOrderCancellationLaunchDialogService {
  openDialog(_openElement?: ElementRef, _vcr?: ViewContainerRef) {}
}
@Pipe({
  name: 'cxUrl',
})
class MockUrlPipe implements PipeTransform {
  transform() {}
}

class MockLaunchDialogService implements Partial<LaunchDialogService> {
  openDialog(
    _caller: LAUNCH_CALLER,
    _openElement?: ElementRef,
    _vcr?: ViewContainerRef
  ) {
    return of();
  }
}

describe('ReplenishmentOrderCancellationComponent', () => {
  let component: ReplenishmentOrderCancellationComponent;
  let userReplenishmentOrderService: UserReplenishmentOrderService;
  let launchDialogService: LaunchDialogService;
  let fixture: ComponentFixture<ReplenishmentOrderCancellationComponent>;
  let el: DebugElement;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [I18nTestingModule, RouterTestingModule],
        declarations: [ReplenishmentOrderCancellationComponent, MockUrlPipe],
        providers: [
          {
            provide: UserReplenishmentOrderService,
            useClass: MockUserReplenishmentOrderService,
          },
          // TODO(#12167): remove unused class and provider
          {
            provide: ReplenishmentOrderCancellationLaunchDialogService,
            useClass: MockReplenishmentOrderCancellationLaunchDialogService,
          },
          {
            provide: LaunchDialogService,
            useClass: MockLaunchDialogService,
          },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ReplenishmentOrderCancellationComponent);
    userReplenishmentOrderService = TestBed.inject(
      UserReplenishmentOrderService
    );
    launchDialogService = TestBed.inject(LaunchDialogService);

    component = fixture.componentInstance;
    el = fixture.debugElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be able to get replenishment order details', () => {
    let result: ReplenishmentOrder;

    userReplenishmentOrderService
      .getReplenishmentOrderDetails()
      .subscribe((data) => (result = data))
      .unsubscribe();

    expect(result).toEqual(mockReplenishmentOrder);
  });

  it('should be able to call the open dialog', () => {
    spyOn(launchDialogService, 'openDialog').and.stub();

    el.query(By.css('button.btn-action:last-child')).nativeElement.click();

    expect(launchDialogService.openDialog).toHaveBeenCalledWith(
      LAUNCH_CALLER.REPLENISHMENT_ORDER,
      component.element,
      component['vcr']
    );
  });

  it('should show two action button', () => {
    const button = el.queryAll(By.css('.btn'));

    expect(button.length).toEqual(2);
  });

  it('should show one action button', () => {
    mockReplenishmentOrder$.next({ active: false });

    fixture.detectChanges();

    const button = el.queryAll(By.css('.btn'));

    expect(button.length).toEqual(1);
  });
});
