import {
  Component,
  ElementRef,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from "@angular/core";
import { NgbModal, NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

import { AlertService } from "app/shared/services/alert.service";
import { ParticipantAlertNoteService } from "app/shared/services/participant-alert-notes.service";
import { AppConstants } from "app/shared/constants";

@Component({
  selector: "app-participant-alert-note-modal",
  templateUrl: "./participant-alert-note-modal.component.html",
  styleUrls: ["./participant-alert-note-modal.component.scss"],
})
export class ParticipantAlertNoteModalComponent implements OnInit {
  @Input() note;
  @Input() noteId;
  @Input() alertId;
  @Output() onSuccess: EventEmitter<any> = new EventEmitter<any>();
  isFormSubmitted: Boolean = false;
  loading: Boolean = false;
  @ViewChild("noteSubject", { static: true }) subject: ElementRef;
  ERROR_REQUIRED_FIELDS = AppConstants.ERROR_REQUIRED_FIELDS;
  DEFAULT_REQUIRED_FIELD_ERROR = AppConstants.DEFAULT_REQUIRED_FIELD_ERROR;

  constructor(
    private activeModal: NgbActiveModal,
    private participantAlertNoteService: ParticipantAlertNoteService,
    private alert: AlertService,
  ) {}

  ngOnInit() {
    this.subject.nativeElement.focus();
  }

  async formSubmit() {
    try {
      this.isFormSubmitted = true;
      if (!this.note.title) {
        return this.alert.error(this.ERROR_REQUIRED_FIELDS);
      }

      if (!this.noteId) {
        this.loading = true;
        let response = await this.participantAlertNoteService.createParticipantQuestionAlertNote(
          this.alertId,
          this.note,
        );
        this.loading = false;
        this.alert.success(response);
        this.onSuccess.emit(response["note"]);
      } else {
        this.loading = true;
        let response = await this.participantAlertNoteService.updateParticipantQuestionAlertNote(
          this.noteId,
          this.note,
        );
        this.loading = false;
        this.alert.success(response);
      }
      this.activeModal.dismiss();
    } catch (error) {
      this.isFormSubmitted = false;
      return this.alert.error(error);
    }
  }

  close() {
    this.activeModal.dismiss();
  }
}
