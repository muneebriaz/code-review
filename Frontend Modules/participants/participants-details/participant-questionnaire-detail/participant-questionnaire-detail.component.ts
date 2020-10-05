import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";

import { AlertService } from "app/shared/services/alert.service";
import { QuestionnaireService } from "app/shared/services/questionnaire.service";
import { AppConstants, STYLES } from "app/shared/constants";

@Component({
  selector: "app-participant-questionnaire-detail",
  templateUrl: "./participant-questionnaire-detail.component.html",
  styleUrls: ["./participant-questionnaire-detail.component.scss"],
})
export class ParticipantQuestionnaireDetailComponent {
  participantQuestionnaire: any = {};
  QUESTION_TYPE = AppConstants.QUESTION_TYPE;
  loading: Boolean = false;
  PAIN_ICONS = AppConstants.PAIN_ICONS;
  HEADING_WITH_BOTTOM = STYLES.HEADING_WITH_BOTTOM;
  @Output() backToResponse: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    private questionnaireService: QuestionnaireService,
    private alert: AlertService,
  ) {}

  async getQuestionnaires(questionnaireId, participantId) {
    try {
      this.loading = true;
      this.participantQuestionnaire = await this.questionnaireService.getQuestionnaireDetail(
        questionnaireId,
        participantId,
      );
      this.participantQuestionnaire.totalQuestions = this.participantQuestionnaire.questions.length;
      this.participantQuestionnaire.attemptQuestions = this.participantQuestionnaire.questions.reduce(
        (acc, element) => {
          return element.answer ? acc + 1 : acc;
        },
        0,
      );

      this.loading = false;
    } catch (error) {
      this.loading = false;
      return this.alert.error(error.message);
    }
  }

  back() {
    this.participantQuestionnaire = {};
    this.backToResponse.emit();
  }
}
