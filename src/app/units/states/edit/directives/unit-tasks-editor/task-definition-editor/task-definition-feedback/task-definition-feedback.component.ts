import {AfterViewInit, Component, Inject, Input, ViewChild} from '@angular/core';
import {MatTable, MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {TaskDefinition, FeedbackTemplate, Unit} from 'src/app/api/models/doubtfire-model';
import {TaskDefinitionService} from 'src/app/api/services/task-definition.service';
import {AlertService} from 'src/app/common/services/alert.service';
import {MatSort, Sort} from '@angular/material/sort';
import {
  confirmationModal,
  csvResultModalService,
  csvUploadModalService,
} from 'src/app/ajs-upgraded-providers';
import {Subscription} from 'rxjs';
import {FeedbackTemplateService} from 'src/app/api/services/feedback-template.service';

@Component({
  selector: 'f-task-definition-feedback',
  templateUrl: 'task-definition-feedback.component.html',
  styleUrls: ['task-definition-feedback.component.scss'],
})
export class TaskDefinitionFeedbackComponent implements AfterViewInit {
  @ViewChild(MatTable, {static: false}) table: MatTable<FeedbackTemplate>;
  @ViewChild(MatSort, {static: false}) sort: MatSort;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator;

  @Input() taskDefinition: TaskDefinition;

  public feedbackTemplateSource: MatTableDataSource<FeedbackTemplate>;
  public columns: string[] = [
    'learningOutcome',
    'chipText',
    'description',
    'commentText',
    'summaryText',
    'feedbackTemplateAction',
  ];
  public filter: string;
  public selectedFeedbackTemplate: FeedbackTemplate;

  constructor(
    private alerts: AlertService,
    private taskDefinitionService: TaskDefinitionService,
    private feedbackTemplateService: FeedbackTemplateService,
    @Inject(csvResultModalService) private csvResultModalService: any,
    @Inject(csvUploadModalService) private csvUploadModal: any,
    @Inject(confirmationModal) private confirmationModal: any,
  ) {}

  public get unit(): Unit {
    return this.taskDefinition?.unit;
  }

  ngAfterViewInit(): void {
    this.subscriptions.push(
      this.taskDefinition.feedbackTemplateCache.values.subscribe((feedbackTemplates) => {
        this.feedbackTemplateSource = new MatTableDataSource<FeedbackTemplate>(feedbackTemplates);
        this.feedbackTemplateSource.paginator = this.paginator;
        this.feedbackTemplateSource.sort = this.sort;
        this.feedbackTemplateSource.filterPredicate = (data: any, filter: string) =>
          data.matches(filter);
      }),
    );
  }

  public saveFeedbackTemplate(feedbackTemplate: FeedbackTemplate) {
    feedbackTemplate.save().subscribe(() => {
      this.alerts.success('Template saved');
      feedbackTemplate.setOriginalSaveData(this.feedbackTemplateService.mapping);
    });
  }

  private subscriptions: Subscription[] = [];
  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  public selectFeedbackTemplate(feedbackTemplate: FeedbackTemplate) {
    if (this.selectedFeedbackTemplate === feedbackTemplate) {
      this.selectedFeedbackTemplate = null;
    } else {
      this.selectedFeedbackTemplate = feedbackTemplate;

      if (!this.selectedFeedbackTemplate.hasOriginalSaveData) {
        this.selectedFeedbackTemplate.setOriginalSaveData(this.feedbackTemplateService.mapping);
      }
    }
  }

  public sortData(sort: Sort) {
    const data = this.feedbackTemplateSource.data;

    if (!sort.active || sort.direction === '') {
      this.feedbackTemplateSource.data = data;
      return;
    }

    this.feedbackTemplateSource.data = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'learningOutcome':
          return this.compare(a.learningOutcome, b.learningOutcome, isAsc);
        case 'chipText':
          return this.compare(a.chipText, b.chipText, isAsc);
        case 'description':
          return this.compare(a.description, b.description, isAsc);
        case 'commentText':
          return this.compare(a.commentText, b.commentText, isAsc);
        case 'summaryText':
          return this.compare(a.summaryText, b.summaryText, isAsc);
        default:
          return 0;
      }
    });
  }

  public compare(a: number | string, b: number | string, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  applyFilter(filterValue: string) {
    this.feedbackTemplateSource.filter = filterValue.trim().toLowerCase();

    if (this.feedbackTemplateSource.paginator) {
      this.feedbackTemplateSource.paginator.firstPage();
    }
  }

  public feedbackTemplateHasChanges(feedbackTemplate: FeedbackTemplate): boolean {
    return feedbackTemplate.hasChanges(this.feedbackTemplateService.mapping);
  }

  public deleteFeedbackTemplate(feedbackTemplate: FeedbackTemplate) {
    this.confirmationModal.show(
      'Delete feedback template',
      'Are you sure you want to delete this template? This action is final.',
      () => {
        this.alerts.success('Task deleted');
      },
    );
  }

  public uploadFeedbackTemplatesCsv() {
    this.csvUploadModal.show(
      'Upload Feedback Templates as CSV',
      'Test message',
      {file: {name: 'Feedback Template CSV Data', type: 'csv'}},
      this.unit.getTaskDefinitionBatchUploadUrl(),
      (response: any) => {},
    );
  }

  public createFeedbackTemplate() {
    const feedbackTemplate = new FeedbackTemplate(this.taskDefinition);

    feedbackTemplate.learningOutcome = 'TLO';
    feedbackTemplate.chipText = 'lorem';
    feedbackTemplate.description = 'Lorem ipsum dolor';
    feedbackTemplate.commentText = 'Lorem dolor';
    feedbackTemplate.summaryText = 'Lorem ipsum';

    this.selectedFeedbackTemplate = feedbackTemplate;
  }
}
