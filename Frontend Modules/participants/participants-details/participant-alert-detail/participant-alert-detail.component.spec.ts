import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantAlertDetailComponent } from './participant-alert-detail.component';

describe('ParticipantAlertDetailComponent', () => {
  let component: ParticipantAlertDetailComponent;
  let fixture: ComponentFixture<ParticipantAlertDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ParticipantAlertDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantAlertDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
