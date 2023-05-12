import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class UtilService {

  constructor(
    private readonly translateService: TranslateService
  ) { }

  downloadFile(fileName: string, fileType: string, content: string) {
    const blob = new Blob([content], { type: fileType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  }

  getNumberOrdinals(offset: number, limit: number) {
    let suffixes = ['th', 'st', 'nd', 'rd'];
    let numbers = [];
    for (let i = offset; i <= limit; i++) {
      let ordinal = i + (suffixes[i] || suffixes[0]);
      numbers.push(ordinal);
    }

    return numbers;
  }

  /**
   * Translate a string using the application's translation service.
   * @param constant - A string constant to translate.
   * @returns The translated string.
   */
  translateString(constant: string): string {
    return this.translateService.instant(constant);
  }
}
