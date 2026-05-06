import {Component, HostListener, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { UserGestionService } from '../../services/user-gestion.service';
import { User } from '../../../landing/model/user';
import { EmailService } from '../../services/email.service';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-gestion',
  templateUrl: './user-gestion.component.html',
  styleUrls: ['./user-gestion.component.scss']
})
export class UserGestionComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = [];
  dataSource: MatTableDataSource<User> = new MatTableDataSource<User>([]);
  editForm: FormGroup;
  emailForm: FormGroup;
  selectedUser: User | null = null;
  userToDelete: User | null = null;
  isSavingUser = false;
  isSendingEmail = false;
  usersSub?: Subscription;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('editUserDialog') editUserDialog: TemplateRef<any>;
  @ViewChild('emailUserDialog') emailUserDialog: TemplateRef<any>;
  @ViewChild('deleteDialog') deleteDialog: TemplateRef<any>;

  constructor(
    private userService: UserGestionService,
    private emailService: EmailService,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {
    this.editForm = this.fb.group({
      firstName:   ['', Validators.required],
      lastName:    ['', Validators.required],
      email:       ['', [Validators.required, Validators.email]],
      phone:       [''],
      degreeLevel: [''],
      roles:       ['user'],
    });

    this.emailForm = this.fb.group({
      to:      ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.updateColumns();
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.usersSub?.unsubscribe();
  }

  @HostListener('window:resize')
  updateColumns(): void {
    if (window.innerWidth <= 768) {
      this.displayedColumns = ['photo', 'firstName', 'actions'];
    } else {
      this.displayedColumns = ['photo', 'firstName', 'email', 'degreeLevel', 'roles', 'actions'];
    }
  }

  loadUsers(): void {
    this.usersSub?.unsubscribe();
    this.usersSub = this.userService.getUsers().subscribe(users => {
      this.dataSource = new MatTableDataSource(users);
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

  goToDetail(user: User): void {
    if (!user?.uid) { return; }
    this.router.navigate(['/admin/user/gestion', user.uid]);
  }

  openEditUser(user: User): void {
    this.selectedUser = user;
    this.editForm.patchValue({
      firstName:   user.firstName   || '',
      lastName:    user.lastName    || '',
      email:       user.email       || '',
      phone:       (user as any).phone || '',
      degreeLevel: user.degreeLevel || '',
      roles:       user.roles       || 'user',
    });
    this.dialog.open(this.editUserDialog, { width: '520px', panelClass: 'custom-dialog' });
  }

  saveUser(): void {
    if (!this.selectedUser?.uid || this.editForm.invalid) { return; }
    this.isSavingUser = true;
    this.userService.updateUser(this.selectedUser.uid, this.editForm.value)
      .then(() => {
        this.snackBar.open('Utilisateur mis à jour', 'Fermer', { duration: 3000 });
        this.dialog.closeAll();
      })
      .catch(() => {
        this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', { duration: 4000 });
      })
      .finally(() => { this.isSavingUser = false; });
  }

  openEmailUser(user: User): void {
    this.selectedUser = user;
    this.emailForm.reset({
      to:      user.email,
      subject: 'Information Maykconsulting',
      message: `Bonjour ${user.firstName},\n\n`,
    });
    this.dialog.open(this.emailUserDialog, { width: '520px', panelClass: 'custom-dialog' });
  }

  sendEmailToUser(): void {
    if (this.emailForm.invalid) { return; }
    const { to, subject, message } = this.emailForm.value;
    this.isSendingEmail = true;
    this.emailService.sendCustomEmail(to, subject, message).subscribe({
      next: () => {
        this.snackBar.open('E-mail envoyé', 'Fermer', { duration: 3000 });
        this.dialog.closeAll();
      },
      error: () => this.snackBar.open('Erreur lors de l\'envoi', 'Fermer', { duration: 4000 }),
      complete: () => { this.isSendingEmail = false; },
    });
  }

  openDeleteConfirm(user: User): void {
    this.userToDelete = user;
    this.dialog.open(this.deleteDialog, { width: '420px', panelClass: 'custom-dialog' });
  }

  confirmDelete(): void {
    if (!this.userToDelete?.uid) { return; }
    this.userService.deleteUser(this.userToDelete.uid)
      .then(() => {
        this.snackBar.open('Utilisateur supprimé', 'Fermer', { duration: 3000 });
        this.dialog.closeAll();
        this.userToDelete = null;
      })
      .catch(() => {
        this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 4000 });
      });
  }

  getRoleLabel(role: string): string {
    const map: Record<string, string> = {
      admin:            'Administrateur',
      agent_reception:  'Agent réception',
      user:             'Utilisateur',
    };
    return map[role] ?? (role || 'Utilisateur');
  }

  getRoleClass(role: string): string {
    const map: Record<string, string> = {
      admin:           'role-admin',
      agent_reception: 'role-agent',
    };
    return map[role] ?? 'role-user';
  }
}
