import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [],
  templateUrl: './components/page-not-found.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageNotFound {}
