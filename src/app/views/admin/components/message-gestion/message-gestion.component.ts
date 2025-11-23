import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { EmailService } from '../../services/email.service';
import { MessageGestionService, MessagePublic } from '../../services/message-gestion.service';

@Component({
  selector: 'app-message-gestion',
  templateUrl: './message-gestion.component.html',
  styleUrls: ['./message-gestion.component.scss']
})
export class MessageGestionComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['name', 'email', 'subject', 'createdAt', 'responded', 'actions'];
  dataSource: MatTableDataSource<MessagePublic> = new MatTableDataSource<MessagePublic>([]);
  messagesSub?: Subscription;
  replyForm: FormGroup;
  selectedMessage: MessagePublic | null = null;
  isSending = false;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('viewMessageDialog') viewMessageDialog: TemplateRef<any>;

  constructor(
    private messageService: MessageGestionService,
    private emailService: EmailService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {
    this.replyForm = this.fb.group({
      to: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadMessages();
  }

  ngOnDestroy(): void {
    this.messagesSub?.unsubscribe();
  }

  loadMessages(): void {
    this.messagesSub?.unsubscribe();
    this.messagesSub = this.messageService.getMessages().subscribe(messages => {
      this.dataSource = new MatTableDataSource(messages);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openMessage(msg: MessagePublic): void {
    this.selectedMessage = msg;
    this.replyForm.reset({
      to: msg.email,
      subject: `Re: ${msg.subject || ''}`,
      message: `Bonjour ${msg.name || ''},\n`,
    });
    this.dialog.open(this.viewMessageDialog, { width: '600px' });
  }

  sendReply(): void {
    if (this.replyForm.invalid) {
      return;
    }
    this.isSending = true;
    const { to, subject, message } = this.replyForm.value;
    this.emailService.sendCustomEmail(to, subject, message).subscribe({
      next: () => {
        if (this.selectedMessage?.id) {
          this.messageService.markResponded(this.selectedMessage.id);
        }
        this.snackBar.open('E-mail envoyé', 'Fermer', { duration: 3000 });
      },
      error: () => this.snackBar.open('Erreur lors de l’envoi', 'Fermer', { duration: 4000 }),
      complete: () => {
        this.isSending = false;
        this.dialog.closeAll();
      }
    });
  }

  deleteMessage(msg: MessagePublic): void {
    if (!msg.id) {
      return;
    }
    const confirmed = confirm(`Supprimer le message de ${msg.name || msg.email} ?`);
    if (!confirmed) {
      return;
    }
    this.messageService.deleteMessage(msg.id).then(() => {
      this.snackBar.open('Message supprimé', 'Fermer', { duration: 3000 });
    }).catch(() => {
      this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 4000 });
    });
  }
}
