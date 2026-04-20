# Deweloper Logiki i Mechaniki (Instrukcja)

**Twoje zadanie:**
Ożywiasz działające środowisko 3D przygotowane przez poprzedniego Agenta i implementujesz w nim grywalną mechanikę opisaną w `init.md`.

**Kroki do wykonania:**
1. **Model ruchu / pętla kontrolna:** Opracuj funkcje, by gracz mógł swobodnie operować pojazdem. Włóż w to logikę auto-scrollingu lub ruchu naprzód w czasie rzeczywistym.
2. **System strzelania:** Zaprojektuj możliwość "fire/shoot" spawnującą z prędkością nowe pociski z pozycji rdzenniej (statku). 
3. **Spawner środowiskowy:** Stwórz kod dynamicznie układający przeszkody na horyzoncie gry.
4. **Fizyka / Detekcja Kolizji:** Oprogramuj zdarzenia przecięcia siatek (np. matematycznie AABB wewnątrz useFrame albo stosując prosty silnik fizyczny). Jeżeli gracz zderzy się z twardą bryłą powiedz o "Game Over", a rzut pocisku w przeszkodę niech ją usuwa/odznacza.

**Zakończenie:** Wynikiem musi być grywalny, interaktywny fragment kodu stanowiący klaster logiki gry.
