import {Entity, EntityMapping} from 'ngx-entity-service';
import {Observable} from 'rxjs';
import {AppInjector} from 'src/app/app-injector';
import {LearningOutcomeService} from './doubtfire-model';

export class LearningOutcome extends Entity {
  id: number;
  contextType: string;
  contextId: number;
  iloNumber: number;
  abbreviation: string;
  shortDescription: string;
  fullOutcomeDescription: string;

  contextTypePaths = {
    'Unit': 'units',
    'TaskDefinition': 'task_definitions',
    'Course': 'courses',
  };

  public save(): Observable<LearningOutcome> {
    const svc = AppInjector.get(LearningOutcomeService);

    if (this.isNew) {
      return svc.create(
        {
          contextType: this.contextTypePaths[this.contextType],
          contextId: this.contextId,
        },
        {entity: this},
      );
    } else {
      return svc.update(
        {
          contextType: this.contextTypePaths[this.contextType],
          contextId: this.contextId,
          id: this.id,
        },
        {entity: this, endpointFormat: LearningOutcomeService.updateEndpoint},
      );
    }
  }

  private originalSaveData: string;

  public get hasOriginalSaveData(): boolean {
    return this.originalSaveData !== undefined && this.originalSaveData !== null;
  }

  /**
   * To check if things have changed, we need to get the initial save data... as it
   * isn't empty by default. We can then use
   * this to check if there are changes.
   *
   * @param mapping the mapping to get changes
   */
  public setOriginalSaveData(mapping: EntityMapping<LearningOutcome>) {
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
}
