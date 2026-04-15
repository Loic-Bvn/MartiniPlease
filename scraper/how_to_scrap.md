# 1️⃣ Scraper les recettes
python -c "
from scraper.scraper import CocktailScraper
scraper = CocktailScraper()
output = scraper.run()
print(f'✅ {output}')
"

# 2️⃣ Importer les ingrédients (remplace <BAR_ID>)
python -m scraper.supabase.ingredients <BAR_ID>
python -m scraper.supabase.ingredients a01919a6-3768-4879-86b7-6b2f6e115c78

# 3️⃣ Importer les recettes (remplace <BAR_ID> et <FICHIER>)
python -m scraper.supabase.recipes <FICHIER> <BAR_ID>
python -m scraper.supabase.recipes cocktails_autumn_winter_spring_summer_15-04-2026.json a01919a6-3768-4879-86b7-6b2f6e115c78