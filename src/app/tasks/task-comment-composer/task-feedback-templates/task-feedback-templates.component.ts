import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
  EventEmitter,
} from '@angular/core';
import {BehaviorSubject, combineLatest, map, Observable} from 'rxjs';
import {LearningOutcome, FeedbackTemplate, Task} from 'src/app/api/models/doubtfire-model';
import {FeedbackTemplateService} from 'src/app/api/services/feedback-template.service';
import {LearningOutcomeService} from 'src/app/api/services/learning-outcome.service';

@Component({
  selector: 'f-task-feedback-templates',
  styleUrl: './task-feedback-templates.component.scss',
  templateUrl: './task-feedback-templates.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class TaskFeedbackTemplatesComponent implements OnChanges {
  @Input() task: Task;
  @Output() templateSelected = new EventEmitter<FeedbackTemplate>();
  categories = ['TLO', 'ULO', 'GLO'];
  hoveredTemplate: FeedbackTemplate;

  public tlos$: Observable<{outcome: LearningOutcome; templates: FeedbackTemplate[]}[]>;
  public ulos$: Observable<{outcome: LearningOutcome; templates: FeedbackTemplate[]}[]>;
  public glos$ = combineLatest([
    this.learningOutcomeService.cache.values,
    this.feedbackTemplateService.cache.values,
  ]).pipe(
    map(([outcomes, templates]) =>
      outcomes
        .filter((outcome) => outcome.contextType === null)
        .map((outcome) => ({
          outcome: outcome,
          templates: templates.filter((template) => template.learningOutcomeId === outcome.id),
        })),
    ),
  );

  private searchTermSubject = new BehaviorSubject<string>('');
  searchTerm$ = this.searchTermSubject.asObservable();
  public filteredTlos$: Observable<{outcome: LearningOutcome; templates: FeedbackTemplate[]}[]>;
  public filteredUlos$: Observable<{outcome: LearningOutcome; templates: FeedbackTemplate[]}[]>;
  public filteredGlos$ = combineLatest([this.glos$, this.searchTerm$]).pipe(
    map(([glos, searchTerm]) =>
      glos
        .map((glo) => ({
          ...glo,
          templates: glo.templates.filter((template) =>
            template.chipText.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
        }))
        .filter((glo) => glo.templates.length > 0),
    ),
  );

  constructor(
    private learningOutcomeService: LearningOutcomeService,
    private feedbackTemplateService: FeedbackTemplateService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.task && this.task.definition) {
      this.tlos$ = combineLatest([
        this.task.definition.learningOutcomesCache.values,
        this.feedbackTemplateService.cache.values,
      ]).pipe(
        map(([outcomes, templates]) =>
          outcomes.map((outcome) => ({
            outcome: outcome,
            templates: templates.filter((template) => template.learningOutcomeId === outcome.id),
          })),
        ),
      );

      this.filteredTlos$ = combineLatest([this.tlos$, this.searchTerm$]).pipe(
        map(([tlos, searchTerm]) =>
          tlos
            .map((tlo) => ({
              ...tlo,
              templates: tlo.templates.filter((template) =>
                template.chipText.toLowerCase().includes(searchTerm.toLowerCase()),
              ),
            }))
            .filter((tlo) => tlo.templates.length > 0),
        ),
      );
    }

    if (this.task.unit) {
      this.ulos$ = combineLatest([
        this.task.unit.learningOutcomesCache.values,
        this.feedbackTemplateService.cache.values,
      ]).pipe(
        map(([outcomes, templates]) =>
          outcomes.map((outcome) => ({
            outcome: outcome,
            templates: templates.filter((template) => template.learningOutcomeId === outcome.id),
          })),
        ),
      );

      this.filteredUlos$ = combineLatest([this.ulos$, this.searchTerm$]).pipe(
        map(([ulos, searchTerm]) =>
          ulos
            .map((ulo) => ({
              ...ulo,
              templates: ulo.templates.filter((template) =>
                template.chipText.toLowerCase().includes(searchTerm.toLowerCase()),
              ),
            }))
            .filter((ulo) => ulo.templates.length > 0),
        ),
      );
    }
  }

  onSearchTermChange(searchTerm: string): void {
    this.searchTermSubject.next(searchTerm);
  }

  @ViewChild('tloSection') tloSection!: ElementRef;
  @ViewChild('uloSection') uloSection!: ElementRef;
  @ViewChild('gloSection') gloSection!: ElementRef;

  scrollToSection(event: any) {
    const sections = [this.tloSection, this.uloSection, this.gloSection];
    const selectedSection = sections[event.index];

    if (selectedSection) {
      selectedSection.nativeElement.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
  }

  selectTemplate(template: FeedbackTemplate) {
    this.templateSelected.emit(template);
  }

  onHoverTemplate(template: FeedbackTemplate) {
    this.hoveredTemplate = template;
  }
}
