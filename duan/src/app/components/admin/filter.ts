import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], filterValue: string | null, field: string): any[] {
    if (!items || !filterValue) {
      return items;
    }
    return items.filter(item => item[field].toLowerCase() === filterValue.toLowerCase());
  }
}
