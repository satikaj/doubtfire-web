import {Injectable} from '@angular/core';
import {CachedEntityService} from 'ngx-entity-service';
import {FeedbackTemplate} from '../models/feedback-template';
import {HttpClient} from '@angular/common/http';
import API_URL from 'src/app/config/constants/apiURL';
import {TaskDefinition} from '../models/task-definition';

@Injectable()
export class FeedbackTemplateService extends CachedEntityService<FeedbackTemplate> {
  protected readonly endpointFormat = 'feedback_templates/';

  constructor(httpClient: HttpClient) {
    super(httpClient, API_URL);

    this.mapping.addKeys(
      'id',
      'learningOutcome',
      'chipText',
      'description',
      'commentText',
      'summaryText',
    );
  }

  public override createInstanceFrom(json: object, other?: any): FeedbackTemplate {
    return new FeedbackTemplate(other as TaskDefinition);
  }
}
