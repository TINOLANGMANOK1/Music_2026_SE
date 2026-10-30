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
        Schema::create('tool_usage_logs', function (Blueprint $table) {
            $table->increments('log_id');
            $table->integer('tool_id');
            $table->integer('tool_no');
            $table->string('tool_type', 45);
            $table->date('usage_date');
            $table->string('student_id', 50);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('tool_id')->references('tool_id')->on('tools_info')->onDelete('cascade');
            $table->foreign('student_id')->references('student_id')->on('student')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tool_usage_logs');
    }
};
