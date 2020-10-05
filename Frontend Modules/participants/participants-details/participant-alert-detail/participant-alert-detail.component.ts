import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ActivatedRoute } from "@angular/router";

import { AlertService } from "app/shared/services/alert.service";
import { ParticipantAlertNoteModalComponent } from "../participant-alert-note-modal/participant-alert-note-modal.component";
import { ParticipantAlertNoteService } from "app/shared/services/participant-alert-notes.service";
import { ParticipantQuestionAlertService } from "app/shared/services/participant-question-alert.service";
import { confirmCancelButton as confirm } from "app/shared/data/sweet-alerts";
import { AppConstants } from "app/shared/constants";
import { AlertDetail, Note } from "app/shared/classes/alertDetail.interface";

@Component({
  selector: "app-participant-alert-detail",
  templateUrl: "./participant-alert-detail.component.html",
  styleUrls: ["./participant-alert-detail.component.scss"],
})
export class ParticipantAlertDetailComponent implements OnInit {
  @Output() backToResponse: EventEmitter<any> = new EventEmitter<any>();
  @Input() alertDetail: AlertDetail = {};
  alertActions = AppConstants.ALERT_ACTIONS;
  alertTypes = AppConstants.ALERTS_TYPES;
  deleteMessage = AppConstants.DELETE_MESSAGE;
  alertStatus = "";

  constructor(
    private _route: ActivatedRoute,
    private modalService: NgbModal,
    private alert: AlertService,
    private participantAlertNoteService: ParticipantAlertNoteService,
    private participantQuestionAlertService: ParticipantQuestionAlertService,
  ) {}

  back() {
    this.backToResponse.emit(this.alertDetail);
  }

  ngOnInit() {
    this.alertStatus = this.alertDetail.status;
  }

  async addNote(noteId = "", note = {}) {
    try {
      const modalRef = this.modalService.open(
        ParticipantAlertNoteModalComponent,
        {
          centered: true,
        },
      );
      modalRef.componentInstance.noteId = noteId;
      modalRef.componentInstance.note = note;
      modalRef.componentInstance.alertId = this.alertDetail._id;
      modalRef.componentInstance.onSuccess.subscribe((newNote: Note) => {
        this.alertDetail.notes.push(newNote);
      });
    } catch (error) {
      return this.alert.error(error);
    }
  }

  async deleteNote(noteId, index) {
    try {
      if (
        await confirm(
          this.deleteMessage.question,
          this.deleteMessage.message,
          this.deleteMessage.type,
        )
      ) {
        let response = await this.participantAlertNoteService.deleteParticipantQuestionAlertNote(
          noteId,
        );
        this.alertDetail.notes.splice(index, 1);
        this.alert.success(response);
      }
    } catch (error) {
      this.alert.error(error);
    }
  }

  async updateStatus(event, alertId) {
    if (
      !(await confirm("Are you sure?", "Do you want update this alert status?"))
    ) {
      this.alertDetail.status = this.alertStatus;
      return;
    }

    try {
      await this.participantQuestionAlertService.updateParticipantQuestionAlertStatus(
        alertId,
        event.target.value,
      );
      this.alert.success("Status updated successfully");
    } catch (error) {
      this.alert.error(error);
    }
  }
}
