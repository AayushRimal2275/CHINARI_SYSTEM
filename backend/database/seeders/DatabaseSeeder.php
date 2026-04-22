<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@chinari.local'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password123'),
            ]
        );
    }
}
