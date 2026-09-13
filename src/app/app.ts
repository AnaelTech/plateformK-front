import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from './shared/components/toast/toast';
import { WebSocketNotificationService } from './shared/services/websocket-notification.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  title = 'Klassio';

  // Inject WebSocket service to ensure it's initialized early
  private readonly webSocketService = inject(WebSocketNotificationService);
}
