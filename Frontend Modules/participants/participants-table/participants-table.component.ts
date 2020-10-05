import { Component, Input, Output, EventEmitter } from "@angular/core";
import { Surgeon } from "app/shared/classes/surgeon.interface";

import { STYLES } from "app/shared/constants";

interface surgeonLinkedData {
  surgeonId: string;
  isLink: boolean;
}

@Component({
  selector: "app-participants-table",
  styleUrls: ["./participants-table.component.scss"],
  templateUrl: "./participants-table.component.html",
})
export class ParticipantsTableComponent {
  SECONDARY_BTN = STYLES.SECONDARY_BTN;

  @Input() surgeons: Array<Surgeon>;
  @Input() linked: boolean = false;
  @Input() loading: false;

  @Output() surgeonLinked = new EventEmitter<surgeonLinkedData>();
  @Output() surgeonUnlinked = new EventEmitter<surgeonLinkedData>();
  @Output() makeSurgeonDefault = new EventEmitter<string>();

  constructor() {}

  link(id: string) {
    this.surgeonLinked.emit({ surgeonId: id, isLink: true });
  }

  unlink(id: string) {
    this.surgeonUnlinked.emit({ surgeonId: id, isLink: false });
  }
}
