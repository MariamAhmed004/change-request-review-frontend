import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrApiService } from '../../api/cr-api.service';
import { SessionService } from '../../session/session.service';
import { CrDetail, TimelineEntry } from '../../models/cr.models';
import { idle, loading, ViewState } from '../../common/view-state';
import { canApprovePolicy } from '../../common/permissions';
import { computeDiff, DiffRow } from '../diff.util';
import { formatMoney } from '../../common/money.util';

/**
 * Change Request DETAIL page: loads a CR and renders the diff/preview, the approval timeline, and
 * permission-aware Approve/Reject actions. `load`, the diff binding, and the template skeleton are
 * provided; the timeline ordering, permission gating, actions, and reject validation are yours.
 */
@Component({
	selector: 'app-cr-detail',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './cr-detail.component.html',
})
export class CrDetailComponent implements OnInit, OnChanges {
	@Input() id!: string;

	state: ViewState<CrDetail> = idle();
	submitting = false;
	actionError?: string;
	rejectControl = new FormControl('', {
		nonNullable: true,
		validators: [Validators.required, Validators.pattern(/\S/)],
	});

	constructor(private readonly api: CrApiService, private readonly session: SessionService) {}

	ngOnInit(): void {
		void this.load();
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['id'] && !changes['id'].firstChange) {
			void this.load();
		}
	}

	async load(): Promise<void> {
		this.state = loading();
		this.actionError = undefined;
		try {
			const detail = await this.api.getChangeRequest(this.session.user, this.id);
			this.state = { status: 'loaded', data: detail };
		} catch (err) {
			this.state = { status: 'error', data: null, error: (err as Error).message };
		}
	}

	get detail(): CrDetail | null {
		return this.state.data;
	}

	get diff(): DiffRow[] {
		return this.detail ? computeDiff(this.detail.baselineLineItems, this.detail.proposedLineItems) : [];
	}

	/** Approval timeline, oldest-first. */
	get timeline(): TimelineEntry[] {
		// Sort audit entries by timestamp (oldest first).
		return this.detail?.audit
        ?.slice()
        .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()) ?? [];
	}

	/** Whether the current user may approve the loaded CR. */
	get canApprove(): boolean {
		return this.detail?.status === 'PENDING_APPROVAL' && canApprovePolicy(this.session.user);
	}

	get canReject(): boolean {
		return this.detail?.status === 'PENDING_APPROVAL'&& canApprovePolicy(this.session.user);
	}

	fmt(amount: number): string {
		return this.detail ? formatMoney(amount, this.detail.currency) : String(amount);
	}

	async approve(): Promise<void> {

		// Clear any previous error message.
		this.actionError = undefined;

		// Check if the user can approve the CR before proceeding.
		if (!this.canApprove) {
			this.actionError = 'This change request cannot be approved by the current user.';
			return;
		}

		// Set the submitting flag to true to indicate that the approval process is in progress.
		this.submitting = true;
		try {

			// Call the API to approve the change request, get the updated detail and set the state.
			const updated = await this.api.approve(this.session.user, this.id, new Date().toISOString());
			this.state = { status: 'loaded', data: updated };

		} catch (err) {

			// If an error occurs during the approval process, set the actionError message accordingly.
			this.actionError = err instanceof Error ? err.message : 'Failed to approve this change request.';

		} finally {
			this.submitting = false;
		}
	}

	async reject(): Promise<void> {
		// Clear any previous error message and mark the reject control as touched to trigger validation.
		this.rejectControl.markAsTouched();
		this.actionError = undefined;

		// Check if the user can reject the CR before proceeding.
		if (!this.canReject) {
			this.actionError = 'This change request cannot be rejected by the current user.';
			return;
		}
		// Validate the reject control.
		if (this.rejectControl.invalid) {
			return;
		}

		// Set the submitting flag to true.
		this.submitting = true;
		try {

			// Call the API to reject the change request, passing the reason from the reject control.
			const updated = await this.api.reject(
				this.session.user,
				this.id,
				new Date().toISOString(),
				this.rejectControl.value.trim(),
			);
			this.state = { status: 'loaded', data: updated };

		} catch (err) {
			// If an error occurs during the rejection process, set the actionError message accordingly.
			this.actionError = err instanceof Error ? err.message : 'Failed to reject this change request.';
		} finally {
			this.submitting = false;
		}
	}
}
