import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Invoice } from '../../invoices/models/Invoice';
import { Student } from '../student/models/Student';

interface Course {
  id: number;
  student: string;
  date: Date;
  duration: number;
  subject: string;
  status: 'confirmed' | 'pending' | 'completed';
  price: number;
}

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './components/teacher-dashboard.component.html',
})
export class TeacherDashboardComponent implements OnInit {
  activeTab: 'overview' | 'courses' | 'students' | 'invoices' | 'calendar' =
    'overview';

  // Statistiques
  stats = {
    totalStudents: 12,
    monthlyRevenue: 2450,
    pendingCourses: 5,
    completedCourses: 34,
  };

  // Étudiants
  students: Student[] = [
    {
      id: 1,
      name: 'Marie Dubois',
      email: 'marie.d@email.com',
      parent: 'Sophie Dubois',
      level: 'Terminale S',
      nextSession: new Date('2025-01-15'),
    },
    {
      id: 2,
      name: 'Lucas Martin',
      email: 'lucas.m@email.com',
      parent: 'Pierre Martin',
      level: '1ère ES',
      nextSession: new Date('2025-01-16'),
    },
    {
      id: 3,
      name: 'Emma Bernard',
      email: 'emma.b@email.com',
      parent: 'Claire Bernard',
      level: 'Seconde',
      nextSession: new Date('2025-01-17'),
    },
  ];

  // Cours
  courses: Course[] = [
    {
      id: 1,
      student: 'Marie Dubois',
      date: new Date('2025-01-15T14:00'),
      duration: 2,
      subject: 'Mathématiques',
      status: 'pending',
      price: 60,
    },
    {
      id: 2,
      student: 'Lucas Martin',
      date: new Date('2025-01-16T16:00'),
      duration: 1.5,
      subject: 'Physique',
      status: 'confirmed',
      price: 45,
    },
    {
      id: 3,
      student: 'Emma Bernard',
      date: new Date('2025-01-17T10:00'),
      duration: 2,
      subject: 'Mathématiques',
      status: 'pending',
      price: 60,
    },
  ];

  // Factures
  invoices: Invoice[] = [
    {
      id: 1,
      student: 'Marie Dubois',
      amount: 240,
      date: new Date('2024-12-01'),
      status: 'paid',
      dueDate: new Date('2024-12-15'),
    },
    {
      id: 2,
      student: 'Lucas Martin',
      amount: 180,
      date: new Date('2024-12-05'),
      status: 'pending',
      dueDate: new Date('2024-12-20'),
    },
    {
      id: 3,
      student: 'Emma Bernard',
      amount: 120,
      date: new Date('2024-12-10'),
      status: 'overdue',
      dueDate: new Date('2024-12-25'),
    },
  ];

  // Cours récents pour l'aperçu
  recentCourses: Course[] = [];

  // Factures en attente pour l'aperçu
  pendingInvoices: Invoice[] = [];

  ngOnInit(): void {
    this.recentCourses = this.courses.slice(0, 3);
    this.pendingInvoices = this.invoices.filter(
      (inv) => inv.status === 'pending' || inv.status === 'overdue'
    );
  }

  setActiveTab(
    tab: 'overview' | 'courses' | 'students' | 'invoices' | 'calendar'
  ): void {
    this.activeTab = tab;
  }

  validateCourse(courseId: number): void {
    const course = this.courses.find((c) => c.id === courseId);
    if (course) {
      course.status = 'confirmed';
      // TODO: Appel API pour valider le cours
    }
  }

  completeCourse(courseId: number): void {
    const course = this.courses.find((c) => c.id === courseId);
    if (course) {
      course.status = 'completed';
      // TODO: Appel API pour marquer comme complété et générer facture
    }
  }

  generateInvoice(courseId: number): void {
    // TODO: Appel API pour générer la facture PDF
    console.log('Génération de la facture pour le cours:', courseId);
  }

  sendInvoice(invoiceId: number): void {
    // TODO: Appel API pour envoyer la facture par email
    console.log('Envoi de la facture:', invoiceId);
  }

  downloadInvoice(invoiceId: number): void {
    // TODO: Appel API pour télécharger la facture PDF
    console.log('Téléchargement de la facture:', invoiceId);
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      confirmed: 'Confirmé',
      pending: 'En attente',
      completed: 'Terminé',
      paid: 'Payée',
      overdue: 'En retard',
    };
    return labels[status] || status;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('');
  }
}
