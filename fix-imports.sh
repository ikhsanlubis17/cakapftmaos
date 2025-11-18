#!/bin/bash

# Script untuk mengganti relative imports dengan absolute imports (@/)
# di semua file yang ada di folder features/

# Ganti ../contexts/ dengan @/contexts/
find resources/js/features -type f \( -name "*.jsx" -o -name "*.tsx" -o -name "*.js" -o -name "*.ts" \) -exec sed -i '' 's|from ['\''"]\.\.\/contexts\/|from "@/contexts/|g' {} \;

# Ganti ../hooks/ dengan @/hooks/
find resources/js/features -type f \( -name "*.jsx" -o -name "*.tsx" -o -name "*.js" -o -name "*.ts" \) -exec sed -i '' 's|from ['\''"]\.\.\/hooks\/|from "@/hooks/|g' {} \;

# Ganti ../components/ dengan @/components/
find resources/js/features -type f \( -name "*.jsx" -o -name "*.tsx" -o -name "*.js" -o -name "*.ts" \) -exec sed -i '' 's|from ['\''"]\.\.\/components\/|from "@/components/|g' {} \;

# Ganti ../types/ dengan @/types/
find resources/js/features -type f \( -name "*.jsx" -o -name "*.tsx" -o -name "*.js" -o -name "*.ts" \) -exec sed -i '' 's|from ['\''"]\.\.\/types\/|from "@/types/|g' {} \;

# Ganti ../utils/ dengan @/utils/
find resources/js/features -type f \( -name "*.jsx" -o -name "*.tsx" -o -name "*.js" -o -name "*.ts" \) -exec sed -i '' 's|from ['\''"]\.\.\/utils\/|from "@/utils/|g' {} \;

# Ganti ../services/ dengan @/services/
find resources/js/features -type f \( -name "*.jsx" -o -name "*.tsx" -o -name "*.js" -o -name "*.ts" \) -exec sed -i '' 's|from ['\''"]\.\.\/services\/|from "@/services/|g' {} \;

# Ganti ../features/ dengan @/features/
find resources/js/features -type f \( -name "*.jsx" -o -name "*.tsx" -o -name "*.js" -o -name "*.ts" \) -exec sed -i '' 's|from ['\''"]\.\.\/features\/|from "@/features/|g' {} \;

echo "✅ Import paths updated successfully!"
