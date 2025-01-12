import {
  AfterViewInit,
  Component,
  computed,
  inject,
  Inject,
  Input,
  model,
  OnDestroy,
  OnInit,
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
import {FileDownloaderService} from '../file-downloader/file-downloader.service';

@Component({
  selector: 'f-feedback-template-editor',
  templateUrl: 'feedback-template-editor.component.html',
})
export class FeedbackTemplateEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() context?: TaskDefinition | Unit;

  @ViewChild('outcomeTable', {static: false}) outcomeTable: MatTable<LearningOutcome>;
  @ViewChild(MatSort, {static: false}) outcomeSort: MatSort;
  @ViewChild('outcomePaginator', {static: false}) outcomePaginator: MatPaginator;

  public outcomeSource: MatTableDataSource<LearningOutcome>;
  public outcomeColumns: string[] = [
    'abbreviation',
    'shortDescription',
    'fullOutcomeDescription',
    'connectedOutcomes',
    'learningOutcomeAction',
  ];
  public selectedOutcome: LearningOutcome;
  public abbreviationPrefix: 'TLO' | 'ULO' | 'GLO';

  public allOutcomes: LearningOutcome[] = [];
  public selectedConnectedOutcomes = signal([]);

  @ViewChild('templateTable', {static: false}) templateTable: MatTable<FeedbackTemplate>;
  @ViewChild(MatSort, {static: false}) templateSort: MatSort;
  @ViewChild('templatePaginator', {static: false}) templatePaginator: MatPaginator;

  public templateSource: MatTableDataSource<FeedbackTemplate>;
  public templateColumns: string[] = [
    'parent',
    'chipText',
    'description',
    'commentText',
    'summaryText',
    'taskStatus',
    'feedbackTemplateAction',
  ];
  public selectedTemplate: FeedbackTemplate;

  private subscriptions: Subscription[] = [];

  constructor(
    private alerts: AlertService,
    private learningOutcomeService: LearningOutcomeService,
    private feedbackTemplateService: FeedbackTemplateService,
    private fileDownloaderService: FileDownloaderService,
    @Inject(csvResultModalService) private csvResultModalService: any,
    @Inject(csvUploadModalService) private csvUploadModal: any,
    @Inject(confirmationModal) private confirmationModal: any,
  ) {}

  ngOnInit(): void {
    if (!this.context) this.abbreviationPrefix = 'GLO';
    else if (this.context instanceof TaskDefinition) this.abbreviationPrefix = 'TLO';
    else if (this.context instanceof Unit) this.abbreviationPrefix = 'ULO';
  }

  ngAfterViewInit(): void {
    this.subscriptions.push(
      this.context.learningOutcomesCache.values.subscribe((learningOutcomes) => {
        this.outcomeSource = new MatTableDataSource<LearningOutcome>(learningOutcomes);
        this.outcomeSource.paginator = this.outcomePaginator;
        this.outcomeSource.sort = this.outcomeSort;
        this.outcomeSource.filterPredicate = (data: LearningOutcome, filter: string) => {
          const filterValue = filter.trim().toLowerCase();
          return (
            data.abbreviation.toLowerCase().includes(filterValue) ||
            data.shortDescription.toLowerCase().includes(filterValue) ||
            data.fullOutcomeDescription.toLowerCase().includes(filterValue)
          );
        };
      }),
      this.learningOutcomeService.cache.values.subscribe((outcomes) => {
        const glos = outcomes.filter((outcome) => outcome.contextType === null);
        this.allOutcomes = [...this.allOutcomes, ...glos];
      }),
    );

    if (this.context instanceof TaskDefinition) {
      this.subscriptions.push(
        this.context.unit.learningOutcomesCache.values.subscribe((learningOutcomes) => {
          this.allOutcomes = [...this.allOutcomes, ...learningOutcomes];
        }),
      );
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  public getFeedbackChips() {
    this.context.feedbackTemplateCache.values.subscribe((feedbackTemplates) => {
      this.templateSource = new MatTableDataSource<FeedbackTemplate>(feedbackTemplates);
      this.templateSource.paginator = this.templatePaginator;
      this.templateSource.sort = this.templateSort;
      this.templateSource.filterPredicate = (data: FeedbackTemplate, filter: string) => {
        const filterValue = filter.trim().toLowerCase();
        return (
          data.chipText.toLowerCase().includes(filterValue) ||
          data.commentText.toLowerCase().includes(filterValue) ||
          data.summaryText.toLowerCase().includes(filterValue) ||
          data.description.toLowerCase().includes(filterValue)
        );
      };
    });
  }

  public saveLearningOutcome() {
    for (const outcome of this.selectedConnectedOutcomes()) {
      this.selectedOutcome.linkedOutcomeIds.push(outcome.id);
    }
    this.selectedOutcome.save().subscribe({
      next: () => {
        this.alerts.success('Outcome saved');
        this.selectedOutcome.setOriginalSaveData(this.learningOutcomeService.mapping);
      },
      error: () => this.alerts.error('Failed to save learning outcome. Please try again.'),
    });
  }

  public saveFeedbackTemplate() {
    this.selectedTemplate.save().subscribe({
      next: () => {
        this.alerts.success('Template saved');
        this.selectedTemplate.setOriginalSaveData(this.feedbackTemplateService.mapping);
      },
      error: () => this.alerts.error('Failed to save feedback template. Please try again.'),
    });
  }

  public selectLearningOutcome(learningOutcome: LearningOutcome) {
    if (this.selectedOutcome === learningOutcome) {
      this.selectedOutcome = null;
      this.selectedConnectedOutcomes.update((_selectedConnectedOutcomes) => []);
    } else {
      this.selectedOutcome = learningOutcome;
      this.selectedConnectedOutcomes.update(() => this.getLinkedOutcomes(learningOutcome));
      if (!this.selectedOutcome.context) this.selectedOutcome.context = this.context;

      if (!this.selectedOutcome.hasOriginalSaveData) {
        this.selectedOutcome.setOriginalSaveData(this.learningOutcomeService.mapping);
      }

      this.getFeedbackChips();
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
        case 'abbreviation':
          return this.compare(a.abbreviation, b.abbreviation, isAsc);
        case 'shortDescription':
          return this.compare(a.shortDescription, b.shortDescription, isAsc);
        case 'fullOutcomeDescription':
          return this.compare(a.fullOutcomeDescription, b.fullOutcomeDescription, isAsc);
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
        case 'chipText':
          return this.compare(a.chipText, b.chipText, isAsc);
        default:
          return 0;
      }
    });
  }

  public compare(a: number | string, b: number | string, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  applyFilter(filterValue: string, table: string) {
    if (table === 'outcome') {
      this.outcomeSource.filter = filterValue;
      if (this.outcomeSource.paginator) {
        this.outcomeSource.paginator.firstPage();
      }
    } else if (table === 'template') {
      this.templateSource.filter = filterValue;
      if (this.templateSource.paginator) {
        this.templateSource.paginator.firstPage();
      }
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
        learningOutcome.delete().subscribe({
          next: () => this.alerts.success('Learning outcome deleted'),
          error: () => this.alerts.error('Failed to delete learning outcome. Please try again.'),
        });
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

  public uploadCsv(type: 'Learning Outcomes' | 'Feedback Templates') {
    const url =
      type === 'Learning Outcomes'
        ? this.context.getOutcomeBatchUploadUrl()
        : this.context.getFeedbackTemplateBatchUploadUrl();

    this.csvUploadModal.show(
      `Upload ${type} as CSV`,
      'Test message',
      {file: {name: `${type} CSV Data`, type: 'csv'}},
      url,
      (response: any) => {
        this.csvResultModalService.show(`${type} CSV Upload Results`, response);
        if (response.success.length > 0) {
          this.context.refresh();
        }
      },
    );
  }

  public downloadCsv(type: 'learning-outcomes' | 'feedback-templates') {
    let name: string = '';
    if (this.context instanceof TaskDefinition) name = this.context.abbreviation;
    else if (this.context instanceof Unit) name = this.context.code;

    const url =
      type === 'learning-outcomes'
        ? this.context.getOutcomeBatchUploadUrl()
        : this.context.getFeedbackTemplateBatchUploadUrl();

    this.fileDownloaderService.downloadFile(url, `${name}-${type}.csv`);
  }

  public createLearningOutcome() {
    const learningOutcome = new LearningOutcome();

    learningOutcome.context = this.context;

    if (this.context) {
      if (this.context instanceof TaskDefinition) learningOutcome.contextType = 'TaskDefinition';
      else if (this.context instanceof Unit) learningOutcome.contextType = 'Unit';
      learningOutcome.contextId = this.context.id;
    }
    learningOutcome.abbreviation = this.abbreviationPrefix;
    learningOutcome.shortDescription = '';
    learningOutcome.fullOutcomeDescription = '';

    this.selectedOutcome = learningOutcome;
  }

  public createFeedbackTemplate() {
    const feedbackTemplate = new FeedbackTemplate(this.context);

    feedbackTemplate.type = 'Template';
    feedbackTemplate.chipText = '';
    feedbackTemplate.description = '';
    feedbackTemplate.commentText = '';
    feedbackTemplate.summaryText = '';

    this.selectedTemplate = feedbackTemplate;
  }

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  readonly typedConnectedOutcome = model('');
  readonly filteredOutcomes = computed(() => {
    const currentOutcome = this.typedConnectedOutcome().toLowerCase();
    return this.allOutcomes.filter((outcome) => {
      const abbreviation = outcome.abbreviation?.toLowerCase();
      return (
        !this.selectedConnectedOutcomes().includes(outcome) &&
        (!currentOutcome || abbreviation?.includes(currentOutcome))
      );
    });
  });

  readonly announcer = inject(LiveAnnouncer);

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value) {
      const outcome = this.allOutcomes.find(
        (o) => o.abbreviation?.toLowerCase() === value.toLowerCase(),
      );
      if (outcome && !this.selectedConnectedOutcomes().includes(outcome)) {
        this.selectedConnectedOutcomes.update((selectedConnectedOutcomes) => [
          ...selectedConnectedOutcomes,
          outcome,
        ]);
      }
    }

    this.typedConnectedOutcome.set('');
  }

  remove(outcome: LearningOutcome): void {
    this.selectedConnectedOutcomes.update((selectedConnectedOutcomes) => {
      const updatedOutcomes = selectedConnectedOutcomes.filter(
        (o) => o.abbreviation !== outcome.abbreviation,
      );
      this.announcer.announce(`Removed ${outcome.abbreviation}`);
      return updatedOutcomes;
    });
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const outcome = this.allOutcomes.find((o) => o.abbreviation === event.option.viewValue);

    if (outcome && !this.selectedConnectedOutcomes().includes(outcome)) {
      this.selectedConnectedOutcomes.update((selectedConnectedOutcomes) => [
        ...selectedConnectedOutcomes,
        outcome,
      ]);
    }

    this.typedConnectedOutcome.set('');
    event.option.deselect();
  }

  getLinkedOutcomes(learningOutcome: LearningOutcome): LearningOutcome[] {
    return this.allOutcomes.filter((outcome) =>
      learningOutcome.linkedOutcomeIds.includes(outcome.id),
    );
  }
}
