import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { WebSocketNotificationService } from './shared/services/websocket-notification.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'Klassio';
  
  // Inject WebSocket service to ensure it's initialized early
  private readonly webSocketService = inject(WebSocketNotificationService);

  ngOnInit(): void {
    // Note: Browser notification permission should be requested by user action
    // Call webSocketService.requestNotificationPermission() from a button click instead
  }
}
