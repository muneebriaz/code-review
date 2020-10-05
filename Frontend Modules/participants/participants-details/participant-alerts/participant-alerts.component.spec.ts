import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantAlertsComponent } from './participant-alerts.component';

describe('ParticipantAlertsComponent', () => {
  let component: ParticipantAlertsComponent;
  let fixture: ComponentFixture<ParticipantAlertsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ParticipantAlertsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
