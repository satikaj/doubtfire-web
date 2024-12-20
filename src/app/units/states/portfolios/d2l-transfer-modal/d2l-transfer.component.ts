//
// Modal to show Doubtfire version info
//
import { HttpClient } from '@angular/common/http';
import {Injectable, Component, Inject} from '@angular/core';
import {MatDialog, MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {D2lAssessmentMapping} from 'src/app/api/models/d2l/d2l_assessment_mapping';
import {D2lAssessmentMappingService} from 'src/app/api/models/doubtfire-model';
import {Unit} from 'src/app/api/models/unit';
import { FileDownloaderService } from 'src/app/common/file-downloader/file-downloader.service';
import {AlertService} from 'src/app/common/services/alert.service';
import { DoubtfireConstants } from 'src/app/config/constants/doubtfire-constants';

@Component({
  selector: 'f-d2l-transfer',
  templateUrl: 'd2l-transfer.component.html',
  styleUrl: 'd2l-transfer.component.scss',
})
export class D2lTransferComponent {
  public d2lDataMapping: D2lAssessmentMapping = new D2lAssessmentMapping(this.data);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Unit,
    @Inject(MatDialogRef<D2lTransferComponent>)
    public dialogRef: MatDialogRef<D2lTransferComponent>,
    private alertService: AlertService,
    public d2lAssessmentMappingService: D2lAssessmentMappingService,
    public httpClient: HttpClient,
    public doubtfireConstants: DoubtfireConstants,
    public fileDownloader: FileDownloaderService,
  ) {}

  public openD2l(): void {
    const url = `${this.doubtfireConstants.API_URL}/d2l/login_url`;
    this.httpClient.post<string>(url, {}).subscribe({
      next: (response) => {
        window.open(response, '_blank');
      },
      error: (err) => {
        this.alertService.error(`Failed to get D2L login URL: ${err}`);
      },
    });
  }

  public startTransfer(): void {
    const url = `${this.doubtfireConstants.API_URL}/units/${this.data.id}/d2l/grades`;
    this.httpClient.post(url, {}).subscribe({
      next: () => {
        this.alertService.success('Transfer started');
      },
      error: (err) => {
        this.alertService.error(`Failed to start transfer: ${err}`);
      },
    });
  }

  public downloadRecord(): void {
    const url = `${this.doubtfireConstants.API_URL}/units/${this.data.id}/d2l/grades`;
    this.fileDownloader.downloadFile(url, `${this.data.code}-d2l-grades.csv`);
  }
}

/**
 * The about doubtfire modal service - used to create and show the modal
 */
// eslint-disable-next-line max-classes-per-file
@Injectable()
export class D2lTransferModal {
  constructor(public dialog: MatDialog) {}

  public open(unit: Unit): void {
    // Show dialog while the data above is being fetched
    this.dialog.open(D2lTransferComponent, {
      width: '600px',
      data: unit,
    });
  }
}
