import {Injectable} from '@angular/core';
import {CachedEntityService} from 'ngx-entity-service';
import {FeedbackTemplate} from '../models/feedback-template';
import {HttpClient} from '@angular/common/http';
import API_URL from 'src/app/config/constants/apiURL';
import {TaskDefinition, Unit} from '../models/doubtfire-model';

@Injectable()
export class FeedbackTemplateService extends CachedEntityService<FeedbackTemplate> {
  protected readonly endpointFormat = 'feedback_templates/';

  constructor(httpClient: HttpClient) {
    super(httpClient, API_URL);

    this.mapping.addKeys(
      'id',
      'type',
      'chipText',
      'description',
      'commentText',
      'summaryText',
      'task_status_id',
      'parent_chip_id',
      'learning_outcome_id',
    );
  }

  public override createInstanceFrom(
    json: object,
    other?: TaskDefinition | Unit,
  ): FeedbackTemplate {
    return new FeedbackTemplate(other);
  }
}
