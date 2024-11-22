import {
  AfterViewInit,
  Component,
  computed,
  inject,
  Inject,
  Input,
  model,
  signal,
  ViewChild,
} from '@angular/core';
import {MatTable, MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {
  TaskDefinition,
  Unit,
  LearningOutcome,
  LearningOutcomeService,
  FeedbackTemplate,
} from 'src/app/api/models/doubtfire-model';
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
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {LiveAnnouncer} from '@angular/cdk/a11y';
import {MatChipInputEvent} from '@angular/material/chips';
import {MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';

@Component({
  selector: 'f-feedback-template-editor',
  templateUrl: 'feedback-template-editor.component.html',
})
export class FeedbackTemplateEditorComponent implements AfterViewInit {
  @Input() taskDefinition: TaskDefinition;

  @ViewChild(MatTable, {static: false}) outcomeTable: MatTable<LearningOutcome>;
  @ViewChild(MatSort, {static: false}) outcomeSort: MatSort;
  @ViewChild(MatPaginator, {static: false}) outcomePaginator: MatPaginator;

  public outcomeSource: MatTableDataSource<LearningOutcome>;
  public outcomeColumns: string[] = [
    'number',
    'tag',
    'name',
    'description',
    'learningOutcomeAction',
  ];
  public outcomeFilter: string;
  public selectedOutcome: LearningOutcome;

  @ViewChild(MatTable, {static: false}) templateTable: MatTable<FeedbackTemplate>;
  @ViewChild(MatSort, {static: false}) templateSort: MatSort;
  @ViewChild(MatPaginator, {static: false}) templatePaginator: MatPaginator;

  public templateSource: MatTableDataSource<FeedbackTemplate>;
  public templateColumns: string[] = [
    'number',
    'chipText',
    'description',
    'commentText',
    'summaryText',
    'feedbackTemplateAction',
  ];
  public templateFilter: string;
  public selectedTemplate: FeedbackTemplate;

  constructor(
    private alerts: AlertService,
    private taskDefinitionService: TaskDefinitionService,
    private learningOutcomeService: LearningOutcomeService,
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
      this.unit.learningOutcomesCache.values.subscribe((learningOutcomes) => {
        this.outcomeSource = new MatTableDataSource<LearningOutcome>(learningOutcomes);
        this.outcomeSource.paginator = this.outcomePaginator;
        this.outcomeSource.sort = this.outcomeSort;
        this.outcomeSource.filterPredicate = (data: any, filter: string) => data.matches(filter);
      }),
      this.taskDefinition.feedbackTemplateCache.values.subscribe((feedbackTemplates) => {
        this.templateSource = new MatTableDataSource<FeedbackTemplate>(feedbackTemplates);
        this.templateSource.paginator = this.templatePaginator;
        this.templateSource.sort = this.templateSort;
        this.templateSource.filterPredicate = (data: any, filter: string) => data.matches(filter);
      }),
    );
  }

  public saveLearningOutcome(learningOutcome: LearningOutcome) {
    // learningOutcome.save().subscribe(() => {
    //   this.alerts.success('Outcome saved');
    //   learningOutcome.setOriginalSaveData(this.learningOutcomeService.mapping);
    // });
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

  public selectLearningOutcome(learningOutcome: LearningOutcome) {
    if (this.selectedOutcome === learningOutcome) {
      this.selectedOutcome = null;
    } else {
      this.selectedOutcome = learningOutcome;

      // if (!this.selectedFeedbackTemplate.hasOriginalSaveData) {
      //   this.selectedFeedbackTemplate.setOriginalSaveData(this.feedbackTemplateService.mapping);
      // }
    }
  }

  public selectFeedbackTemplate(feedbackTemplate: FeedbackTemplate) {
    if (this.selectedTemplate === feedbackTemplate) {
      this.selectedTemplate = null;
    } else {
      this.selectedTemplate = feedbackTemplate;

      if (!this.selectedTemplate.hasOriginalSaveData) {
        this.selectedTemplate.setOriginalSaveData(this.feedbackTemplateService.mapping);
      }
    }
  }

  public sortOutcomeData(sort: Sort) {
    const data = this.outcomeSource.data;

    if (!sort.active || sort.direction === '') {
      this.outcomeSource.data = data;
      return;
    }

    this.outcomeSource.data = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'number':
          return this.compare(a.iloNumber, b.iloNumber, isAsc);
        case 'tag':
          return this.compare(a.abbreviation, b.abbreviation, isAsc);
        case 'name':
          return this.compare(a.name, b.name, isAsc);
        case 'description':
          return this.compare(a.description, b.description, isAsc);
        default:
          return 0;
      }
    });
  }

  public sortTemplateData(sort: Sort) {
    const data = this.templateSource.data;

    if (!sort.active || sort.direction === '') {
      this.templateSource.data = data;
      return;
    }

    this.templateSource.data = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'number':
          return this.compare(a.id, b.id, isAsc);
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

  applyOutcomeFilter(filterValue: string) {
    this.outcomeSource.filter = filterValue.trim().toLowerCase();

    if (this.outcomeSource.paginator) {
      this.outcomeSource.paginator.firstPage();
    }
  }

  applyTemplateFilter(filterValue: string) {
    this.templateSource.filter = filterValue.trim().toLowerCase();

    if (this.templateSource.paginator) {
      this.templateSource.paginator.firstPage();
    }
  }

  public learningOutcomeHasChanges(learningOutcome: LearningOutcome): boolean {
    return learningOutcome.hasChanges(this.learningOutcomeService.mapping);
  }

  public feedbackTemplateHasChanges(feedbackTemplate: FeedbackTemplate): boolean {
    return feedbackTemplate.hasChanges(this.feedbackTemplateService.mapping);
  }

  public deleteLearningOutcome(learningOutcome: LearningOutcome) {
    this.confirmationModal.show(
      'Delete learning outcome',
      'Are you sure you want to delete this outcome? This action is final.',
      () => {
        this.alerts.success('Outcome deleted');
      },
    );
  }

  public deleteFeedbackTemplate(feedbackTemplate: FeedbackTemplate) {
    this.confirmationModal.show(
      'Delete feedback template',
      'Are you sure you want to delete this template? This action is final.',
      () => {
        this.alerts.success('Template deleted');
      },
    );
  }

  public uploadLearningOutcomesCsv() {
    this.csvUploadModal.show(
      'Upload Learning Outcomes as CSV',
      'Test message',
      {file: {name: 'Learning Outcome CSV Data', type: 'csv'}},
      this.unit.getTaskDefinitionBatchUploadUrl(),
      (response: any) => {},
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

  public createLearningOutcome() {
    const learningOutcome = new LearningOutcome();

    learningOutcome.iloNumber = 1;
    learningOutcome.abbreviation = 'lm';
    learningOutcome.name = 'lorem';
    learningOutcome.description = 'Lorem ipsum dolor';

    this.selectedOutcome = learningOutcome;
  }

  public createFeedbackTemplate() {
    const feedbackTemplate = new FeedbackTemplate(this.taskDefinition);

    feedbackTemplate.id = 0;
    feedbackTemplate.chipText = 'lorem';
    feedbackTemplate.description = 'Lorem ipsum dolor';
    feedbackTemplate.commentText = 'Lorem dolor';
    feedbackTemplate.summaryText = 'Lorem ipsum';

    this.selectedTemplate = feedbackTemplate;
  }

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  readonly currentConnectedOutcome = model('');
  readonly connectedOutcomes = signal([]);
  readonly allOutcomes: string[] = ['TLO1', 'TLO2', 'TLO3', 'ULO1', 'ULO2'];
  readonly filteredOutcomes = computed(() => {
    const currentOutcome = this.currentConnectedOutcome().toLowerCase();
    return currentOutcome
      ? this.allOutcomes.filter((outcome) => outcome.toLowerCase().includes(currentOutcome))
      : this.allOutcomes.slice();
  });

  readonly announcer = inject(LiveAnnouncer);

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value) {
      this.connectedOutcomes.update((connectedOutcomes) => [...connectedOutcomes, value]);
    }

    this.currentConnectedOutcome.set('');
  }

  remove(outcome: string): void {
    this.connectedOutcomes.update((connectedOutcomes) => {
      const index = connectedOutcomes.indexOf(outcome);
      if (index < 0) {
        return connectedOutcomes;
      }

      connectedOutcomes.splice(index, 1);
      this.announcer.announce(`Removed ${outcome}`);
      return [...connectedOutcomes];
    });
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.connectedOutcomes.update((connectedOutcomes) => [
      ...connectedOutcomes,
      event.option.viewValue,
    ]);
    this.currentConnectedOutcome.set('');
    event.option.deselect();
  }
}
