# Arcade Airplane Game - Specyfikacja (init.md)

## Koncept Gry
Zręcznościowa gra 3D w stylu "Arcade", w której gracz steruje samolotem, omija przeszkody i do nich strzela. Aplikacja ma pełnić rolę grywalnego prototypu, w którym główny nacisk kładzie się na płynne sterowanie modelem i dynamiczną rozgrywkę.

## Oczekiwana Technologia
Najlepiej oparta na ekosystemie WebGL: **Three.js** lub **React Three Fiber (R3F)** w połączeniu z **Vite**.

## Mechanika i Logika
1. **Ruch Statku:** Samolot stabilnie leci naprzód (efekt auto-forward poprzez przesuwanie środowiska lub fizyczny ruch kamery/statku). Gracz ma kontrolę w płaszczyznach X/Y (lewo-prawo, góra-dół), by unikać przeszkód. Samolot powinien delikatnie "przechylać się" przy skrętach (tzw. banking).
2. **Strzelanie:** Pojazd posiada możliwość wystrzeliwania pocisków.
3. **Przeszkody:** Na drodze gracza generują się losowe obiekty i przeszkody, z którymi statek reaguje na kolizje (zniszczenie po zderzeniu z pociskiem lub obrażenia/Game Over po uderzeniu samolotem).
4. **Punkty/Wynik:** Gracz zdobywa punkty za przeleciany dystans lub niszczone cele.

## Grafika i Styl 3D
- Styl preferowany: low-poly, żywa kolorystyka (tzw. styl Arcade).
- Płynne, czytelne oświetlenie kierunkowe (Directional / Hemisphere).
- Efekty cząsteczkowe (Particles) stosowane przy wypuszczaniu spalin samolotu i wybuchach.

## Interfejs 2D i UI (Overlay)
- **Ekran Startowy:** Ładne, stylowe menu główne pokazujące trójwymiarowe tło w rozmyciu i przycisk START.
- **HUD:** Widoczny licznik punktów oraz aktualny stan gry.
- **Ekran Końcowy (Game Over):** Informacja o przegranej wywołana przez zderzenie i przycisk do ponownego uruchomienia.
