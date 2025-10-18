import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'usd',
  standalone: true,
  pure: true,
})
export class UsdCurrencyPipe implements PipeTransform {
  transform(value: number | string | null | undefined, fractionDigits: number = 0): string {
    if (value === null || value === undefined || value === '' || isNaN(Number(value))) {
      return '$0';
    }
    const num = Number(value);
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    return formatter.format(num);
  }
}