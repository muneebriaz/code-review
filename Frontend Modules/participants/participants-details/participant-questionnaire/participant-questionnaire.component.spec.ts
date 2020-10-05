import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantQuestionnaireComponent } from './participant-questionnaire.component';

describe('ParticipantQuestionnaireComponent', () => {
  let component: ParticipantQuestionnaireComponent;
  let fixture: ComponentFixture<ParticipantQuestionnaireComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ParticipantQuestionnaireComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantQuestionnaireComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
