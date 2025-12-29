export interface Invoice {
  id: number;
  student: string;
  amount: number;
  date: Date;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: Date;
}
