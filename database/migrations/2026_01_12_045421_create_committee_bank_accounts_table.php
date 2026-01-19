<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('committee_bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('committee_id')->constrained('alumni_committees')->onDelete('cascade');
            $table->foreignId('institution_id')->constrained()->onDelete('cascade');
            $table->string('bank_name');
            $table->text('account_number');
            $table->string('account_holder');
            $table->string('swift_code')->nullable();
            $table->string('branch')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->date('effective_from');
            $table->date('effective_until')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('committee_bank_accounts');
    }
};
