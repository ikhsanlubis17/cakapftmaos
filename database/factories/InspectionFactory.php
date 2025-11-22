<?php

namespace Database\Factories;

use App\Models\Apar;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Inspection>
 */
class InspectionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'apar_id' => Apar::factory(),
            'user_id' => User::factory(),
            'photo_url' => $this->faker->imageUrl(),
            'selfie_url' => $this->faker->imageUrl(),
            'condition' => 'good',
            'notes' => $this->faker->sentence(),
            'inspection_lat' => $this->faker->latitude(),
            'inspection_lng' => $this->faker->longitude(),
            'location_valid' => true,
            'is_valid' => true,
            'status' => 'completed',
            'requires_repair' => false,
            'photo_required' => true,
            'selfie_required' => true,
        ];
    }
}
