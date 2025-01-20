import {Injectable} from '@angular/core';
import {MatDialogRef, MatDialog} from '@angular/material/dialog';
import {LearningOutcomeCsvDownloadModalComponent} from './learning-outcome-csv-download-modal.component';
import {Unit} from 'src/app/api/models/unit';

@Injectable({
  providedIn: 'root',
})
export class LearningOutcomeCsvDownloadModalService {
  constructor(public dialog: MatDialog) {}

  public show(unit: Unit) {
    let dialogRef: MatDialogRef<LearningOutcomeCsvDownloadModalComponent, any>;
    dialogRef = this.dialog.open(LearningOutcomeCsvDownloadModalComponent, {data: {unit}});
  }
}
