import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantAlertNoteModalComponent } from './participant-alert-note-modal.component';

describe('ParticipantAlertNoteModalComponent', () => {
  let component: ParticipantAlertNoteModalComponent;
  let fixture: ComponentFixture<ParticipantAlertNoteModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ParticipantAlertNoteModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantAlertNoteModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
