import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvailabilitySlot } from '../../models/Availability';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css',
})
export class CalendarComponent {
  @Input() availabilities: AvailabilitySlot[] = [];
  @Input() selectedDate: string | null = null;
  @Output() dateSelected = new EventEmitter<string>();

  currentMonth = signal(new Date());
  weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  calendarDates = computed(() => {
    const month = this.currentMonth();
    const year = month.getFullYear();
    const monthIndex = month.getMonth();

    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const dates = [];
    const currentDate = new Date(startDate);

    while (currentDate <= lastDay || dates.length % 7 !== 0) {
      const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const dayAvailabilities = this.availabilities.filter(
        (a) => a.date === dateString,
      );

      dates.push({
        date: new Date(currentDate),
        dateString,
        day: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === monthIndex,
        isToday: currentDate.toDateString() === new Date().toDateString(),
        isSelected: dateString === this.selectedDate,
        hasAvailabilities: dayAvailabilities.length > 0,
        availabilities: dayAvailabilities,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  });

  onDateClick(dateString: string): void {
    this.dateSelected.emit(dateString);
  }

  previousMonth(): void {
    const current = this.currentMonth();
    this.currentMonth.set(
      new Date(current.getFullYear(), current.getMonth() - 1, 1),
    );
  }

  nextMonth(): void {
    const current = this.currentMonth();
    this.currentMonth.set(
      new Date(current.getFullYear(), current.getMonth() + 1, 1),
    );
  }

  getMonthName(): string {
    const month = this.currentMonth();
    return month.toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });
  }

  getDateAriaLabel(dateInfo: { dateString: string; isToday: boolean; isSelected: boolean; isCurrentMonth: boolean }): string {
    const date = new Date(dateInfo.dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    let label = date.toLocaleDateString('fr-FR', options);

    if (dateInfo.isToday) {
      label += ", aujourd'hui";
    }
    if (dateInfo.isSelected) {
      label += ', sélectionné';
    }
    if (!dateInfo.isCurrentMonth) {
      label += ', hors du mois en cours';
    }

    return label;
  }
}
