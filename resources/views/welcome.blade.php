<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>CAKAP Dashboard Test</title>
        <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    </head>
    <body>
        <div style="padding: 20px; font-family: Arial, sans-serif;">
            <h1>CAKAP Dashboard API Test</h1>
            
            <div style="margin: 20px 0;">
                <button onclick="testDashboardAPI()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Test Dashboard API
                </button>
            </div>
            
            <div id="result" style="margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 5px; white-space: pre-wrap;"></div>
            
            <div style="margin: 20px 0;">
                <a href="/dashboard" style="color: #007bff; text-decoration: none;">Go to Dashboard</a>
            </div>
        </div>

        <script>
            async function testDashboardAPI() {
                const resultDiv = document.getElementById('result');
                resultDiv.textContent = 'Testing API...';
                
                try {
                    const response = await axios.get('/api/dev/dashboard/stats');
                    resultDiv.textContent = 'API Response:\n' + JSON.stringify(response.data, null, 2);
                } catch (error) {
                    resultDiv.textContent = 'API Error:\n' + error.message + '\n\nResponse: ' + JSON.stringify(error.response?.data, null, 2);
                }
            }
        </script>
    </body>
</html>
