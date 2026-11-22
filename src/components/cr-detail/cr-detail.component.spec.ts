import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrDetailComponent } from './cr-detail.component';
import { SessionService } from '../../session/session.service';
import { CrApiService } from '../../api/cr-api.service';
import { users } from '../../api/fixtures';
import { ReqUser } from '../../models/cr.models';

const flush = () => new Promise((r) => setTimeout(r, 0));

async function create(
	user: ReqUser,
	id: string,
	configureApi?: (api: CrApiService) => void,
): Promise<ComponentFixture<CrDetailComponent>> {
	TestBed.configureTestingModule({
		imports: [CrDetailComponent],
		providers: [{ provide: SessionService, useValue: { user } }],
	});
	await TestBed.compileComponents();
	if (configureApi) {
		configureApi(TestBed.inject(CrApiService));
	}
	const fixture = TestBed.createComponent(CrDetailComponent);
	fixture.componentRef.setInput('id', id);
	fixture.detectChanges(); // ngOnInit -> load()
	return fixture;
}

async function render(user: ReqUser, id: string): Promise<ComponentFixture<CrDetailComponent>> {
	const fixture = await create(user, id);
	await flush(); // let the mock API resolve
	fixture.detectChanges(); // render the loaded state
	return fixture;
}

describe('CrDetailComponent', () => {
	it('shows the loading state while the detail request is pending', async () => {
		const fixture = await create(users.approver, 'CR-1', (api) => {
			api.latencyMs = 50;
		});
		expect(fixture.nativeElement.querySelector('.cr-detail__loading')).not.toBeNull();

		await new Promise((resolve) => setTimeout(resolve, 60));
		fixture.detectChanges();
	});

	it('loads and renders the change request title', async () => {
		const fixture = await render(users.approver, 'CR-1');
		expect(fixture.nativeElement.querySelector('.cr-detail__header h2').textContent).toContain('Add 1 unit of SKU-A');
	});

	it('shows the error state when loading the detail fails', async () => {
		const fixture = await create(users.approver, 'CR-1', (api) => {
			api.failNext = true;
		});
		await flush();
		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('.cr-detail__error').textContent).toContain('Network error');
	});

	it('loads the selected request when its id changes', async () => {
		const fixture = await render(users.approver, 'CR-1');
		fixture.componentRef.setInput('id', 'CR-2');
		fixture.detectChanges();
		await flush();
		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('.cr-detail__header h2').textContent).toContain('Replace SKU-B supplier');
	});

	it('disables Approve for a read-only viewer on a pending CR', async () => {
		const fixture = await render(users.viewer, 'CR-1'); // viewer: cr_r_o only; CR-1 is PENDING_APPROVAL
		const approveBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.cr-actions__approve');
		expect(approveBtn.disabled).toBe(true);
		expect(fixture.nativeElement.querySelector('.cr-actions__reject')).toBeNull();
	});

	it('allows an approver to approve and reject a pending CR', async () => {
		const fixture = await render(users.approver, 'CR-1');
		const approveBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.cr-actions__approve');
		expect(approveBtn.disabled).toBe(false);
		expect(fixture.nativeElement.querySelector('.cr-actions__reject')).not.toBeNull();
	});

	// test the approve and reject flows, including validation and error handling
	it('approves the request and reflects the updated status and timeline', async () => {
		const fixture = await render(users.approver, 'CR-1');
		await fixture.componentInstance.approve();
		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('.cr-status').textContent).toContain('APPROVED');
		expect(fixture.nativeElement.querySelector('.cr-actions__reject')).toBeNull();
		expect(
			Array.from(fixture.nativeElement.querySelectorAll('.cr-timeline__action')).some((node: Element) =>
				node.textContent?.includes('APPROVE'),
			),
		).toBe(true);
	});

	it('requires a rejection reason and reflects a successful rejection', async () => {
		const fixture = await render(users.approver, 'CR-1');
		const component = fixture.componentInstance;

		await component.reject();
		expect(component.rejectControl.touched).toBe(true);
		expect(component.detail?.status).toBe('PENDING_APPROVAL');

		component.rejectControl.setValue('Incorrect pricing');
		await component.reject();
		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('.cr-status').textContent).toContain('REJECTED');
		expect(fixture.nativeElement.querySelector('.cr-actions__reject')).toBeNull();
		expect(fixture.nativeElement.querySelector('.cr-timeline__note').textContent).toContain('Incorrect pricing');
	});

	it('shows API errors when an action fails', async () => {
		const fixture = await render(users.approver, 'CR-1');
		TestBed.inject(CrApiService).failNext = true;

		await fixture.componentInstance.approve();
		fixture.detectChanges();

		expect(fixture.componentInstance.detail?.status).toBe('PENDING_APPROVAL');
		expect(fixture.nativeElement.querySelector('.cr-actions__error').textContent).toContain('Network error');
		expect(fixture.componentInstance.submitting).toBe(false);
	});
});
