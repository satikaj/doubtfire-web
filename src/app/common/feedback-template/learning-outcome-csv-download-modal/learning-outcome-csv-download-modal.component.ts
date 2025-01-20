import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Unit} from 'src/app/api/models/unit';
import {FileDownloaderService} from '../../file-downloader/file-downloader.service';

@Component({
  selector: 'f-learning-outcome-csv-download-modal',
  templateUrl: './learning-outcome-csv-download-modal.component.html',
})
export class LearningOutcomeCsvDownloadModalComponent {
  public includeTaskOutcomes = false;

  constructor(
    private fileDownloaderService: FileDownloaderService,
    public dialogRef: MatDialogRef<LearningOutcomeCsvDownloadModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {unit: Unit},
  ) {}

  downloadCsv() {
    const name = this.data.unit.code;
    const url = this.data.unit.getOutcomeBatchUploadUrl();
    this.fileDownloaderService.downloadFile(url, `${name}-learning-outcomes.csv`);
  }
}
