import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantQuestionnaireDetailComponent } from './participant-questionnaire-detail.component';

describe('ParticipantQuestionnaireDetailComponent', () => {
  let component: ParticipantQuestionnaireDetailComponent;
  let fixture: ComponentFixture<ParticipantQuestionnaireDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ParticipantQuestionnaireDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantQuestionnaireDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
