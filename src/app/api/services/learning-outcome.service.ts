import {CachedEntityService} from 'ngx-entity-service';
import {LearningOutcome} from 'src/app/api/models/doubtfire-model';
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import API_URL from 'src/app/config/constants/apiURL';
import {AppInjector} from 'src/app/app-injector';
import {DoubtfireConstants} from 'src/app/config/constants/doubtfire-constants';
import {Observable} from 'rxjs';

@Injectable()
export class LearningOutcomeService extends CachedEntityService<LearningOutcome> {
  protected readonly endpointFormat = ':contextType:/:contextId:/outcomes';
  public static updateEndpoint = ':contextType:/:contextId:/outcomes/:id:';

  constructor(httpClient: HttpClient) {
    super(httpClient, API_URL);

    this.mapping.addKeys(
      'id',
      'contextId',
      'contextType',
      'abbreviation',
      'shortDescription',
      'fullOutcomeDescription',
    );

    this.mapping.mapAllKeysToJsonExcept('id');
  }

  public createInstanceFrom(json: object, other?: any): LearningOutcome {
    return new LearningOutcome();
  }

  public globalOutcomes(): Observable<any> {
    const url = `${AppInjector.get(DoubtfireConstants).API_URL}/global/outcomes`;
    const httpClient = AppInjector.get(HttpClient);

    return httpClient.get<any>(url);
  }
}
