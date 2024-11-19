import {Entity, EntityMapping} from 'ngx-entity-service';
import {Observable} from 'rxjs';
import {AppInjector} from 'src/app/app-injector';
import {TaskDefinition} from './task-definition';
import {FeedbackTemplateService} from '../services/feedback-template.service';

export class FeedbackTemplate extends Entity {
  id: number;
  learningOutcome: string;
  chipText: string;
  description: string;
  commentText: string;
  summaryText: string;

  readonly taskDefinition: TaskDefinition;

  constructor(taskDef: TaskDefinition) {
    super();
    this.taskDefinition = taskDef;
  }

  public toJson<T extends Entity>(mappingData: EntityMapping<T>, ignoreKeys?: string[]): object {
    return {
      feedback_template: super.toJson(mappingData, ignoreKeys),
    };
  }

  public save(): Observable<FeedbackTemplate> {
    const svc = AppInjector.get(FeedbackTemplateService);

    if (this.isNew) {
      return svc.create(
        {
          taskDefId: this.taskDefinition.id,
        },
        {
          entity: this,
          cache: this.taskDefinition.feedbackTemplateCache,
          constructorParams: this.taskDefinition,
        },
      );
    } else {
      return svc.update(
        {
          taskDefId: this.taskDefinition.id,
          id: this.id,
        },
        {entity: this},
      );
    }
  }

  private originalSaveData: string;

  public get hasOriginalSaveData(): boolean {
    return this.originalSaveData !== undefined && this.originalSaveData !== null;
  }

  public setOriginalSaveData(mapping: EntityMapping<FeedbackTemplate>) {
    this.originalSaveData = JSON.stringify(this.toJson(mapping));
  }

  public hasChanges<T extends Entity>(mapping: EntityMapping<T>): boolean {
    if (!this.originalSaveData) {
      return false;
    }

    return this.originalSaveData != JSON.stringify(this.toJson(mapping));
  }

  public get isNew(): boolean {
    return !this.id;
  }

  public get taskDefId(): number {
    return this.taskDefinition.id;
  }
}
