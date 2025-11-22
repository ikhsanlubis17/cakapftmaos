<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Apar>
 */
class AparFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'serial_number' => $this->faker->unique()->uuid(),
            'qr_code' => $this->faker->unique()->uuid(),
            'location_type' => 'statis',
            'location_name' => $this->faker->word(),
            'latitude' => $this->faker->latitude(),
            'longitude' => $this->faker->longitude(),
            'valid_radius' => 50,
            'status' => 'active',
        ];
    }
}
