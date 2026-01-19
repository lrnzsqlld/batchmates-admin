<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('beneficiary_id')->nullable()->constrained('users')->onDelete('set null')->comment('Specific person this campaign helps');
            $table->string('title');
            $table->text('description');
            $table->string('image')->nullable();
            $table->decimal('goal_amount', 12, 2);
            $table->decimal('raised_amount', 12, 2)->default(0);
            $table->enum('campaign_type', ['general', 'individual'])->default('general')->comment('general = institution/group, individual = specific person');
            $table->enum('status', [
                'pending_review',
                'active',
                'completed',
                'rejected',
                'closed'
            ])->default('pending_review');
            $table->enum('priority', ['normal', 'urgent'])->default('normal');
            $table->date('end_date')->nullable();
            $table->integer('supporter_count')->default(0);
            $table->integer('share_count')->default(0);
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaigns');
    }
};
