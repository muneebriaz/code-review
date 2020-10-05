import { Component, OnInit, ViewChild, Input } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { confirmCancelButton as confirm } from "app/shared/data/sweet-alerts";

import { AlertService } from "app/shared/services/alert.service";
import { AppConstants, STYLES } from "app/shared/constants";
import { QuestionnaireService } from "app/shared/services/questionnaire.service";
import { ParticipantQuestionnaireDetailComponent } from "../participant-questionnaire-detail/participant-questionnaire-detail.component";
import { StageService } from "app/shared/services/stage.service";

@Component({
  selector: "app-participant-questionnaire",
  templateUrl: "./participant-questionnaire.component.html",
  styleUrls: ["./participant-questionnaire.component.scss"],
})
export class ParticipantQuestionnaireComponent implements OnInit {
  groupQuestionnaire: any = {};
  participantId = "";
  showDetail: Boolean = false;

  loading: Boolean = false;
  @Input() status;
  STAGES = AppConstants.STAGES;
  STATUS = AppConstants.PARTICIPANT_STATUS;
  HEADING_WITH_BOTTOM = STYLES.HEADING_WITH_BOTTOM;
  @ViewChild("participantQuestionnaireDetail", { static: false })
  participantQuestionnaireDetail: ParticipantQuestionnaireDetailComponent;

  constructor(
    private _route: ActivatedRoute,
    private stageService: StageService,
    private questionnaireService: QuestionnaireService,
    private alert: AlertService,
  ) {
    this.participantId = this._route.snapshot.params["userId"];
  }

  ngOnInit() {
    this.getQuestionnaire();
  }

  async download(stageName, questionnaireId) {
    try {
      if (
        await confirm("Confirmation!", "Do you want to download its answers?")
      ) {
        const stageId = this.stageService.getIdByName(stageName);
        await this.questionnaireService.export(
          questionnaireId,
          stageId,
          this.participantId,
        );
      }
    } catch (error) {
      this.alert.error(error);
    }
  }

  questionnaireDetail(id) {
    this.showDetail = !this.showDetail;
    this.participantQuestionnaireDetail.getQuestionnaires(
      id,
      this.participantId,
    );
  }

  async getQuestionnaire() {
    try {
      this.loading = true;
      let respone = await this.questionnaireService.getQuestionaires({
        search: "",
        stage: "",
        participantId: this.participantId,
      });
      respone.forEach((q) => {
        const stageName = q.stage["name"];
        if (!this.groupQuestionnaire[stageName]) {
          this.groupQuestionnaire[stageName] = [];
        }
        this.groupQuestionnaire[stageName].push(q);
      });
      this.loading = false;
    } catch (error) {
      this.loading = false;
      return this.alert.error(error);
    }
  }

  backToResponse() {
    this.showDetail = !this.showDetail;
  }
}
