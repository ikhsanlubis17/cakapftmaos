<?php

namespace App\Providers;

use App\Models\Setting;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Blade;

class SettingServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Add global helper function
        if (!function_exists('setting')) {
            function setting(string $key, $default = null)
            {
                return Setting::getValue($key, $default);
            }
        }

        // Add Blade directive
        Blade::directive('setting', function ($expression) {
            return "<?php echo setting($expression); ?>";
        });

        // Share settings to all views
        view()->composer('*', function ($view) {
            $view->with('settings', Setting::getAllSettings());
        });
    }
}
