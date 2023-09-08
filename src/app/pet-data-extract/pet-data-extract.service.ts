
import { Injectable } from '@angular/core';
import { BaseService } from '../services/util/base.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PetDataExtractService extends BaseService  {

  public getPet(url: string): Observable<any> {
    return this.get(url);
  }

  public savePetExtractService(url: string, data: any): Observable<any> {
    return this.post(url, data);
  }
}
