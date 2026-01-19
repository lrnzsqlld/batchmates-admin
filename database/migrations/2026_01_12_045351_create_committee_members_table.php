<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('committee_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('committee_id')->constrained('alumni_committees')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('role', ['chair', 'treasurer', 'secretary', 'member'])->default('member');
            $table->boolean('approval_privileges')->default(true);
            $table->timestamp('joined_at');
            $table->timestamp('left_at')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            $table->unique(['committee_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('committee_members');
    }
};
