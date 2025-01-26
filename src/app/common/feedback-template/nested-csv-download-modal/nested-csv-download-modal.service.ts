import {Injectable} from '@angular/core';
import {MatDialogRef, MatDialog} from '@angular/material/dialog';
import {NestedCsvDownloadModalComponent} from './nested-csv-download-modal.component';

@Injectable({
  providedIn: 'root',
})
export class NestedCsvDownloadModalService {
  constructor(public dialog: MatDialog) {}

  public show(url: string, name: string, type: string) {
    let dialogRef: MatDialogRef<NestedCsvDownloadModalComponent, any>;
    dialogRef = this.dialog.open(NestedCsvDownloadModalComponent, {data: {url, name, type}});
  }
}
