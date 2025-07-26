# Platforma pro výuku finančních otázek

Webová platforma pro výuku finančních otázek s inteligentním řazením otázek a sledováním pokroku.

## Funkce

### Systém zobrazení otázek
- **Výběrové boxy**: Otázky se zobrazují s odpovídajícími výběrovými boxy (radio tlačítka pro jednu možnost, zaškrtávací boxy pro více možností)
- **Validace odpovědí**: Systém ověřuje, zda výběr uživatele přesně odpovídá správným odpovědím
- **Vizuální zpětná vazba**: 
  - Efekty při najetí myší na možnosti odpovědí
  - Vizuální zvýraznění vybraných odpovědí
  - Barevné kódování zpětné vazby (zelená pro správné, červená pro nesprávné)
  - Zobrazuje správné odpovědi, když uživatel odpoví špatně

### Inteligentní řazení otázek
- Otázky, které jste ještě neodpověděli, mají nejvyšší prioritu
- Otázky s více špatnými odpověďmi mají vyšší prioritu
- Často odpovídané otázky postupně snižují prioritu
- Tlačítko pro zamíchání otázek

### Sledování pokroku
- Sleduje správné a nesprávné odpovědi pro každou otázku
- Zobrazuje procento správných odpovědí
- Vizuální indikátory pro stav otázky (nová, většinou správně, potřebuje procvičení)
- Celkové statistiky pokroku

### Správa uživatelů
- Jednoduchý přihlašovací systém založený na uživatelském jméně
- Automatické vytváření uživatelů
- Trvalá historie odpovědí

## Jak používat

1. **Spusťte server**: `php -S localhost:8000`
2. **Otevřete prohlížeč**: Přejděte na `http://localhost:8000`
3. **Zadejte své jméno**: Vytvořte nový účet nebo pokračujte s existujícím
4. **Odpovídejte na otázky**: 
   - Vyberte své odpovědi pomocí poskytnutých zaškrtávacích boxů/radio tlačítek
   - Klikněte na "Odeslat odpověď" pro kontrolu vaší odpovědi
   - Zobrazte zpětnou vazbu a vysvětlení
   - Otázky se automaticky resetují po 3 sekundách

## Typy otázek

- **Jedna možnost**: Radio tlačítka pro otázky s jednou správnou odpovědí
- **Více možností**: Zaškrtávací boxy pro otázky s více správnými odpověďmi

## Technické detaily

- **Frontend**: Vanilla JavaScript, CSS3, HTML5
- **Backend**: PHP s ukládáním do JSON souborů
- **Datová struktura**: Otázky uloženy v `questions.json`, uživatelská data v `users.json`
- **Responzivní design**: Funguje na počítačích i mobilních zařízeních

## Struktura souborů

```
finance/
├── index.php          # Přihlašovací stránka
├── questions.php      # Hlavní rozhraní otázek
├── api.php           # Backend API pro ukládání odpovědí
├── logout.php        # Funkce odhlášení
├── questions.json    # Databáze otázek
├── users.json        # Ukládání uživatelských dat
├── css/
│   └── style.css     # Stylování
└── js/
    └── script.js     # Frontend logika
```
