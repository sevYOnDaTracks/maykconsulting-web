import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserInfoNewForProviderComponent } from './user-info-new-for-provider.component';

describe('UserInfoNewForProviderComponent', () => {
  let component: UserInfoNewForProviderComponent;
  let fixture: ComponentFixture<UserInfoNewForProviderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserInfoNewForProviderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UserInfoNewForProviderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
