import { Pipe, PipeTransform } from '@angular/core';

type FormatType = 'date' | 'datetime' | 'time' | 'sessionDate';

@Pipe({ name: 'dateFormat', standalone: true })
export class DateFormatPipe implements PipeTransform {
  private readonly formats: Record<FormatType, Intl.DateTimeFormatOptions> = {
    date: {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    } as const,
    datetime: {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    } as const,
    time: {
      hour: '2-digit',
      minute: '2-digit',
    } as const,
    sessionDate: {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    } as const,
  };

  transform(
    value: Date | string | null | undefined,
    format: FormatType = 'date',
  ): string {
    if (!value) return '';

    const d = typeof value === 'string' ? new Date(value) : value;

    if (isNaN(d.getTime())) {
      console.warn('DateFormatPipe: Invalid date', value);
      return '';
    }

    return d.toLocaleDateString('fr-FR', this.formats[format]);
  }
}
