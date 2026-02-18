import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { ActiveReceptionAgentMap, ReceptionAgent } from '../../model/reception-agent';
import { ReceptionAgentService } from '../../services/reception-agent.service';

@Component({
  selector: 'app-reception-agent-gestion',
  templateUrl: './reception-agent-gestion.component.html',
  styleUrls: ['./reception-agent-gestion.component.scss']
})
export class ReceptionAgentGestionComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['fullName', 'country', 'city', 'phone', 'actions'];
  dataSource: MatTableDataSource<ReceptionAgent> = new MatTableDataSource<ReceptionAgent>([]);
  agents: ReceptionAgent[] = [];

  agentForm: FormGroup;
  activeForm: FormGroup;

  selectedAgent: ReceptionAgent | null = null;
  isSavingAgent = false;
  isSavingActiveMap = false;

  private agentsSub?: Subscription;
  private activeMapSub?: Subscription;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('agentDialog') agentDialog!: TemplateRef<any>;

  constructor(
    private receptionAgentService: ReceptionAgentService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.agentForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      country: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      phone: ['', Validators.required]
    });

    this.activeForm = this.fb.group({
      admission: [null],
      finance: [null],
      hebergement: [null]
    });
  }

  ngOnInit(): void {
    this.loadAgents();
    this.loadActiveMap();
  }

  ngOnDestroy(): void {
    this.agentsSub?.unsubscribe();
    this.activeMapSub?.unsubscribe();
  }

  loadAgents(): void {
    this.agentsSub?.unsubscribe();
    this.agentsSub = this.receptionAgentService.getAgents().subscribe((agents) => {
      this.agents = agents || [];
      this.dataSource = new MatTableDataSource(this.agents);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  loadActiveMap(): void {
    this.activeMapSub?.unsubscribe();
    this.activeMapSub = this.receptionAgentService.getActiveMap().subscribe((config) => {
      this.activeForm.patchValue(
        {
          admission: config.admission,
          finance: config.finance,
          hebergement: config.hebergement
        },
        { emitEvent: false }
      );
    });
  }

  applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openCreateDialog(): void {
    this.selectedAgent = null;
    this.agentForm.reset({
      firstName: '',
      lastName: '',
      country: '',
      address: '',
      city: '',
      phone: ''
    });
    this.dialog.open(this.agentDialog, { width: '560px', maxWidth: '96vw' });
  }

  openEditDialog(agent: ReceptionAgent): void {
    this.selectedAgent = agent;
    this.agentForm.patchValue({
      firstName: agent.firstName || '',
      lastName: agent.lastName || '',
      country: agent.country || '',
      address: agent.address || '',
      city: agent.city || '',
      phone: agent.phone || ''
    });
    this.dialog.open(this.agentDialog, { width: '560px', maxWidth: '96vw' });
  }

  saveAgent(): void {
    if (this.agentForm.invalid) {
      return;
    }

    const payload: ReceptionAgent = this.agentForm.value;
    this.isSavingAgent = true;

    const savePromise = this.selectedAgent?.id
      ? this.receptionAgentService.updateAgent(this.selectedAgent.id, payload)
      : this.receptionAgentService.createAgent(payload);

    savePromise
      .then(() => {
        this.snackBar.open('Agent enregistre avec succes.', 'Fermer', { duration: 3000 });
        this.dialog.closeAll();
      })
      .catch(() => {
        this.snackBar.open('Erreur lors de l\'enregistrement de l\'agent.', 'Fermer', { duration: 4000 });
      })
      .finally(() => {
        this.isSavingAgent = false;
      });
  }

  deleteAgent(agent: ReceptionAgent): void {
    if (!agent?.id) {
      return;
    }
    const confirmed = confirm(`Supprimer l'agent ${agent.firstName} ${agent.lastName} ?`);
    if (!confirmed) {
      return;
    }

    this.receptionAgentService
      .deleteAgent(agent.id)
      .then(async () => {
        const currentMap = this.activeForm.value as ActiveReceptionAgentMap;
        const patch: ActiveReceptionAgentMap = {
          admission: currentMap.admission === agent.id ? null : currentMap.admission,
          finance: currentMap.finance === agent.id ? null : currentMap.finance,
          hebergement: currentMap.hebergement === agent.id ? null : currentMap.hebergement
        };
        await this.receptionAgentService.setActiveMap(patch);
        this.snackBar.open('Agent supprime.', 'Fermer', { duration: 3000 });
      })
      .catch(() => {
        this.snackBar.open('Erreur lors de la suppression.', 'Fermer', { duration: 4000 });
      });
  }

  saveActiveAssignments(): void {
    const payload: ActiveReceptionAgentMap = this.activeForm.value;
    this.isSavingActiveMap = true;
    this.receptionAgentService
      .setActiveMap(payload)
      .then(() => {
        this.snackBar.open('Affectation des agents mise a jour.', 'Fermer', { duration: 3000 });
      })
      .catch(() => {
        this.snackBar.open('Erreur lors de la mise a jour des affectations.', 'Fermer', { duration: 4000 });
      })
      .finally(() => {
        this.isSavingActiveMap = false;
      });
  }
}
