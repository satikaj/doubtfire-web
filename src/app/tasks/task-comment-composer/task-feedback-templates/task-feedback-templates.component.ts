import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {combineLatest, map, Observable} from 'rxjs';
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
  categories = ['TLO', 'ULO', 'GLO'];
  searchTerm: string = '';
  hoveredTemplate: FeedbackTemplate;

  public tlos$: Observable<{outcome: LearningOutcome; templates: FeedbackTemplate[]}[]>;
  public ulos$: Observable<{outcome: LearningOutcome; templates: FeedbackTemplate[]}[]>;

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
    }
  }

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
    console.log('Selected template:', template);
  }

  onHoverTemplate(template: FeedbackTemplate) {
    this.hoveredTemplate = template;
  }
}
