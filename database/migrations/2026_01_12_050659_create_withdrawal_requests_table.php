<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('withdrawal_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->onDelete('cascade');
            $table->foreignId('committee_id')->constrained('alumni_committees')->onDelete('cascade');
            $table->foreignId('requested_by')->constrained('committee_members')->onDelete('cascade');
            $table->foreignId('bank_account_id')->constrained('committee_bank_accounts')->onDelete('cascade');
            $table->decimal('amount', 12, 2);
            $table->text('purpose');
            $table->enum('status', ['pending', 'approved', 'rejected', 'released'])->default('pending');
            $table->timestamp('requested_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('withdrawal_requests');
    }
};
