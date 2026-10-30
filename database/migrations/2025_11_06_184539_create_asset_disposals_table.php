<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if table already exists to prevent migration errors
        if (!Schema::hasTable('asset_disposals')) {
            Schema::create('asset_disposals', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('asset_id');
                $table->text('disposal_reason');
                $table->string('disposal_document')->nullable(); // Path to uploaded document (PDF/image)
                $table->timestamp('disposed_at');
                $table->unsignedBigInteger('disposed_by'); // User who disposed it
                $table->timestamps();
                
                // Add foreign keys separately
                $table->foreign('asset_id')->references('id')->on('assets')->onDelete('cascade');
                $table->foreign('disposed_by')->references('id')->on('users')->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('asset_disposals');
    }
};
