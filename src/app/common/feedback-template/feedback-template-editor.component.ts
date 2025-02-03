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
  effect,
  ViewChild,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSelectChange } from '@angular/material/select';
import {
  TaskDefinition,
  Unit,
  LearningOutcome,
  LearningOutcomeService,
  FeedbackTemplate,
  TaskService,
  FeedbackTemplateService,
} from 'src/app/api/models/doubtfire-model';
import { AlertService } from 'src/app/common/services/alert.service';
import { MatSort, Sort } from '@angular/material/sort';
import {
  confirmationModal,
  csvResultModalService,
  csvUploadModalService,
} from 'src/app/ajs-upgraded-providers';
import { Subscription } from 'rxjs';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { FileDownloaderService } from '../file-downloader/file-downloader.service';
import { isEqual } from 'lodash';
import { NestedCsvDownloadModalService } from './nested-csv-download-modal/nested-csv-download-modal.service';
import API_URL from 'src/app/config/constants/apiURL';

@Component({
  selector: 'f-feedback-template-editor',
  templateUrl: 'feedback-template-editor.component.html',
})
export class FeedbackTemplateEditorComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() context?: TaskDefinition | Unit;

  @ViewChild('outcomeTable', { static: false }) outcomeTable: MatTable<LearningOutcome>;
  @ViewChild(MatSort, { static: false }) outcomeSort: MatSort;
  @ViewChild('outcomePaginator', { static: false }) outcomePaginator: MatPaginator;

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

  @ViewChild('templateTable', { static: false }) templateTable: MatTable<FeedbackTemplate>;
  @ViewChild(MatSort, { static: false }) templateSort: MatSort;
  @ViewChild('templatePaginator', { static: false }) templatePaginator: MatPaginator;

  public templateSource: MatTableDataSource<FeedbackTemplate>;
  public templateColumns: string[] = [
    'icon',
    'parent',
    'chipText',
    'description',
    'commentText',
    'summaryText',
    'taskStatus',
    'feedbackTemplateAction',
  ];
  public selectedTemplate: FeedbackTemplate;
  public possibleParents: FeedbackTemplate[];

  private subscriptions: Subscription[] = [];

  constructor(
    private alerts: AlertService,
    private learningOutcomeService: LearningOutcomeService,
    private feedbackTemplateService: FeedbackTemplateService,
    private fileDownloaderService: FileDownloaderService,
    private nestedCsvDownloadModalService: NestedCsvDownloadModalService,
    private taskService: TaskService,
    @Inject(csvResultModalService) private csvResultModalService: any,
    @Inject(csvUploadModalService) private csvUploadModal: any,
    @Inject(confirmationModal) private confirmationModal: any,
  ) {
    effect(() => {
      const linkedOutcomes = this.selectedConnectedOutcomes().map((outcome) => outcome.id);
      if (
        this.selectedOutcome &&
        !isEqual(linkedOutcomes.sort(), this.selectedOutcome.linkedOutcomeIds.sort())
      )
        this.selectedOutcome.linkedOutcomeIds = linkedOutcomes;
    });
  }

  ngOnInit(): void {
    if (!this.context) this.abbreviationPrefix = 'GLO';
    else if (this.context instanceof TaskDefinition) this.abbreviationPrefix = 'TLO';
    else if (this.context instanceof Unit) this.abbreviationPrefix = 'ULO';
  }

  ngAfterViewInit(): void {
    if (!this.context) {
      this.subscriptions.push(
        this.learningOutcomeService.cache.values.subscribe((outcomes) => {
          const glos = outcomes.filter((outcome) => outcome.contextType === null);
          this.outcomeSource = new MatTableDataSource<LearningOutcome>(glos);
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
      );
      return;
    }

    this.subscriptions.push(
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

  ngOnChanges(changes: SimpleChanges): void {
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
    );

    this.selectedOutcome = null;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  public getFeedbackChips() {
    this.feedbackTemplateService.cache.values.subscribe((templates) => {
      const outcomeTemplates = templates.filter(
        (temp) => temp.learningOutcomeId === this.selectedOutcome.id,
      );
      this.possibleParents = outcomeTemplates.filter((temp) => temp.type === 'group');

      this.templateSource = new MatTableDataSource<FeedbackTemplate>(outcomeTemplates);
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
      this.sortTemplateData({ active: 'chipText', direction: 'asc' });
    });
  }

  public saveLearningOutcome(learningOutcome: LearningOutcome) {
    learningOutcome.save().subscribe({
      next: () => {
        this.alerts.success('Outcome saved');
        learningOutcome.setOriginalSaveData(this.learningOutcomeService.mapping);
        this.selectLearningOutcome(this.selectedOutcome);
      },
      error: () => this.alerts.error('Failed to save learning outcome. Please try again.'),
    });
  }

  public saveFeedbackTemplate(feedbackTemplate: FeedbackTemplate) {
    feedbackTemplate.save().subscribe({
      next: () => {
        this.alerts.success('Template saved');
        feedbackTemplate.setOriginalSaveData(this.feedbackTemplateService.mapping);
        this.selectFeedbackTemplate(this.selectedTemplate);
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

      this.selectedTemplate = null;
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
    sort.active = sort.active || 'chipText';
    sort.direction = sort.direction || 'asc';

    const isAsc = sort.direction === 'asc';

    // Generic sorting function for dynamic property access
    const compare = (a: FeedbackTemplate, b: FeedbackTemplate) => {
      const key = sort.active as keyof FeedbackTemplate;
      const aValue = a[key];
      const bValue = b[key];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * (isAsc ? 1 : -1);
      }
      return 0;
    };

    // Initial sorting by the chosen method
    const sortedTemplates = [...this.templateSource.data].sort(compare);


    // Determine maximum depth of the hierarchy (only groups contribute to depth)
    const depthMap = new Map<number, number>();
    let maxDepth = 0;

    const feedbackGroups = sortedTemplates.filter(t => t.type === 'group');
    const feedbackTemplates = sortedTemplates.filter(t => t.type !== 'group');



    feedbackGroups.forEach((template) => {
      let depth = 0;
      let parentId = template.parentChipId;

      while (parentId) {
        depth++;
        parentId = sortedTemplates.find(t => t.id === parentId)?.parentChipId ?? null;
      }

      depthMap.set(template.id, depth);
      maxDepth = Math.max(maxDepth, depth);
    });


    // Assign sequential order numbers
    const orderMap = new Map<number, number>();
    let orderIndex = 1;

    sortedTemplates.forEach((template) => {
      orderMap.set(template.id, orderIndex++);
    });

    feedbackGroups.sort((a, b) => (depthMap.get(a.id)! - depthMap.get(b.id)!));

    // Assign hierarchical order to groups using depth-based multiplier
    feedbackGroups.forEach((template) => {
      const parentOrder = template.parentChipId ? orderMap.get(template.parentChipId)! : 0;
      const depth = depthMap.get(template.id) ?? 0;
      const multiplier = 10 ** (maxDepth + 5 - depth * 3); // Proper scaling based on depth

      orderMap.set(template.id, parentOrder + orderMap.get(template.id)! * multiplier);
    });

    // Assign order values to templates by directly adding their parent's order
    feedbackTemplates.forEach((template) => {
      const parentOrder = orderMap.get(template.parentChipId) ?? 0;
      orderMap.set(template.id, parentOrder + orderMap.get(template.id)!);

    });

    // Sort again by computed hierarchical order
    sortedTemplates.sort((a, b) => (orderMap.get(a.id)! - orderMap.get(b.id)!));


    // Update the data source
    this.templateSource.data = [...sortedTemplates];
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
          next: () => {
            this.alerts.success('Learning outcome deleted');
            if (this.selectedOutcome === learningOutcome)
              this.selectLearningOutcome(this.selectedOutcome);
          },
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
        feedbackTemplate.delete().subscribe({
          next: () => {
            this.alerts.success('Feedback template deleted');
            if (this.selectedTemplate === feedbackTemplate)
              this.selectFeedbackTemplate(this.selectedTemplate);
          },
          error: () => this.alerts.error('Failed to delete feedback template. Please try again.'),
        });
      },
    );
  }

  public uploadCsv(type: 'Learning Outcomes' | 'Feedback Templates', byOutcome: boolean) {
    let url: string;

    if (type === 'Learning Outcomes') url = this.context.getOutcomeBatchUploadUrl();
    else {
      if (byOutcome) url = this.selectedOutcome.getFeedbackTemplateBatchUploadUrl();
      else if (this.context) url = this.context.getFeedbackTemplateBatchUploadUrl();
      else url = `${API_URL}/global/feedback_chips/csv`;
    }

    this.csvUploadModal.show(
      `Upload ${type} as CSV`,
      'Test message',
      { file: { name: `${type} CSV Data`, type: 'csv' } },
      url,
      (response: any) => {
        this.csvResultModalService.show(`${type} CSV Upload Results`, response);
        if (response.success.length > 0) {
          this.context.refresh();
        }
      },
    );
  }

  public downloadCsv(type: 'Learning Outcomes' | 'Feedback Templates', byOutcome: boolean) {
    let url: string;

    if (type === 'Learning Outcomes') url = this.context.getOutcomeBatchUploadUrl();
    else {
      if (byOutcome) url = this.selectedOutcome.getFeedbackTemplateBatchUploadUrl();
      else if (this.context) url = this.context.getFeedbackTemplateBatchUploadUrl();
      else url = `${API_URL}/global/feedback_chips/csv`;
    }

    let name = `${type}.csv`;

    if (type === 'Feedback Templates' && byOutcome)
      name = `${this.selectedOutcome.abbreviation}-${name}`;
    if (this.context instanceof TaskDefinition)
      name = `${this.context.unit.code}-${this.context.abbreviation}-${name}`;
    else if (this.context instanceof Unit) name = `${this.context.code}-${name}`;

    if (this.context instanceof Unit && !byOutcome)
      this.nestedCsvDownloadModalService.show(url, name, type);
    else this.fileDownloaderService.downloadFile(url, name);
  }

  public createLearningOutcome() {
    const learningOutcome = new LearningOutcome();

    if (this.context) {
      learningOutcome.context = this.context;
      if (this.context instanceof TaskDefinition) learningOutcome.contextType = 'TaskDefinition';
      else if (this.context instanceof Unit) learningOutcome.contextType = 'Unit';
      learningOutcome.contextId = this.context.id;
    }
    learningOutcome.abbreviation = this.abbreviationPrefix + String(this.getNextOutcomeNumber());
    learningOutcome.shortDescription = '';
    learningOutcome.fullOutcomeDescription = '';
    this.selectedConnectedOutcomes.update((_selectedConnectedOutcomes) => []);

    this.templateSource = new MatTableDataSource<FeedbackTemplate>([]);
    this.selectedTemplate = null;

    this.selectedOutcome = learningOutcome;
  }

  public createFeedbackTemplate() {
    if (this.selectedOutcome.isNew) {
      this.alerts.error('Save the new outcome to proceed.');
      return;
    }

    const feedbackTemplate = new FeedbackTemplate();

    feedbackTemplate.type = 'template';
    feedbackTemplate.chipText = '';
    feedbackTemplate.description = '';
    feedbackTemplate.commentText = '';
    feedbackTemplate.summaryText = '';
    feedbackTemplate.learningOutcomeId = this.selectedOutcome.id;

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

  select(event: MatAutocompleteSelectedEvent): void {
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

  onTemplateTypeChange(event: MatSelectChange): void {
    if (!this.selectedTemplate.isNew) {
      this.alerts.error('Template type change forbidden.');
      event.source.writeValue(this.selectedTemplate.type);
    } else {
      this.selectedTemplate.type = event.value;
    }
  }

  getPossibleParents(): FeedbackTemplate[] {
    if (!this.selectedTemplate.isNew)
      return this.possibleParents.filter((p) => p.id != this.selectedTemplate.id);
    else return this.possibleParents;
  }

  getParentChipText(parentId: number): string {
    const parent = this.possibleParents.find((p) => p.id === parentId);
    return parent ? parent.chipText : '';
  }

  getNextOutcomeNumber(): number {
    if (this.outcomeSource.data && this.outcomeSource.data.length > 0) {
      let abbr = this.outcomeSource.data[this.outcomeSource.data.length - 1].abbreviation;
      abbr = abbr.replace(this.abbreviationPrefix, '');
      return Number(abbr) + 1;
    }
    return 1;
  }
}
