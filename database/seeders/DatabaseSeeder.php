<?php

namespace Database\Seeders;

use App\Models\AlumniCommittee;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Institution;
use App\Models\Campaign;
use App\Models\Donation;
use App\Models\CampaignApproval;
use App\Models\CommitteeBankAccount;
use App\Models\CommitteeMember;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RolePermissionSeeder::class);

        foreach (
            [
                [
                    'name' => 'Ateneo De Naga University',
                    'slug' => 'ateneo-de-naga',
                    'email' => 'info@adnu.edu.ph',
                    'phone' => '+63 54 473 5380',
                    'address' => 'Ateneo Avenue, Bagumbayan Sur',
                    'city' => 'Naga City',
                    'country' => 'Philippines',
                    'status' => 'active',
                ],
                [
                    'name' => 'University of Santo Tomas',
                    'slug' => 'ust',
                    'email' => 'info@ust.edu.ph',
                    'phone' => '+63 2 3406 1611',
                    'address' => 'España Boulevard',
                    'city' => 'Manila',
                    'country' => 'Philippines',
                    'status' => 'active',
                ],
                [
                    'name' => 'De La Salle University',
                    'slug' => 'dlsu',
                    'email' => 'info@dlsu.edu.ph',
                    'phone' => '+63 2 8524 4611',
                    'address' => '2401 Taft Avenue',
                    'city' => 'Manila',
                    'country' => 'Philippines',
                    'status' => 'active',
                ],
            ] as $data
        ) {
            Institution::create($data);
        }

        $adnu = Institution::whereSlug('ateneo-de-naga')->first();
        $ust = Institution::whereSlug('ust')->first();
        $dlsu = Institution::whereSlug('dlsu')->first();

        $systemAdmin = User::create([
            'first_name' => 'System',
            'last_name' => 'Admin',
            'email' => 'admin@batchmates.com',
            'password' => Hash::make('password'),
            'status' => 'active',
        ]);
        $systemAdmin->assignRole('system_admin');

        $adnuAdmin = User::create([
            'institution_id' => $adnu->id,
            'first_name' => 'ADNU',
            'last_name' => 'Admin',
            'email' => 'admin@adnu.edu.ph',
            'password' => Hash::make('password'),
            'status' => 'active',
        ]);
        $adnuAdmin->assignRole(['institution_admin', 'committee_member']);

        $ustAdmin = User::create([
            'institution_id' => $ust->id,
            'first_name' => 'UST',
            'last_name' => 'Admin',
            'email' => 'admin@ust.edu.ph',
            'password' => Hash::make('password'),
            'status' => 'active',
        ]);
        $ustAdmin->assignRole(['institution_admin', 'committee_member']);

        $dlsuCommitteeUser = User::create([
            'institution_id' => $dlsu->id,
            'first_name' => 'DLSU',
            'last_name' => 'Committee',
            'email' => 'committee@dlsu.edu.ph',
            'password' => Hash::make('password'),
            'status' => 'active',
        ]);
        $dlsuCommitteeUser->assignRole('committee_member');

        $adnuCommittee = AlumniCommittee::create([
            'institution_id' => $adnu->id,
            'name' => 'ADNU Alumni Committee',
            'description' => 'ADNU Alumni Committee',
            'start_date' => now()->toDateString(),
            'status' => 'active',
        ]);

        $ustCommittee = AlumniCommittee::create([
            'institution_id' => $ust->id,
            'name' => 'UST Alumni Committee',
            'description' => 'UST Alumni Committee',
            'start_date' => now()->toDateString(),
            'status' => 'active',
        ]);

        $dlsuCommittee = AlumniCommittee::create([
            'institution_id' => $dlsu->id,
            'name' => 'DLSU Alumni Committee',
            'description' => 'DLSU Alumni Committee',
            'start_date' => now()->toDateString(),
            'status' => 'active',
        ]);

        $adnuCommitteeMember = CommitteeMember::create([
            'committee_id' => $adnuCommittee->id,
            'user_id' => $adnuAdmin->id,
            'role' => 'member',
            'approval_privileges' => true,
            'joined_at' => now(),
            'status' => 'active',
        ]);

        $ustCommitteeMember = CommitteeMember::create([
            'committee_id' => $ustCommittee->id,
            'user_id' => $ustAdmin->id,
            'role' => 'member',
            'approval_privileges' => true,
            'joined_at' => now(),
            'status' => 'active',
        ]);

        $dlsuCommitteeMember = CommitteeMember::create([
            'committee_id' => $dlsuCommittee->id,
            'user_id' => $dlsuCommitteeUser->id,
            'role' => 'member',
            'approval_privileges' => true,
            'joined_at' => now(),
            'status' => 'active',
        ]);

        foreach (
            [
                [$adnuCommittee, $adnu, 'BDO Unibank', '1234567890', true],
                [$adnuCommittee, $adnu, 'BPI', '9876543210', false],
                [$ustCommittee, $ust, 'Metrobank', '1122334455', true],
                [$ustCommittee, $ust, 'Security Bank', '5544332211', false],
                [$dlsuCommittee, $dlsu, 'Unionbank', '6677889900', true],
            ] as [$committee, $institution, $bank, $acct, $primary]
        ) {
            CommitteeBankAccount::create([
                'committee_id' => $committee->id,
                'institution_id' => $institution->id,
                'bank_name' => $bank,
                'account_number' => $acct,
                'account_holder' => $institution->name,
                'branch' => 'Main',
                'swift_code' => 'PHMM',
                'is_primary' => $primary,
                'status' => 'active',
                'effective_from' => now()->subYear()->toDateString(),
            ]);
        }

        $adnuPrimaryBank = CommitteeBankAccount::where('institution_id', $adnu->id)->where('is_primary', true)->first();
        $ustPrimaryBank = CommitteeBankAccount::where('institution_id', $ust->id)->where('is_primary', true)->first();

        foreach (
            [
                [$adnu, $adnuAdmin, $adnuPrimaryBank, $adnuCommitteeMember, 'ADNU Scholarship Fund'],
                [$ust, $ustAdmin, $ustPrimaryBank, $ustCommitteeMember, 'UST Medical Scholarship'],
            ] as [$institution, $admin, $bank, $member, $title]
        ) {
            $campaign = Campaign::create([
                'institution_id' => $institution->id,
                'bank_account_id' => $bank->id,
                'created_by' => $admin->id,
                'title' => $title,
                'description' => $title,
                'goal_amount' => 500000,
                'raised_amount' => 250000,
                'campaign_type' => 'general',
                'status' => 'active',
                'priority' => 'normal',
                'end_date' => now()->addMonths(3),
                'approved_by' => $admin->id,
                'approved_at' => now()->subDays(5),
            ]);

            CampaignApproval::create([
                'campaign_id' => $campaign->id,
                'user_id' => $member->id,
                'status' => 'approved',
                'approved_at' => $campaign->approved_at,
            ]);
        }

        foreach (Campaign::where('status', 'active')->get() as $campaign) {
            for ($i = 0; $i < 5; $i++) {
                Donation::create([
                    'institution_id' => $campaign->institution_id,
                    'campaign_id' => $campaign->id,
                    'donor_name' => 'Anonymous',
                    'donor_email' => 'anon@example.com',
                    'amount' => rand(1000, 10000),
                    'status' => 'completed',
                    'payment_method' => 'gcash',
                    'transaction_id' => strtoupper(uniqid('TXN')),
                ]);
            }
        }


        $this->command->info('✅ Database seeded successfully!');
        $this->command->info('');
        $this->command->info('📧 Test Accounts:');
        $this->command->info('   System Admin:    admin@batchmates.com / password');
        $this->command->info('   ADNU Admin:      admin@adnu.edu.ph / password (Admin + Committee)');
        $this->command->info('   UST Admin:       admin@ust.edu.ph / password (Admin + Committee)');
        $this->command->info('   DLSU Committee:  committee@dlsu.edu.ph / password');
        $this->command->info('   Donor:           juan@example.com / password');
        $this->command->info('');
        $this->command->info('📊 Created:');
        $this->command->info('   ' . Institution::count() . ' Institutions');
        $this->command->info('   ' . User::count() . ' Users');
        $this->command->info('   ' . CommitteeBankAccount::count() . ' Bank Accounts');
        $this->command->info('     - ' . CommitteeBankAccount::where('is_primary', true)->count() . ' Primary');
        $this->command->info('     - ' . CommitteeBankAccount::where('status', 'active')->count() . ' Active');
        $this->command->info('   ' . Campaign::count() . ' Campaigns');
        $this->command->info('     - ' . Campaign::where('status', 'active')->count() . ' Active');
        $this->command->info('     - ' . Campaign::where('status', 'pending_review')->count() . ' Pending Review');
        $this->command->info('     - ' . Campaign::where('status', 'rejected')->count() . ' Rejected');
        $this->command->info('     - ' . Campaign::whereNotNull('bank_account_id')->count() . ' Linked to Bank Account');
        $this->command->info('   ' . Donation::count() . ' Donations');
        $this->command->info('   ' . CampaignApproval::count() . ' Campaign Approvals');
    }
}
