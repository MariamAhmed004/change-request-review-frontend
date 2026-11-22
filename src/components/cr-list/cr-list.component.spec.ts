import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrListComponent } from './cr-list.component';
import { SessionService } from '../../session/session.service';
import { CrApiService } from '../../api/cr-api.service';
import { users } from '../../api/fixtures';
import { ReqUser } from '../../models/cr.models';

const flush = () => new Promise((r) => setTimeout(r, 0));

async function create(
	user: ReqUser,
	configureApi?: (api: CrApiService) => void,
): Promise<ComponentFixture<CrListComponent>> {
	TestBed.configureTestingModule({
		imports: [CrListComponent],
		providers: [{ provide: SessionService, useValue: { user } }],
	});
	await TestBed.compileComponents();
	if (configureApi) {
		configureApi(TestBed.inject(CrApiService));
	}
	const fixture = TestBed.createComponent(CrListComponent);
	fixture.detectChanges(); // ngOnInit -> load()
	return fixture;
}

async function render(user: ReqUser): Promise<ComponentFixture<CrListComponent>> {
	const fixture = await create(user);
	await flush(); // let the mock API resolve
	fixture.detectChanges(); // render the loaded/empty state
	return fixture;
}

describe('CrListComponent', () => {
	it('shows the loading state while the list request is pending', async () => {
		const fixture = await create(users.approver, (api) => {
			api.latencyMs = 50;
		});
		expect(fixture.nativeElement.querySelector('.cr-list__loading')).not.toBeNull();

		await new Promise((resolve) => setTimeout(resolve, 60));
		fixture.detectChanges();
	});

	it('renders a row per change request in the user org', async () => {
		const fixture = await render(users.approver);
		expect(fixture.nativeElement.querySelectorAll('.cr-list__row').length).toBe(3); // org-alpha: CR-1, CR-2, CR-3
	});

	it('filters rows by status and restores all rows', async () => {
		const fixture = await render(users.approver);
		const component = fixture.componentInstance;

		component.onFilterChange('PENDING_APPROVAL');
		fixture.detectChanges();

		let rows: HTMLTableRowElement[] = Array.from(fixture.nativeElement.querySelectorAll('.cr-list__row'));
		expect(rows.length).toBe(1);
		expect(rows[0].textContent).toContain('CR-1');

		component.onFilterChange('ALL');
		fixture.detectChanges();

		rows = Array.from(fixture.nativeElement.querySelectorAll('.cr-list__row'));
		expect(rows.length).toBe(3);
	});

	it('shows the empty state when the org has no change requests', async () => {
		const fixture = await render({ id: 'x', orgCode: 'org-empty', policies: ['cr_r_o'] });
		expect(fixture.nativeElement.querySelector('.cr-list__empty')).not.toBeNull();
		expect(fixture.nativeElement.querySelector('.cr-list__table')).toBeNull();
	});

	it('shows the error state when loading the list fails', async () => {
		const fixture = await create(users.approver, (api) => {
			api.failNext = true;
		});
		await flush();
		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('.cr-list__error').textContent).toContain('Network error');
	});
});
